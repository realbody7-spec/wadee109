import express from 'express';
import cors from 'cors';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import axios from 'axios';
import {
  startScheduler,
  reloadSchedules,
  triggerNotification,
  addSseClient,
  removeSseClient,
  getSseClientsCount
} from './scheduler.js';
import { sendLineNotify, sendLinePush, sendLineReply } from './services/lineService.js';
import { sendMessengerMessage } from './services/messengerService.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));
app.use('/uploads', express.static(path.join(__dirname, 'public', 'uploads')));
app.use(express.static(path.join(__dirname, 'public')));

const SOPS_FILE = path.join(__dirname, 'data', 'sops.json');
const SCHEDULES_FILE = path.join(__dirname, 'data', 'schedules.json');
const SETTINGS_FILE = path.join(__dirname, 'data', 'settings.json');
const LOGS_FILE = path.join(__dirname, 'data', 'logs.json');
const INVENTORY_FILE = path.join(__dirname, 'data', 'inventory.json');
const POS_SALES_FILE = path.join(__dirname, 'data', 'pos_sales.json');
const USERS_FILE = path.join(__dirname, 'data', 'users.json');


// File Helper functions
function readData(filePath, defaultVal = []) {
  try {
    if (!fs.existsSync(filePath)) {
      fs.writeFileSync(filePath, JSON.stringify(defaultVal, null, 2));
      return defaultVal;
    }
    const raw = fs.readFileSync(filePath, 'utf8');
    return JSON.parse(raw || JSON.stringify(defaultVal));
  } catch (error) {
    console.error(`Error reading ${filePath}:`, error);
    return defaultVal;
  }
}

function writeData(filePath, data) {
  try {
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
    return true;
  } catch (error) {
    console.error(`Error writing ${filePath}:`, error);
    return false;
  }
}

// --- Status API ---
app.get('/api/status', (req, res) => {
  res.json({
    status: "online",
    message: "Welcome to the Restaurant SOP Notifier Backend API",
    endpoints: {
      sops: "/api/sops",
      schedules: "/api/schedules",
      settings: "/api/settings",
      logs: "/api/logs",
      events: "/api/events"
    }
  });
});

// --- SOP API ---
app.get('/api/sops', (req, res) => {
  res.json(readData(SOPS_FILE, []));
});

app.post('/api/sops', (req, res) => {
  const sops = readData(SOPS_FILE, []);
  const newSop = {
    id: `sop-${Date.now()}`,
    title: req.body.title || 'SOP ใหม่',
    category: req.body.category || 'general',
    description: req.body.description || '',
    steps: req.body.steps || [],
    targetStaff: req.body.targetStaff || 'All Staff',
    createdAt: new Date().toISOString()
  };
  sops.push(newSop);
  writeData(SOPS_FILE, sops);
  res.status(201).json(newSop);
});

app.put('/api/sops/:id', (req, res) => {
  const sops = readData(SOPS_FILE, []);
  const index = sops.findIndex(s => s.id === req.params.id);
  if (index === -1) {
    return res.status(404).json({ error: 'SOP not found' });
  }

  const updatedSop = {
    ...sops[index],
    title: req.body.title ?? sops[index].title,
    category: req.body.category ?? sops[index].category,
    description: req.body.description ?? sops[index].description,
    steps: req.body.steps ?? sops[index].steps,
    targetStaff: req.body.targetStaff ?? sops[index].targetStaff
  };

  sops[index] = updatedSop;
  writeData(SOPS_FILE, sops);

  // Sync scheduled tasks cached SOP titles
  const schedules = readData(SCHEDULES_FILE, []);
  let schedChanged = false;
  const updatedSchedules = schedules.map(s => {
    if (s.sopId === req.params.id) {
      schedChanged = true;
      return { ...s, sopTitle: updatedSop.title };
    }
    return s;
  });
  if (schedChanged) {
    writeData(SCHEDULES_FILE, updatedSchedules);
    reloadSchedules();
  }

  res.json(updatedSop);
});

app.delete('/api/sops/:id', (req, res) => {
  const sops = readData(SOPS_FILE, []);
  const filtered = sops.filter(s => s.id !== req.params.id);
  writeData(SOPS_FILE, filtered);

  // Also disable any schedules linked to this SOP
  const schedules = readData(SCHEDULES_FILE, []);
  const updatedSchedules = schedules.map(s => {
    if (s.sopId === req.params.id) {
      return { ...s, active: false };
    }
    return s;
  });
  writeData(SCHEDULES_FILE, updatedSchedules);
  reloadSchedules();

  res.json({ success: true });
});

// --- SCHEDULES API ---
app.get('/api/schedules', (req, res) => {
  res.json(readData(SCHEDULES_FILE, []));
});

app.post('/api/schedules', (req, res) => {
  const schedules = readData(SCHEDULES_FILE, []);
  const sops = readData(SOPS_FILE, []);
  const linkedSop = sops.find(s => s.id === req.body.sopId);

  const newSchedule = {
    id: `sched-${Date.now()}`,
    sopId: req.body.sopId,
    sopTitle: linkedSop ? linkedSop.title : 'ไม่ระบุ SOP',
    name: req.body.name || 'ตารางแจ้งเตือนใหม่',
    cronExpression: req.body.cronExpression || '0 9 * * *',
    channels: req.body.channels || ['line_notify'],
    active: req.body.active !== false,
    lastRun: null
  };

  schedules.push(newSchedule);
  writeData(SCHEDULES_FILE, schedules);
  reloadSchedules();
  res.status(201).json(newSchedule);
});

app.put('/api/schedules/:id', (req, res) => {
  const schedules = readData(SCHEDULES_FILE, []);
  const index = schedules.findIndex(s => s.id === req.params.id);
  if (index === -1) {
    return res.status(404).json({ error: 'Schedule not found' });
  }

  const sops = readData(SOPS_FILE, []);
  const linkedSop = sops.find(s => s.id === (req.body.sopId || schedules[index].sopId));

  const updatedSchedule = {
    ...schedules[index],
    sopId: req.body.sopId ?? schedules[index].sopId,
    sopTitle: linkedSop ? linkedSop.title : (schedules[index].sopTitle || 'ไม่ระบุ SOP'),
    name: req.body.name ?? schedules[index].name,
    cronExpression: req.body.cronExpression ?? schedules[index].cronExpression,
    channels: req.body.channels ?? schedules[index].channels,
    active: req.body.active ?? schedules[index].active
  };

  schedules[index] = updatedSchedule;
  writeData(SCHEDULES_FILE, schedules);
  reloadSchedules();
  res.json(updatedSchedule);
});

app.delete('/api/schedules/:id', (req, res) => {
  const schedules = readData(SCHEDULES_FILE, []);
  const filtered = schedules.filter(s => s.id !== req.params.id);
  writeData(SCHEDULES_FILE, filtered);
  reloadSchedules();
  res.json({ success: true });
});

// Force trigger a notification immediately (For testing purposes)
app.post('/api/schedules/:id/trigger', async (req, res) => {
  try {
    await triggerNotification(req.params.id, true);
    res.json({ success: true, message: 'Notification triggered manually' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// --- SETTINGS API ---
app.get('/api/settings', (req, res) => {
  res.json(readData(SETTINGS_FILE, {}));
});

app.put('/api/settings', (req, res) => {
  const currentSettings = readData(SETTINGS_FILE, {});
  const newSettings = {
    ...currentSettings,
    simulationMode: req.body.simulationMode ?? currentSettings.simulationMode,
    lineNotifyToken: req.body.lineNotifyToken ?? currentSettings.lineNotifyToken,
    lineChannelAccessToken: req.body.lineChannelAccessToken ?? currentSettings.lineChannelAccessToken,
    lineUserId: req.body.lineUserId ?? currentSettings.lineUserId,
    lineChannelSecret: req.body.lineChannelSecret ?? currentSettings.lineChannelSecret,
    googleSheetWebhookUrl: req.body.googleSheetWebhookUrl ?? currentSettings.googleSheetWebhookUrl,
    driveFolderId: req.body.driveFolderId ?? currentSettings.driveFolderId,
    messengerPageAccessToken: req.body.messengerPageAccessToken ?? currentSettings.messengerPageAccessToken,
    messengerRecipientId: req.body.messengerRecipientId ?? currentSettings.messengerRecipientId
  };
  writeData(SETTINGS_FILE, newSettings);
  res.json(newSettings);
});

// Test line notify directly
app.post('/api/settings/test-line', async (req, res) => {
  const { token, message } = req.body;
  if (!token) return res.status(400).json({ error: 'Token is required' });
  const result = await sendLineNotify(token, message || '📢 ข้อความทดสอบการเชื่อมต่อระบบร้านอาหาร LINE Notify สำเร็จ!');
  res.json(result);
});

// Test Messenger directly
app.post('/api/settings/test-messenger', async (req, res) => {
  const { pageAccessToken, recipientId, message } = req.body;
  if (!pageAccessToken || !recipientId) {
    return res.status(400).json({ error: 'Page access token and Recipient ID are required' });
  }
  const result = await sendMessengerMessage(
    pageAccessToken,
    recipientId,
    message || '📢 ข้อความทดสอบการเชื่อมต่อ Facebook Messenger สำเร็จ!'
  );
  res.json(result);
});

// --- USERS & AUTH API ---
app.post('/api/auth/login', (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ success: false, message: 'กรุณากรอกชื่อผู้ใช้และรหัสผ่าน' });
  }

  const users = readData(USERS_FILE, []);
  const user = users.find(u => u.username.toLowerCase() === username.toLowerCase().trim() && u.password === password.toString().trim());

  if (!user) {
    return res.status(401).json({ success: false, message: 'ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง' });
  }

  res.json({
    success: true,
    user: {
      id: user.id,
      username: user.username,
      name: user.name,
      role: user.role
    }
  });
});

app.get('/api/users', (req, res) => {
  const users = readData(USERS_FILE, []);
  const safeUsers = users.map(({ password, ...u }) => u);
  res.json(safeUsers);
});

app.post('/api/users', (req, res) => {
  const { username, password, name, role } = req.body;
  if (!username || !password || !name || !role) {
    return res.status(400).json({ error: 'กรุณากรอกข้อมูลให้ครบถ้วน: ชื่อผู้ใช้, รหัสผ่าน, ชื่อแสดงตัว, และบทบาท' });
  }

  const users = readData(USERS_FILE, []);
  const exists = users.some(u => u.username.toLowerCase() === username.toLowerCase().trim());
  if (exists) {
    return res.status(400).json({ error: 'ชื่อผู้ใช้นี้มีอยู่ในระบบแล้ว' });
  }

  const newUser = {
    id: `user-${Date.now()}`,
    username: username.trim(),
    password: password.toString().trim(),
    name: name.trim(),
    role: role
  };

  users.push(newUser);
  writeData(USERS_FILE, users);
  res.status(201).json({
    success: true,
    user: {
      id: newUser.id,
      username: newUser.username,
      name: newUser.name,
      role: newUser.role
    }
  });
});

app.delete('/api/users/:id', (req, res) => {
  const users = readData(USERS_FILE, []);
  const userToDelete = users.find(u => u.id === req.params.id);

  if (!userToDelete) {
    return res.status(404).json({ error: 'ไม่พบผู้ใช้ที่ต้องการลบ' });
  }

  if (userToDelete.username === 'manager') {
    return res.status(400).json({ error: 'ไม่สามารถลบบัญชีผู้จัดการหลัก (manager) ได้' });
  }

  const filtered = users.filter(u => u.id !== req.params.id);
  writeData(USERS_FILE, filtered);
  res.json({ success: true });
});

// --- LOGS API ---
app.get('/api/logs', (req, res) => {
  res.json(readData(LOGS_FILE, []));
});

app.delete('/api/logs', (req, res) => {
  writeData(LOGS_FILE, []);
  res.json({ success: true });
});

// --- INVENTORY API ---
app.get('/api/inventory', (req, res) => {
  res.json(readData(INVENTORY_FILE, []));
});

app.post('/api/inventory', (req, res) => {
  const items = readData(INVENTORY_FILE, []);
  
  let imagePath = null;
  if (req.body.image && req.body.image.startsWith('data:image/')) {
    try {
      const matches = req.body.image.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
      if (matches && matches.length === 3) {
        const ext = matches[1].split('/')[1] || 'jpeg';
        const dataBuffer = Buffer.from(matches[2], 'base64');
        
        const uploadDir = path.join(__dirname, 'public', 'uploads');
        if (!fs.existsSync(uploadDir)) {
          fs.mkdirSync(uploadDir, { recursive: true });
        }
        
        const filename = `bill-${Date.now()}.${ext}`;
        const filepath = path.join(uploadDir, filename);
        fs.writeFileSync(filepath, dataBuffer);
        
        imagePath = `/uploads/${filename}`;
      }
    } catch (err) {
      console.error('Error saving image file:', err);
    }
  } else if (req.body.image) {
    imagePath = req.body.image;
  }

  const newItem = {
    id: `inv-${Date.now()}`,
    date: req.body.date || new Date().toISOString(),
    name: req.body.name || 'วัตถุดิบใหม่',
    category: req.body.category || 'others',
    quantity: parseFloat(req.body.quantity) || 0,
    unit: req.body.unit || 'units',
    cost: parseFloat(req.body.cost) || 0,
    billNumber: req.body.billNumber || '',
    image: imagePath,
    portionSize: parseFloat(req.body.portionSize) || 1,
    portionUnit: req.body.portionUnit || req.body.unit || 'units',
    associatedPosItem: req.body.associatedPosItem || ''
  };
  items.push(newItem);
  writeData(INVENTORY_FILE, items);

  // Sync to Google Sheets if webhook URL is configured
  const settings = readData(SETTINGS_FILE, {});
  if (settings.googleSheetWebhookUrl) {
    let base64Image = null;
    if (imagePath && imagePath.startsWith('/uploads/')) {
      try {
        const filepath = path.join(__dirname, 'public', 'uploads', path.basename(imagePath));
        if (fs.existsSync(filepath)) {
          const fileBuffer = fs.readFileSync(filepath);
          const mimeType = imagePath.endsWith('.png') ? 'image/png' : 'image/jpeg';
          base64Image = `data:${mimeType};base64,${fileBuffer.toString('base64')}`;
        }
      } catch (readErr) {
        console.error('[Google Sheets Sync] Error reading temporary file for base64:', readErr.message);
      }
    }

    const payload = {
      ...newItem,
      imageBase64: base64Image || req.body.image,
      driveFolderId: settings.driveFolderId || ''
    };

    axios.post(settings.googleSheetWebhookUrl, payload)
      .then(async (response) => {
        console.log(`[Google Sheets] Synced: ${newItem.name}`);
        if (response.data && response.data.success && response.data.imageUrl && response.data.imageUrl.startsWith('http')) {
          const driveUrl = response.data.imageUrl;
          console.log(`[Google Drive] Image saved: ${driveUrl}`);

          // Update local database item with Google Drive URL
          const currentItems = readData(INVENTORY_FILE, []);
          const updatedItems = currentItems.map(item => {
            if (item.id === newItem.id) {
              return { ...item, image: driveUrl };
            }
            return item;
          });
          writeData(INVENTORY_FILE, updatedItems);

          // Delete local file to save space on disk
          if (imagePath && imagePath.startsWith('/uploads/')) {
            try {
              const filename = path.basename(imagePath);
              const filepath = path.join(__dirname, 'public', 'uploads', filename);
              if (fs.existsSync(filepath)) {
                fs.unlinkSync(filepath);
                console.log(`[Local Disk] Deleted temporary file: ${filename}`);
              }
            } catch (delErr) {
              console.error('[Local Disk] Error deleting temporary file:', delErr.message);
            }
          }
        }
      })
      .catch(err => console.error(`[Google Sheets] Sync error: ${err.message}`));
  }

  res.status(201).json(newItem);
});

app.delete('/api/inventory/:id', (req, res) => {
  const items = readData(INVENTORY_FILE, []);
  const itemToDelete = items.find(item => item.id === req.params.id);
  
  if (itemToDelete && itemToDelete.image && itemToDelete.image.startsWith('/uploads/')) {
    try {
      const filename = path.basename(itemToDelete.image);
      const filepath = path.join(__dirname, 'public', 'uploads', filename);
      if (fs.existsSync(filepath)) {
        fs.unlinkSync(filepath);
      }
    } catch (err) {
      console.error('Error deleting image file:', err);
    }
  }

  const filtered = items.filter(item => item.id !== req.params.id);
  writeData(INVENTORY_FILE, filtered);
  res.json({ success: true });
});

// --- POS SALES API ---
app.get('/api/pos-sales', (req, res) => {
  res.json(readData(POS_SALES_FILE, []));
});

app.post('/api/pos-sales/import', (req, res) => {
  const newSales = req.body.sales || []; // Expected array of { itemName: string, quantitySold: number }
  const sales = readData(POS_SALES_FILE, []);
  
  const processedSales = newSales.map(item => ({
    id: `sale-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    importDate: new Date().toISOString(),
    itemName: item.itemName || 'เมนูขาย',
    quantitySold: parseInt(item.quantitySold) || 0
  }));

  sales.push(...processedSales);
  writeData(POS_SALES_FILE, sales);
  res.status(201).json({ success: true, count: processedSales.length, data: processedSales });
});

app.delete('/api/pos-sales', (req, res) => {
  writeData(POS_SALES_FILE, []);
  res.json({ success: true });
});

// --- RECONCILIATION API ---
app.get('/api/reconciliation', (req, res) => {
  const inventory = readData(INVENTORY_FILE, []);
  const posSales = readData(POS_SALES_FILE, []);

  // 1. Group inventory items by name and calculate potential servings
  const rawMaterialSummary = {};

  inventory.forEach(item => {
    const key = item.name.trim();
    if (!rawMaterialSummary[key]) {
      rawMaterialSummary[key] = {
        name: key,
        category: item.category,
        totalQuantity: 0,
        unit: item.unit,
        totalCost: 0,
        portionSize: item.portionSize,
        portionUnit: item.portionUnit,
        associatedPosItem: item.associatedPosItem || key,
        potentialServings: 0,
        itemsCount: 0
      };
    }

    const summary = rawMaterialSummary[key];
    summary.totalQuantity += item.quantity;
    summary.totalCost += item.cost;
    summary.itemsCount += 1;

    // Servings calculation for this batch: quantity / portionSize
    const itemServings = item.portionSize > 0 ? (item.quantity / item.portionSize) : 0;
    summary.potentialServings += itemServings;
  });

  // Convert summary map to array
  const summaryList = Object.values(rawMaterialSummary);

  // 2. Sum POS sales by item name
  const salesMap = {};
  posSales.forEach(sale => {
    const key = sale.itemName.trim();
    salesMap[key] = (salesMap[key] || 0) + sale.quantitySold;
  });

  // 3. Reconcile inventory potential servings with POS sales
  const reconciliationData = summaryList.map(raw => {
    const posKey = (raw.associatedPosItem || raw.name).trim();
    const actualSold = salesMap[posKey] || 0;

    // Discrepancy: Potential Servings (Received) - Actual Servings (Sold)
    const discrepancy = Math.max(0, raw.potentialServings - actualSold);
    const discrepancyPercentage = raw.potentialServings > 0 
      ? parseFloat(((discrepancy / raw.potentialServings) * 100).toFixed(1))
      : 0;

    return {
      ...raw,
      potentialServings: Math.round(raw.potentialServings),
      actualSold,
      discrepancy: Math.round(discrepancy),
      discrepancyPercentage,
      posItemMatched: posKey
    };
  });

  res.json({
    reconciliation: reconciliationData,
    totalPOSItemsSold: Object.keys(salesMap).length,
    totalRawMaterials: reconciliationData.length
  });
});


// Test Google Sheets webhook
app.post('/api/settings/test-sheet', async (req, res) => {
  const { webhookUrl, driveFolderId } = req.body;
  if (!webhookUrl) {
    return res.status(400).json({ error: 'Webhook URL is required' });
  }

  const settings = readData(SETTINGS_FILE, {});
  const folderIdToUse = driveFolderId ?? settings.driveFolderId;

  try {
    const response = await axios.post(webhookUrl, {
      date: new Date().toISOString(),
      name: 'ทดสอบวัตถุดิบด่วน (Test Material)',
      category: 'others',
      quantity: 5,
      unit: 'kg',
      cost: 450,
      billNumber: 'BILL-TEST-101',
      portionSize: 0.2,
      portionUnit: 'kg',
      associatedPosItem: 'เมนูทดสอบ',
      driveFolderId: folderIdToUse || ''
    });

    if (response.status === 200 || response.status === 201) {
      res.json({ success: true, message: 'ส่งข้อมูลทดสอบสำเร็จ! กรุณาตรวจสอบใน Google Sheets ของคุณ' });
    } else {
      res.json({ success: false, message: `Google Sheets ตอบกลับสถานะ: ${response.status}` });
    }
  } catch (error) {
    console.error('[Google Sheets Test Error]:', error.message);
    res.json({ success: false, message: `ล้มเหลวในการเชื่อมต่อ: ${error.message}` });
  }
});

// LINE Webhook Endpoint for interactive bot queries
app.post('/api/line/webhook', async (req, res) => {
  const events = req.body.events || [];
  const settings = readData(SETTINGS_FILE, {});
  const channelAccessToken = settings.lineChannelAccessToken;

  if (!channelAccessToken) {
    console.warn('[Line Webhook] Access token is missing in settings. Webhook request ignored.');
    return res.sendStatus(200);
  }

  for (const event of events) {
    if (event.type === 'message' && event.message.type === 'text') {
      const userText = event.message.text.trim();
      const userTextLower = userText.toLowerCase();
      const replyToken = event.replyToken;

      let replyText = '';

      if (userTextLower === 'คลัง' || userTextLower === 'เช็คคลัง' || userTextLower.includes('inventory') || userTextLower.includes('วัตถุดิบ')) {
        const inventory = readData(INVENTORY_FILE, []);
        if (inventory.length === 0) {
          replyText = '📦 คลังวัตถุดิบในระบบว่างเปล่า ยังไม่มีรายการรับเข้า';
        } else {
          // Group by name
          const grouped = {};
          inventory.forEach(item => {
            const name = item.name.trim();
            if (!grouped[name]) {
              grouped[name] = { name, quantity: 0, unit: item.unit, potentialServings: 0 };
            }
            grouped[name].quantity += item.quantity;
            const servings = item.portionSize > 0 ? (item.quantity / item.portionSize) : 0;
            grouped[name].potentialServings += servings;
          });

          replyText = '📦 รายงานคลังวัตถุดิบคงเหลือปัจจุบัน:\n';
          Object.values(grouped).forEach((item, idx) => {
            replyText += `${idx + 1}. ${item.name}: ${item.quantity.toLocaleString()} ${item.unit} (ทำได้ ${Math.round(item.potentialServings)} เสิร์ฟ)\n`;
          });
          replyText += '\nพิมพ์ "สรุปยอด" เพื่อดูอัตราของเสียและการกระทบยอดขาย';
        }
      } else if (userTextLower === 'สรุปยอด' || userTextLower === 'กระทบยอด' || userTextLower.includes('recon') || userTextLower.includes('ของเสีย')) {
        const inventory = readData(INVENTORY_FILE, []);
        const posSales = readData(POS_SALES_FILE, []);
        
        const rawMaterialSummary = {};
        inventory.forEach(item => {
          const key = item.name.trim();
          if (!rawMaterialSummary[key]) {
            rawMaterialSummary[key] = {
              name: key,
              totalQuantity: 0,
              unit: item.unit,
              potentialServings: 0,
              associatedPosItem: item.associatedPosItem || key
            };
          }
          const summary = rawMaterialSummary[key];
          summary.totalQuantity += item.quantity;
          const servings = item.portionSize > 0 ? (item.quantity / item.portionSize) : 0;
          summary.potentialServings += servings;
        });

        const salesMap = {};
        posSales.forEach(sale => {
          const key = sale.itemName.trim();
          salesMap[key] = (salesMap[key] || 0) + sale.quantitySold;
        });

        replyText = '📊 สรุปยอดขายจริง vs คลังวัตถุดิบ:\n\n';
        const reconList = Object.values(rawMaterialSummary);
        if (reconList.length === 0) {
          replyText += 'ไม่มีข้อมูลกระทบยอดสะสมในระบบ';
        } else {
          reconList.forEach((raw, idx) => {
            const posKey = (raw.associatedPosItem || raw.name).trim();
            const actualSold = salesMap[posKey] || 0;
            const potential = Math.round(raw.potentialServings);
            const discrepancy = Math.max(0, potential - actualSold);
            const discrepancyPercent = potential > 0 ? ((discrepancy / potential) * 100).toFixed(1) : 0;

            replyText += `${idx + 1}. ${raw.name} (POS: ${posKey})\n`;
            replyText += `   - ซื้อ/รับเข้า: ${potential} เสิร์ฟ\n`;
            replyText += `   - ขายจริง (POS): ${actualSold} เสิร์ฟ\n`;
            if (discrepancy > 0) {
              replyText += `   - ส่วนต่างของเสีย: ⚠️ ${discrepancy} เสิร์ฟ (${discrepancyPercent}%)\n`;
            } else {
              replyText += `   - ส่วนต่างของเสีย: ✅ ตรงกันครบถ้วน (0%)\n`;
            }
            replyText += '\n';
          });
        }
      } else {
        replyText = `สวัสดีครับ 🤖 บอทจัดการร้านอาหาร ยินดีให้บริการ

คุณสามารถตรวจสอบข้อมูลได้โดยส่งคำสั่งแชทเข้ามาหาผม:
1️⃣ พิมพ์ 'คลัง' หรือ 'เช็คคลัง' - เพื่อตรวจสอบวัตถุดิบคงเหลือและศักยภาพจานเสิร์ฟ
2️⃣ พิมพ์ 'สรุปยอด' - เพื่อดูการเปรียบเทียบยอดขายและของเสียวัตถุดิบ`;
      }

      // Send reply message
      try {
        await sendLineReply(channelAccessToken, replyToken, replyText);
      } catch (webhookErr) {
        console.error('[Line Webhook] Reply send error:', webhookErr.message);
      }
    }
  }

  res.sendStatus(200);
});

// --- SSE (Server-Sent Events) ---
app.get('/api/events', (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders();

  addSseClient(res);
  console.log(`[SSE] Client connected. Active clients: ${getSseClientsCount()}`);

  req.on('close', () => {
    removeSseClient(res);
    console.log(`[SSE] Client disconnected. Active clients: ${getSseClientsCount()}`);
  });
});

// Catch-all route to serve the React frontend index.html
app.get('*', (req, res) => {
  const indexPath = path.join(__dirname, 'public', 'index.html');
  if (fs.existsSync(indexPath)) {
    res.sendFile(indexPath);
  } else {
    res.status(404).send('Not Found');
  }
});

// Start server and cron scheduler
app.listen(PORT, () => {
  console.log(`[Server] Backend running on http://localhost:${PORT}`);
  startScheduler();
});
