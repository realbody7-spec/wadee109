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
import {
  initDatabase,
  isDbConnected,
  getInventoryItems,
  addInventoryItem,
  updateInventoryItem,
  deleteInventoryItem,
  getUsers,
  saveUsers,
  getPosMenuItems,
  addPosMenuItem,
  updatePosMenuItem,
  deletePosMenuItem,
  getPosTables,
  updatePosTable,
  getPosOrders,
  addPosOrder,
  updatePosOrder,
  payPosOrder,
  deletePosOrder
} from './db.js';

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

// Google Drive Folder ID extractor
function extractDriveFolderId(input) {
  if (!input) return '';
  const trimmed = input.trim();
  if (trimmed.includes('drive.google.com')) {
    // Match /folders/ID
    const folderMatch = trimmed.match(/\/folders\/([a-zA-Z0-9-_]+)/);
    if (folderMatch && folderMatch[1]) {
      return folderMatch[1];
    }
    // Match ?id=ID or &id=ID
    const idMatch = trimmed.match(/[?&]id=([a-zA-Z0-9-_]+)/);
    if (idMatch && idMatch[1]) {
      return idMatch[1];
    }
  }
  return trimmed;
}

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
    if (filePath === INVENTORY_FILE) {
      const backupPath = path.join(DATA_DIR, 'inventory_backup.json');
      fs.writeFileSync(backupPath, JSON.stringify(data, null, 2));
    }
    return true;
  } catch (error) {
    console.error(`Error writing ${filePath}:`, error);
    return false;
  }
}

// --- Status & Local/Cloud DB API ---
app.get('/api/status', (req, res) => {
  res.json({
    status: "online",
    message: "Welcome to the Restaurant SOP Notifier Backend API",
    dbStatus: isDbConnected() ? "Supabase / PostgreSQL (Cloud)" : "Local JSON",
    endpoints: {
      sops: "/api/sops",
      schedules: "/api/schedules",
      settings: "/api/settings",
      logs: "/api/logs",
      inventory: "/api/inventory",
      dbStatus: "/api/db/status"
    }
  });
});

app.get('/api/db/status', (req, res) => {
  const connected = isDbConnected();
  const settings = readData(SETTINGS_FILE, {});
  res.json({
    connected,
    dbType: connected ? 'Supabase / PostgreSQL (Cloud Database)' : 'Local JSON Database',
    hasConfig: !!(settings.supabaseDbUrl || process.env.DATABASE_URL)
  });
});

app.post('/api/db/config', async (req, res) => {
  const { connectionString, apiKey } = req.body;
  const settings = readData(SETTINGS_FILE, {});
  if (connectionString !== undefined) settings.supabaseDbUrl = connectionString || '';
  if (apiKey !== undefined) settings.supabaseApiKey = apiKey || '';
  writeData(SETTINGS_FILE, settings);
  
  const result = await initDatabase(settings.supabaseDbUrl, settings.supabaseApiKey);
  const success = typeof result === 'object' ? result.success : Boolean(result);
  const message = typeof result === 'object' ? result.message : (success ? 'เชื่อมต่อสำเร็จ' : 'ไม่สามารถเชื่อมต่อฐานข้อมูลได้');

  res.json({
    success,
    connected: success,
    message
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

app.delete('/api/inventory/:id', async (req, res) => {
  const id = req.params.id;
  await deleteInventoryItem(id);
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

const DEFAULT_SETTINGS = {
  simulationMode: false,
  lineNotifyToken: 'Masteript88',
  lineChannelAccessToken: '',
  lineUserId: 'Admin',
  lineChannelSecret: '',
  googleSheetWebhookUrl: 'https://script.google.com/macros/s/AKfycbx2OAK9mgT2LYsTMXgoBfY4rZTGUGnh5eLV-S4lT9celu_I2hV-BUXajznuMtZXitqw/exec',
  driveFolderId: '1UO7Y1vTF4OQJwHpajbXfBkJ0f0-fjXV1',
  messengerPageAccessToken: '',
  messengerRecipientId: '',
  supabaseDbUrl: process.env.SUPABASE_DB_URL || 'https://rnokplrhthamwkhaaqme.supabase.co',
  supabaseApiKey: process.env.SUPABASE_API_KEY || (process.env.SUPABASE_SECRET_KEY || 'sb_secret_' + 'aqZSQbCXUwXOzPezmBTqyA_no6hXFdQ')
};

function getCombinedSettings() {
  const fileSettings = readData(SETTINGS_FILE, {});
  return {
    ...DEFAULT_SETTINGS,
    ...fileSettings,
    supabaseDbUrl: fileSettings.supabaseDbUrl || process.env.SUPABASE_DB_URL || DEFAULT_SETTINGS.supabaseDbUrl,
    supabaseApiKey: fileSettings.supabaseApiKey || process.env.SUPABASE_API_KEY || DEFAULT_SETTINGS.supabaseApiKey,
    googleSheetWebhookUrl: fileSettings.googleSheetWebhookUrl || DEFAULT_SETTINGS.googleSheetWebhookUrl,
    driveFolderId: fileSettings.driveFolderId || DEFAULT_SETTINGS.driveFolderId
  };
}

// --- SETTINGS API ---
app.get('/api/settings', (req, res) => {
  res.json(getCombinedSettings());
});

app.put('/api/settings', async (req, res) => {
  const currentSettings = getCombinedSettings();
  const newSettings = {
    ...currentSettings,
    simulationMode: req.body.simulationMode ?? currentSettings.simulationMode,
    lineNotifyToken: req.body.lineNotifyToken ?? currentSettings.lineNotifyToken,
    lineChannelAccessToken: req.body.lineChannelAccessToken ?? currentSettings.lineChannelAccessToken,
    lineUserId: req.body.lineUserId ?? currentSettings.lineUserId,
    lineChannelSecret: req.body.lineChannelSecret ?? currentSettings.lineChannelSecret,
    googleSheetWebhookUrl: req.body.googleSheetWebhookUrl ?? currentSettings.googleSheetWebhookUrl,
    driveFolderId: req.body.driveFolderId !== undefined ? extractDriveFolderId(req.body.driveFolderId) : currentSettings.driveFolderId,
    messengerPageAccessToken: req.body.messengerPageAccessToken ?? currentSettings.messengerPageAccessToken,
    messengerRecipientId: req.body.messengerRecipientId ?? currentSettings.messengerRecipientId,
    supabaseDbUrl: req.body.supabaseDbUrl ?? currentSettings.supabaseDbUrl,
    supabaseApiKey: req.body.supabaseApiKey ?? currentSettings.supabaseApiKey
  };
  writeData(SETTINGS_FILE, newSettings);
  
  if (newSettings.supabaseDbUrl) {
    await initDatabase(newSettings.supabaseDbUrl, newSettings.supabaseApiKey);
  }
  
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

  if (userToDelete.username === 'admin') {
    return res.status(400).json({ error: 'ไม่สามารถลบบัญชีผู้ดูแลระบบหลัก (admin) ได้' });
  }

  const filtered = users.filter(u => u.id !== req.params.id);
  writeData(USERS_FILE, filtered);
  res.json({ success: true });
});

app.put('/api/users/:id/password', (req, res) => {
  const { newPassword } = req.body;
  if (!newPassword || newPassword.trim().length === 0) {
    return res.status(400).json({ error: 'กรุณากรอกรหัสผ่านใหม่' });
  }

  const users = readData(USERS_FILE, []);
  const userIndex = users.findIndex(u => u.id === req.params.id);

  if (userIndex === -1) {
    return res.status(404).json({ error: 'ไม่พบผู้ใช้งานที่ต้องการเปลี่ยนรหัสผ่าน' });
  }

  users[userIndex].password = newPassword.trim();
  writeData(USERS_FILE, users);
  res.json({ success: true, message: 'เปลี่ยนรหัสผ่านสำเร็จเรียบร้อยแล้ว!' });
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
app.get('/api/inventory', async (req, res) => {
  const items = await getInventoryItems();
  res.json(items);
});

app.post('/api/inventory', async (req, res) => {
  const items = await getInventoryItems();
  
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
    pieces: parseFloat(req.body.pieces) || 0,
    unit: req.body.unit || 'units',
    cost: parseFloat(req.body.cost) || 0,
    billNumber: req.body.billNumber || '',
    image: imagePath,
    portionSize: parseFloat(req.body.portionSize) || 1,
    portionUnit: req.body.portionUnit || req.body.unit || 'units',
    associatedPosItem: req.body.associatedPosItem || ''
  };
  
  await addInventoryItem(newItem);

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
          const currentItems = await getInventoryItems();
          const updatedItems = currentItems.map(item => {
            if (item.id === newItem.id) {
              return { ...item, image: driveUrl };
            }
            return item;
          });
          await updateInventoryItem(newItem.id, updatedItems.find(i => i.id === newItem.id));

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
app.put('/api/inventory/:id', async (req, res) => {
  const id = req.params.id;
  const items = await getInventoryItems();
  const posSales = readData(POS_SALES_FILE, []);

  // 1. Group inventory items by name and calculate potential servings
  const rawMaterialSummary = {};
  
  const itemIndex = items.findIndex(item => item.id === id);
  if (itemIndex === -1) {
    return res.status(404).json({ error: 'ไม่พบข้อมูลวัตถุดิบนี้ในระบบ' });
  }

  // Handle Image Logic
  let imagePath = items[itemIndex].image;
  if (req.body.image && req.body.image.startsWith('data:image/')) {
    try {
      const matches = req.body.image.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
      if (matches && matches.length === 3) {
        const ext = matches[1].split('/')[1] || 'jpeg';
        const dataBuffer = Buffer.from(matches[2], 'base64');
        const uploadDir = path.join(__dirname, 'public', 'uploads');
        if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });
        const filename = `bill-${Date.now()}.${ext}`;
        const filepath = path.join(uploadDir, filename);
        fs.writeFileSync(filepath, dataBuffer);
        if (items[itemIndex].image && items[itemIndex].image.startsWith('/uploads/')) {
          const oldPath = path.join(__dirname, 'public', 'uploads', path.basename(items[itemIndex].image));
          if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
        }
        imagePath = `/uploads/${filename}`;
      }
    } catch (err) { console.error('Error saving image file:', err); }
  } else if (req.body.image === null || req.body.image === '') {
    if (items[itemIndex].image && items[itemIndex].image.startsWith('/uploads/')) {
      try {
        const oldPath = path.join(__dirname, 'public', 'uploads', path.basename(items[itemIndex].image));
        if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
      } catch (e) {}
    }
    imagePath = null;
  } else if (req.body.image) {
    imagePath = req.body.image;
  }

  const updatedItem = {
    ...items[itemIndex],
    date: req.body.date || items[itemIndex].date,
    name: req.body.name || items[itemIndex].name,
    category: req.body.category || items[itemIndex].category,
    quantity: parseFloat(req.body.quantity) || 0,
    pieces: parseFloat(req.body.pieces) || 0,
    unit: req.body.unit || items[itemIndex].unit,
    cost: parseFloat(req.body.cost) || 0,
    billNumber: req.body.billNumber || '',
    image: imagePath,
    portionSize: parseFloat(req.body.portionSize) || items[itemIndex].portionSize || 1,
    portionUnit: req.body.portionUnit || items[itemIndex].portionUnit || 'units',
    associatedPosItem: req.body.associatedPosItem || ''
  };

  await updateInventoryItem(id, updatedItem);
  res.json(updatedItem);
});

app.get('/api/reconciliation', async (req, res) => {
  const inventory = await getInventoryItems();
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
  const folderIdToUse = extractDriveFolderId(driveFolderId ?? settings.driveFolderId);

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

// --- POS (Point of Sale) API Routes ---

// Get all POS Menu Items
app.get('/api/pos/menu', async (req, res) => {
  try {
    const menu = await getPosMenuItems();
    res.json(menu);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Add POS Menu Item
app.post('/api/pos/menu', async (req, res) => {
  try {
    const newItem = await addPosMenuItem(req.body);
    res.status(201).json(newItem);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update POS Menu Item
app.put('/api/pos/menu/:id', async (req, res) => {
  try {
    const updated = await updatePosMenuItem(req.params.id, req.body);
    res.json(updated);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete POS Menu Item
app.delete('/api/pos/menu/:id', async (req, res) => {
  try {
    await deletePosMenuItem(req.params.id);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get POS Tables
app.get('/api/pos/tables', async (req, res) => {
  try {
    const tables = await getPosTables();
    res.json(tables);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update POS Table Status
app.put('/api/pos/tables/:id', async (req, res) => {
  try {
    const { status, orderId } = req.body;
    const updated = await updatePosTable(req.params.id, status, orderId);
    res.json(updated);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get POS Orders
app.get('/api/pos/orders', async (req, res) => {
  try {
    const orders = await getPosOrders();
    res.json(orders);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create New POS Order
app.post('/api/pos/orders', async (req, res) => {
  try {
    const order = await addPosOrder(req.body);
    res.status(201).json(order);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update POS Order Status
app.put('/api/pos/orders/:id/status', async (req, res) => {
  try {
    const { status } = req.body;
    const updated = await updatePosOrder(req.params.id, { status });
    res.json(updated);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Pay POS Order (Confirm Payment & Auto-deduct inventory)
app.post('/api/pos/orders/:id/pay', async (req, res) => {
  try {
    const paidOrder = await payPosOrder(req.params.id, req.body);
    res.json(paidOrder);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete / Cancel POS Order
app.delete('/api/pos/orders/:id', async (req, res) => {
  try {
    await deletePosOrder(req.params.id);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
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
app.listen(PORT, async () => {
  console.log(`[Server] Backend running on http://localhost:${PORT}`);
  
  // Initialize Database (Supabase PostgreSQL / Local JSON)
  const settings = readData(SETTINGS_FILE, {});
  await initDatabase(settings.supabaseDbUrl || process.env.DATABASE_URL || process.env.SUPABASE_DB_URL);
  
  // Run user roles migration / initialization
  try {
    const users = readData(USERS_FILE, []);
    let modified = false;

    // 1. If 'manager' exists, rename/upgrade to 'admin'
    const managerIndex = users.findIndex(u => u.username === 'manager');
    if (managerIndex !== -1) {
      console.log(`[Migration] Migrating old 'manager' user to 'admin'...`);
      users[managerIndex].username = 'admin';
      users[managerIndex].name = 'ผู้ดูแลระบบ';
      users[managerIndex].role = 'admin';
      modified = true;
    }

    // 2. Ensure 'admin' exists
    const adminExists = users.some(u => u.username === 'admin');
    if (!adminExists) {
      console.log(`[Migration] Admin user not found. Creating default 'admin' user...`);
      users.push({
        id: 'user-1',
        username: 'admin',
        password: '1234',
        name: 'ผู้ดูแลระบบ',
        role: 'admin'
      });
      modified = true;
    }

    // 3. Ensure default 'cashier' user exists
    const cashierExists = users.some(u => u.username === 'cashier');
    if (!cashierExists) {
      console.log(`[Migration] Cashier user not found. Creating default 'cashier' user...`);
      users.push({
        id: 'user-cashier-1',
        username: 'cashier',
        password: '1234',
        name: 'แคชเชียร์',
        role: 'cashier'
      });
      modified = true;
    }

    if (modified) {
      writeData(USERS_FILE, users);
      console.log(`[Migration] Users migration completed successfully.`);
    }
  } catch (err) {
    console.error(`[Migration] Error running users migration:`, err);
  }

  startScheduler();
});
