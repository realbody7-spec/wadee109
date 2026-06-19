import cron from 'node-cron';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { sendLineNotify, sendLinePush } from './services/lineService.js';
import { sendMessengerMessage } from './services/messengerService.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const SOPS_FILE = path.join(__dirname, 'data', 'sops.json');
const SCHEDULES_FILE = path.join(__dirname, 'data', 'schedules.json');
const SETTINGS_FILE = path.join(__dirname, 'data', 'settings.json');
const LOGS_FILE = path.join(__dirname, 'data', 'logs.json');

// Memory storage for running cron jobs
let activeJobs = {};
// SSE client response objects
let clients = [];

export function addSseClient(res) {
  clients.push(res);
}

export function removeSseClient(res) {
  clients = clients.filter(c => c !== res);
}

export function getSseClientsCount() {
  return clients.length;
}

function broadcastEvent(eventData) {
  clients.forEach(client => {
    client.write(`data: ${JSON.stringify(eventData)}\n\n`);
  });
}

// Read data helper functions
function readJsonFile(filePath, defaultValue = []) {
  try {
    if (!fs.existsSync(filePath)) {
      fs.writeFileSync(filePath, JSON.stringify(defaultValue, null, 2));
      return defaultValue;
    }
    const data = fs.readFileSync(filePath, 'utf8');
    return JSON.parse(data || JSON.stringify(defaultValue));
  } catch (error) {
    console.error(`Error reading file ${filePath}:`, error);
    return defaultValue;
  }
}

function writeJsonFile(filePath, data) {
  try {
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
  } catch (error) {
    console.error(`Error writing file ${filePath}:`, error);
  }
}

// Convert category to Thai string
function getCategoryThai(cat) {
  const mapping = {
    opening: 'เปิดร้าน ☀️',
    closing: 'ปิดร้าน 🌙',
    kitchen: 'งานครัว 🍳',
    bar: 'งานบาร์ ☕',
    shift_handover: 'เปลี่ยนผลัด 🔄',
    cleaning: 'ทำความสะอาด 🧹'
  };
  return mapping[cat] || cat;
}

/**
 * Main trigger function that runs when a schedule timer fires
 */
export async function triggerNotification(scheduleId, forceManual = false) {
  const schedules = readJsonFile(SCHEDULES_FILE);
  const schedule = schedules.find(s => s.id === scheduleId);
  if (!schedule) return;

  const sops = readJsonFile(SOPS_FILE);
  const sop = sops.find(s => s.id === schedule.sopId);
  if (!sop) return;

  const settings = readJsonFile(SETTINGS_FILE, {});

  // Build the message
  const categoryThai = getCategoryThai(sop.category);
  const stepsList = sop.steps.map((s, index) => `${index + 1}. ${s.text}`).join('\n');
  const timestampStr = new Date().toLocaleString('th-TH');

  const message = `📢 แจ้งเตือนงานด่วน: ${schedule.name}\n` +
    `---------------------------------\n` +
    `📋 SOP: ${sop.title}\n` +
    `📂 ประเภท: ${categoryThai}\n` +
    `👥 กลุ่มผู้ปฏิบัติงาน: ${sop.targetStaff}\n` +
    `⏰ เวลาแจ้งเตือน: ${timestampStr}\n\n` +
    `📝 ขั้นตอนสำคัญที่ต้องทำ:\n${stepsList}\n\n` +
    `⚠️ กรุณาดำเนินการตามคู่มือ SOP และเช็กความเรียบร้อยในระบบ`;

  const logs = readJsonFile(LOGS_FILE);
  const channelsAttempted = schedule.channels;
  const isSimulation = settings.simulationMode;

  const logEntry = {
    id: `log-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    timestamp: new Date().toISOString(),
    sopId: sop.id,
    sopTitle: sop.title,
    scheduleName: schedule.name,
    channels: channelsAttempted,
    messageContent: message,
    status: isSimulation ? 'simulated' : 'success',
    details: isSimulation ? 'ดำเนินการส่งในโหมดจำลอง (Simulation Mode)' : ''
  };

  const results = [];

  if (isSimulation) {
    results.push('จำลองการแจ้งเตือนสำเร็จ (Simulation Success)');
  } else {
    // Send actual messages
    for (const channel of channelsAttempted) {
      if (channel === 'line_notify') {
        const res = await sendLineNotify(settings.lineNotifyToken, message);
        results.push(`LINE Notify: ${res.success ? 'สำเร็จ' : 'ล้มเหลว (' + res.message + ')'}`);
        if (!res.success) logEntry.status = 'failed';
      } else if (channel === 'line_push') {
        const res = await sendLinePush(settings.lineChannelAccessToken, settings.lineUserId, message);
        results.push(`LINE Push API: ${res.success ? 'สำเร็จ' : 'ล้มเหลว (' + res.message + ')'}`);
        if (!res.success) logEntry.status = 'failed';
      } else if (channel === 'messenger') {
        const res = await sendMessengerMessage(settings.messengerPageAccessToken, settings.messengerRecipientId, message);
        results.push(`Messenger: ${res.success ? 'สำเร็จ' : 'ล้มเหลว (' + res.message + ')'}`);
        if (!res.success) logEntry.status = 'failed';
      }
    }
    logEntry.details = results.join(' | ');
  }

  // Save the log
  logs.unshift(logEntry);
  if (logs.length > 100) {
    logs.pop(); // keep log history to max 100
  }
  writeJsonFile(LOGS_FILE, logs);

  // Update schedule lastRun timestamp
  if (!forceManual) {
    const updatedSchedules = schedules.map(s => {
      if (s.id === scheduleId) {
        return { ...s, lastRun: new Date().toISOString() };
      }
      return s;
    });
    writeJsonFile(SCHEDULES_FILE, updatedSchedules);
  }

  // Broadcast to SSE clients
  broadcastEvent({
    type: 'NOTIFICATION_TRIGGERED',
    log: logEntry,
    schedule: {
      id: schedule.id,
      lastRun: new Date().toISOString()
    }
  });

  console.log(`[Scheduler] Fired schedule: ${schedule.name} via [${channelsAttempted.join(', ')}]`);
}

/**
 * Clear existing cron jobs and reload active ones from schedules.json
 */
export function reloadSchedules() {
  console.log('[Scheduler] Reloading schedules...');
  
  // Stop all active jobs
  Object.keys(activeJobs).forEach(id => {
    activeJobs[id].stop();
    delete activeJobs[id];
  });

  const schedules = readJsonFile(SCHEDULES_FILE);
  let count = 0;

  schedules.forEach(schedule => {
    if (schedule.active && schedule.cronExpression) {
      try {
        // Validate cron expression before scheduling
        if (cron.validate(schedule.cronExpression)) {
          const task = cron.schedule(schedule.cronExpression, async () => {
            console.log(`[Scheduler] Cron triggered for job: ${schedule.name} (${schedule.id})`);
            await triggerNotification(schedule.id);
          });
          activeJobs[schedule.id] = task;
          count++;
        } else {
          console.warn(`[Scheduler] Invalid cron expression: "${schedule.cronExpression}" for schedule: ${schedule.name}`);
        }
      } catch (error) {
        console.error(`[Scheduler] Failed to schedule cron for: ${schedule.name}`, error);
      }
    }
  });

  console.log(`[Scheduler] Running ${count} active schedules.`);
}

/**
 * Initialize scheduler
 */
export function startScheduler() {
  reloadSchedules();
}
