import pg from 'pg';
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

const { Pool } = pg;

let pool = null;
let supabaseClient = null;
let isConnected = false;
let dbMode = 'json'; // 'postgres' | 'supabase_js' | 'json'

// Fallback JSON Paths
const DATA_DIR = path.join(process.cwd(), 'backend', 'data');

function getLocalData(fileName, defaultVal = []) {
  try {
    const filePath = path.join(DATA_DIR, fileName);
    if (fs.existsSync(filePath)) {
      return JSON.parse(fs.readFileSync(filePath, 'utf8'));
    }
  } catch (e) {
    console.error(`Error reading ${fileName}:`, e);
  }
  return defaultVal;
}

function saveLocalData(fileName, data) {
  try {
    const filePath = path.join(DATA_DIR, fileName);
    fs.mkdirSync(DATA_DIR, { recursive: true });
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
  } catch (e) {
    console.error(`Error saving ${fileName}:`, e);
  }
}

export async function initDatabase(connectionString, keyInput) {
  let fallbackUrl = '';
  let fallbackKey = '';
  try {
    const settingsPath = path.join(__dirname, 'data', 'settings.json');
    if (fs.existsSync(settingsPath)) {
      const s = JSON.parse(fs.readFileSync(settingsPath, 'utf8'));
      fallbackUrl = s.supabaseDbUrl || '';
      fallbackKey = s.supabaseApiKey || '';
    }
  } catch (e) {}

  const dbUrl = (connectionString || process.env.DATABASE_URL || process.env.SUPABASE_DB_URL || process.env.SUPABASE_URL || fallbackUrl || '').trim();
  const apiKey = (keyInput || process.env.SUPABASE_ANON_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_KEY || fallbackKey || '').trim();
  
  if (!dbUrl) {
    console.log('ℹ️ No DATABASE_URL provided. Running with Local JSON storage.');
    isConnected = false;
    dbMode = 'json';
    return { success: false, message: 'กรุณากรอก Connection String หรือ Supabase Project URL' };
  }

  // Option 1: Direct / Pooler PostgreSQL Connection String
  if (dbUrl.startsWith('postgres://') || dbUrl.startsWith('postgresql://')) {
    try {
      pool = new Pool({
        connectionString: dbUrl,
        ssl: dbUrl.includes('localhost') ? false : { rejectUnauthorized: false }
      });

      const client = await pool.connect();
      console.log('✅ Connected to Supabase / PostgreSQL database via Direct/Pooler URI successfully!');
      client.release();
      isConnected = true;
      dbMode = 'postgres';

      await createTables();
      await autoMigrateLocalData();
      return { success: true, message: 'เชื่อมต่อ Supabase / PostgreSQL เรียบร้อยแล้ว!' };
    } catch (err) {
      console.error('⚠️ Could not connect via PostgreSQL URI:', err.message);
      isConnected = false;
      dbMode = 'json';
      return { success: false, message: `ไม่สามารถเชื่อมต่อ PostgreSQL ได้: ${err.message}` };
    }
  }

  // Option 2: Supabase API URL + API Key
  if (dbUrl.startsWith('https://')) {
    try {
      const cleanUrl = dbUrl.replace(/\/rest\/v1\/?$/i, '').replace(/\/+$/, '');
      if (!apiKey) {
        return { success: false, message: 'กรุณากรอก Supabase API Key (Publishable Key หรือ anon/service key)' };
      }

      // Direct REST Endpoint Test
      const testRes = await fetch(`${cleanUrl}/rest/v1/`, {
        method: 'GET',
        headers: { apikey: apiKey, Authorization: `Bearer ${apiKey}` }
      });

      if (testRes.status === 200 || testRes.status === 204) {
        supabaseClient = createClient(cleanUrl, apiKey);
        console.log('✅ Connected to Supabase via Supabase JS Client successfully!');
        isConnected = true;
        dbMode = 'supabase_js';
        return { success: true, message: 'เชื่อมต่อ Supabase API สำเร็จเรียบร้อยแล้ว!' };
      } else if (testRes.status === 401 || testRes.status === 403) {
        isConnected = false;
        dbMode = 'json';
        return { 
          success: false, 
          message: 'Project URL ถูกต้อง แต่ Supabase API Key ไม่ถูกต้อง หรือรหัสผ่านไม่ผ่าน (HTTP 401 Unauthorized)' 
        };
      } else {
        isConnected = false;
        dbMode = 'json';
        return { 
          success: false, 
          message: `ตอบกลับจาก Supabase ล้มเหลว (HTTP Status: ${testRes.status})` 
        };
      }
    } catch (err) {
      console.error('⚠️ Could not connect via Supabase JS Client:', err.message);
      isConnected = false;
      dbMode = 'json';
      return { success: false, message: `เกิดข้อผิดพลาดในการเชื่อมต่อ: ${err.message}` };
    }
  }

  isConnected = false;
  dbMode = 'json';
  return { success: false, message: 'รูปแบบ URL ไม่ถูกต้อง ต้องขึ้นต้นด้วย postgresql:// หรือ https://' };
}

async function createTables() {
  if (!pool || dbMode !== 'postgres') return;

  const createInventoryTable = `
    CREATE TABLE IF NOT EXISTS inventory (
      id VARCHAR(64) PRIMARY KEY,
      date TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
      name VARCHAR(255) NOT NULL,
      category VARCHAR(100) DEFAULT 'others',
      quantity NUMERIC(12, 2) DEFAULT 0,
      pieces NUMERIC(12, 2) DEFAULT 0,
      unit VARCHAR(50) DEFAULT 'units',
      cost NUMERIC(12, 2) DEFAULT 0,
      bill_number VARCHAR(100) DEFAULT '',
      image TEXT DEFAULT '',
      portion_size NUMERIC(12, 2) DEFAULT 1,
      portion_unit VARCHAR(50) DEFAULT 'units',
      associated_pos_item VARCHAR(255) DEFAULT '',
      created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    );
  `;

  const createUsersTable = `
    CREATE TABLE IF NOT EXISTS users (
      id VARCHAR(64) PRIMARY KEY,
      username VARCHAR(100) UNIQUE NOT NULL,
      password VARCHAR(255) NOT NULL,
      name VARCHAR(255),
      role VARCHAR(50) DEFAULT 'staff',
      created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    );
  `;

  const createSettingsTable = `
    CREATE TABLE IF NOT EXISTS settings (
      key VARCHAR(100) PRIMARY KEY,
      value TEXT,
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    );
  `;

  const createLogsTable = `
    CREATE TABLE IF NOT EXISTS logs (
      id VARCHAR(64) PRIMARY KEY,
      timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
      event VARCHAR(255),
      status VARCHAR(50),
      details TEXT
    );
  `;

  try {
    await pool.query(createInventoryTable);
    await pool.query(createUsersTable);
    await pool.query(createSettingsTable);
    await pool.query(createLogsTable);
    console.log('✅ Supabase PostgreSQL tables verified/created successfully.');
  } catch (err) {
    console.error('Error creating database tables:', err);
  }
}

async function autoMigrateLocalData() {
  if (!pool || dbMode !== 'postgres') return;

  try {
    const invRes = await pool.query('SELECT COUNT(*) FROM inventory');
    if (parseInt(invRes.rows[0].count, 10) === 0) {
      const localInv = getLocalData('inventory.json', []);
      for (const item of localInv) {
        await pool.query(
          `INSERT INTO inventory (id, date, name, category, quantity, pieces, unit, cost, bill_number, image, portion_size, portion_unit, associated_pos_item)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
           ON CONFLICT (id) DO NOTHING`,
          [
            item.id || `inv-${Date.now()}-${Math.random()}`,
            item.date || new Date(),
            item.name || 'วัตถุดิบ',
            item.category || 'others',
            item.quantity || 0,
            item.pieces || 0,
            item.unit || 'units',
            item.cost || 0,
            item.billNumber || '',
            item.image || '',
            item.portionSize || 1,
            item.portionUnit || item.unit || 'units',
            item.associatedPosItem || ''
          ]
        );
      }
      if (localInv.length > 0) {
        console.log(`✨ Migrated ${localInv.length} inventory items from Local JSON to Supabase PostgreSQL.`);
      }
    }
  } catch (err) {
    console.error('Error during auto-migration:', err);
  }
}

export function isDbConnected() {
  return isConnected;
}

export function getDbMode() {
  return dbMode;
}

// --- CRUD Operations ---

export async function getInventoryItems() {
  if (isConnected) {
    if (dbMode === 'postgres' && pool) {
      try {
        const res = await pool.query('SELECT * FROM inventory ORDER BY date DESC, created_at DESC');
        return res.rows.map(r => ({
          id: r.id,
          date: r.date,
          name: r.name,
          category: r.category,
          quantity: parseFloat(r.quantity) || 0,
          pieces: parseFloat(r.pieces) || 0,
          unit: r.unit,
          cost: parseFloat(r.cost) || 0,
          billNumber: r.bill_number,
          image: r.image,
          portionSize: parseFloat(r.portion_size) || 1,
          portionUnit: r.portion_unit,
          associatedPosItem: r.associated_pos_item
        }));
      } catch (e) {
        console.error('PostgreSQL query error (getInventoryItems):', e);
      }
    } else if (dbMode === 'supabase_js' && supabaseClient) {
      try {
        const { data, error } = await supabaseClient.from('inventory').select('*').order('date', { ascending: false });
        if (!error && data) {
          return data.map(r => ({
            id: r.id,
            date: r.date,
            name: r.name,
            category: r.category,
            quantity: parseFloat(r.quantity) || 0,
            pieces: parseFloat(r.pieces) || 0,
            unit: r.unit,
            cost: parseFloat(r.cost) || 0,
            billNumber: r.billNumber || r.bill_number || '',
            image: r.image,
            portionSize: parseFloat(r.portionSize || r.portion_size) || 1,
            portionUnit: r.portionUnit || r.portion_unit || 'units',
            associatedPosItem: r.associatedPosItem || r.associated_pos_item || ''
          }));
        }
      } catch (e) {
        console.error('Supabase JS query error (getInventoryItems):', e);
      }
    }
  }
  return getLocalData('inventory.json', []);
}

export async function addInventoryItem(item) {
  const localData = getLocalData('inventory.json', []);
  localData.unshift(item);
  saveLocalData('inventory.json', localData);
  saveLocalData('inventory_backup.json', localData);

  if (isConnected) {
    if (dbMode === 'postgres' && pool) {
      try {
        await pool.query(
          `INSERT INTO inventory (id, date, name, category, quantity, pieces, unit, cost, bill_number, image, portion_size, portion_unit, associated_pos_item)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)`,
          [
            item.id,
            item.date || new Date(),
            item.name,
            item.category || 'others',
            item.quantity || 0,
            item.pieces || 0,
            item.unit || 'units',
            item.cost || 0,
            item.billNumber || '',
            item.image || '',
            item.portionSize || 1,
            item.portionUnit || item.unit || 'units',
            item.associatedPosItem || ''
          ]
        );
      } catch (e) {
        console.error('PostgreSQL insert error (addInventoryItem):', e);
      }
    } else if (dbMode === 'supabase_js' && supabaseClient) {
      try {
        await supabaseClient.from('inventory').insert([item]);
      } catch (e) {
        console.error('Supabase JS insert error (addInventoryItem):', e);
      }
    }
  }
  return item;
}

export async function updateInventoryItem(id, updatedItem) {
  const localData = getLocalData('inventory.json', []);
  const index = localData.findIndex(i => i.id === id);
  if (index !== -1) {
    localData[index] = { ...localData[index], ...updatedItem };
    saveLocalData('inventory.json', localData);
    saveLocalData('inventory_backup.json', localData);
  }

  if (isConnected) {
    if (dbMode === 'postgres' && pool) {
      try {
        await pool.query(
          `UPDATE inventory 
           SET date=$1, name=$2, category=$3, quantity=$4, pieces=$5, unit=$6, cost=$7, bill_number=$8, image=$9, portion_size=$10, portion_unit=$11, associated_pos_item=$12
           WHERE id=$13`,
          [
            updatedItem.date,
            updatedItem.name,
            updatedItem.category,
            updatedItem.quantity,
            updatedItem.pieces,
            updatedItem.unit,
            updatedItem.cost,
            updatedItem.billNumber || '',
            updatedItem.image || '',
            updatedItem.portionSize || 1,
            updatedItem.portionUnit || updatedItem.unit || 'units',
            updatedItem.associatedPosItem || '',
            id
          ]
        );
      } catch (e) {
        console.error('PostgreSQL update error (updateInventoryItem):', e);
      }
    } else if (dbMode === 'supabase_js' && supabaseClient) {
      try {
        await supabaseClient.from('inventory').update(updatedItem).eq('id', id);
      } catch (e) {
        console.error('Supabase JS update error (updateInventoryItem):', e);
      }
    }
  }
  return updatedItem;
}

export async function deleteInventoryItem(id) {
  const localData = getLocalData('inventory.json', []);
  const filtered = localData.filter(i => i.id !== id);
  saveLocalData('inventory.json', filtered);
  saveLocalData('inventory_backup.json', filtered);

  if (isConnected) {
    if (dbMode === 'postgres' && pool) {
      try {
        await pool.query('DELETE FROM inventory WHERE id=$1', [id]);
      } catch (e) {
        console.error('PostgreSQL delete error (deleteInventoryItem):', e);
      }
    } else if (dbMode === 'supabase_js' && supabaseClient) {
      try {
        await supabaseClient.from('inventory').delete().eq('id', id);
      } catch (e) {
        console.error('Supabase JS delete error (deleteInventoryItem):', e);
      }
    }
  }
  return true;
}

export async function getUsers() {
  if (isConnected && pool && dbMode === 'postgres') {
    try {
      const res = await pool.query('SELECT * FROM users ORDER BY username ASC');
      if (res.rows.length > 0) {
        return res.rows.map(r => ({
          id: r.id,
          username: r.username,
          password: r.password,
          name: r.name || r.username,
          role: r.role || 'staff'
        }));
      }
    } catch (e) {
      console.error('PostgreSQL query error (getUsers):', e);
    }
  }
  return getLocalData('users.json', []);
}

export async function saveUsers(users) {
  saveLocalData('users.json', users);
  if (isConnected && pool && dbMode === 'postgres') {
    try {
      for (const u of users) {
        await pool.query(
          `INSERT INTO users (id, username, password, name, role)
           VALUES ($1, $2, $3, $4, $5)
           ON CONFLICT (username) DO UPDATE 
           SET password=EXCLUDED.password, name=EXCLUDED.name, role=EXCLUDED.role`,
          [u.id || `usr-${Date.now()}`, u.username, u.password, u.name || u.username, u.role || 'staff']
        );
      }
    } catch (e) {
      console.error('PostgreSQL save error (saveUsers):', e);
    }
  }
  return users;
}

// --- POS (Point of Sale) Operations ---

const DEFAULT_POS_MENU = [
  {
    id: 'pos-m-1',
    name: 'ผัดไทยกุ้งสด',
    category: 'main',
    price: 129,
    image: 'https://images.unsplash.com/photo-1559847844-5315695dadae?w=400&auto=format&fit=crop',
    description: 'ผัดไทยเส้นจันทน์ เหนียวนุ่ม กุ้งแม่น้ำสดๆ',
    ingredients: [
      { inventoryName: 'กุ้งสด', amount: 0.1, unit: 'kg' },
      { inventoryName: 'เส้นจันทน์', amount: 0.15, unit: 'kg' }
    ]
  },
  {
    id: 'pos-m-2',
    name: 'ข้าวผัดกะเพราเนื้อไข่ดาว',
    category: 'main',
    price: 89,
    image: 'https://images.unsplash.com/photo-1589301760014-d929f3979dbc?w=400&auto=format&fit=crop',
    description: 'เนื้อสับผัดกะเพราหอมกรุ่น รสจัดจ้าน เสิร์ฟพร้อมไข่ดาวกรอบ',
    ingredients: [
      { inventoryName: 'เนื้อสับ', amount: 0.12, unit: 'kg' },
      { inventoryName: 'ไข่ไก่', amount: 1, unit: 'pieces' }
    ]
  },
  {
    id: 'pos-m-3',
    name: 'ข้าวมันไก่ตอน',
    category: 'main',
    price: 79,
    image: 'https://images.unsplash.com/photo-1626804475297-41608e074eb1?w=400&auto=format&fit=crop',
    description: 'ไก่ตอนเนื้อนุ่ม ข้าวมันหอมละมุน เสิร์ฟพร้อมน้ำจิ้มสูตรเด็ด',
    ingredients: [
      { inventoryName: 'เนื้อไก่', amount: 0.15, unit: 'kg' },
      { inventoryName: 'ข้าวสาร', amount: 0.1, unit: 'kg' }
    ]
  },
  {
    id: 'pos-m-4',
    name: 'ต้มยำกุ้งแม่น้ำ (หม้อไฟ)',
    category: 'soup',
    price: 199,
    image: 'https://images.unsplash.com/photo-1548946526-f69e2424cf45?w=400&auto=format&fit=crop',
    description: 'ต้มยำกุ้งน้ำข้น เข้มข้นถึงเครื่องต้มยำแท้',
    ingredients: [
      { inventoryName: 'กุ้งสด', amount: 0.2, unit: 'kg' },
      { inventoryName: 'เห็ดฟาง', amount: 0.1, unit: 'kg' }
    ]
  },
  {
    id: 'pos-m-5',
    name: 'แกงเขียวหวานไก่ + โรตี',
    category: 'soup',
    price: 149,
    image: 'https://images.unsplash.com/photo-1455619452474-d2be8b1e70cd?w=400&auto=format&fit=crop',
    description: 'แกงเขียวหวานรสเข้มข้น ทานคู่แป้งโรตีกรอบนอกนุ่มใน',
    ingredients: [
      { inventoryName: 'เนื้อไก่', amount: 0.15, unit: 'kg' }
    ]
  },
  {
    id: 'pos-m-6',
    name: 'ส้มตำไทยไข่เค็ม',
    category: 'appetizer',
    price: 75,
    image: 'https://images.unsplash.com/photo-1569058242567-93de6f36f8e6?w=400&auto=format&fit=crop',
    description: 'ส้มตำมะละกอกรอบ รสแซ่บครบรส โรยไข่เค็มและกุ้งแห้ง',
    ingredients: [
      { inventoryName: 'มะละกอ', amount: 0.2, unit: 'kg' }
    ]
  },
  {
    id: 'pos-m-7',
    name: 'ไก่ทอดหาดใหญ่',
    category: 'appetizer',
    price: 95,
    image: 'https://images.unsplash.com/photo-1562967914-608f82629710?w=400&auto=format&fit=crop',
    description: 'ไก่ทอดหมักเครื่องเทศหอมๆ ทอดกรอบ โรยหอมเจียวจัดเต็ม',
    ingredients: [
      { inventoryName: 'เนื้อไก่', amount: 0.2, unit: 'kg' }
    ]
  },
  {
    id: 'pos-m-8',
    name: 'ชาไทยเย็น (Thai Iced Tea)',
    category: 'beverage',
    price: 45,
    image: 'https://images.unsplash.com/photo-1517701604599-bb29b565090c?w=400&auto=format&fit=crop',
    description: 'ชาไทยพรีเมียม หอมเข้มข้น หวานมันกำลังดี',
    ingredients: [
      { inventoryName: 'ชาไทย', amount: 0.02, unit: 'kg' },
      { inventoryName: 'นมข้นหวาน', amount: 0.03, unit: 'kg' }
    ]
  },
  {
    id: 'pos-m-9',
    name: 'กาแฟโบราณเย็น',
    category: 'beverage',
    price: 45,
    image: 'https://images.unsplash.com/photo-1517701604599-bb29b565090c?w=400&auto=format&fit=crop',
    description: 'กาแฟโบราณเข้มข้น หอมหวานมัน เข้มสะใจ',
    ingredients: []
  },
  {
    id: 'pos-m-10',
    name: 'น้ำมะพร้าวสดแท้ 100%',
    category: 'beverage',
    price: 55,
    image: 'https://images.unsplash.com/photo-1525385133512-2f3bdd039054?w=400&auto=format&fit=crop',
    description: 'น้ำมะพร้าวลูกสดๆ หวานธรรมชาติ ชื่นใจ',
    ingredients: []
  },
  {
    id: 'pos-m-11',
    name: 'ข้าวเหนียวมะม่วง',
    category: 'dessert',
    price: 99,
    image: 'https://images.unsplash.com/photo-1590080875515-8a3a8dc5735e?w=400&auto=format&fit=crop',
    description: 'มะม่วงน้ำดอกไม้หวานฉ่ำ ข้าวเหนียวมูนกะทิหอมหวาน',
    ingredients: []
  },
  {
    id: 'pos-m-12',
    name: 'บัวลอยเผือกมะพร้าวอ่อน',
    category: 'dessert',
    price: 55,
    image: 'https://images.unsplash.com/photo-1563805042-7684c019e1cb?w=400&auto=format&fit=crop',
    description: 'บัวลอยเม็ดนุ่ม เผือกหอม พร้อมเนื้อมะพร้าวอ่อนในกะทิสด',
    ingredients: []
  }
];

const DEFAULT_POS_TABLES = [
  { id: 'T01', name: 'โต๊ะ 01', capacity: 2, status: 'available', orderId: null },
  { id: 'T02', name: 'โต๊ะ 02', capacity: 2, status: 'available', orderId: null },
  { id: 'T03', name: 'โต๊ะ 03', capacity: 4, status: 'available', orderId: null },
  { id: 'T04', name: 'โต๊ะ 04', capacity: 4, status: 'available', orderId: null },
  { id: 'T05', name: 'โต๊ะ 05', capacity: 6, status: 'available', orderId: null },
  { id: 'T06', name: 'โต๊ะ 06', capacity: 6, status: 'available', orderId: null },
  { id: 'T07', name: 'โต๊ะ 07 (ระเบียง)', capacity: 4, status: 'available', orderId: null },
  { id: 'T08', name: 'โต๊ะ 08 (ระเบียง)', capacity: 4, status: 'available', orderId: null },
  { id: 'VIP1', name: 'ห้อง VIP 1', capacity: 10, status: 'available', orderId: null },
  { id: 'VIP2', name: 'ห้อง VIP 2', capacity: 12, status: 'available', orderId: null }
];

export async function getPosMenuItems() {
  const data = getLocalData('pos_menu.json', null);
  if (!data || data.length === 0) {
    saveLocalData('pos_menu.json', DEFAULT_POS_MENU);
    return DEFAULT_POS_MENU;
  }
  return data;
}

export async function addPosMenuItem(item) {
  const menu = await getPosMenuItems();
  const newItem = {
    id: item.id || `pos-m-${Date.now()}`,
    name: item.name,
    category: item.category || 'main',
    price: parseFloat(item.price) || 0,
    image: item.image || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400&auto=format&fit=crop',
    description: item.description || '',
    ingredients: item.ingredients || []
  };
  menu.push(newItem);
  saveLocalData('pos_menu.json', menu);
  return newItem;
}

export async function updatePosMenuItem(id, updated) {
  const menu = await getPosMenuItems();
  const idx = menu.findIndex(m => m.id === id);
  if (idx !== -1) {
    menu[idx] = { ...menu[idx], ...updated };
    saveLocalData('pos_menu.json', menu);
    return menu[idx];
  }
  return null;
}

export async function deletePosMenuItem(id) {
  const menu = await getPosMenuItems();
  const filtered = menu.filter(m => m.id !== id);
  saveLocalData('pos_menu.json', filtered);
  return true;
}

export async function getPosTables() {
  const data = getLocalData('pos_tables.json', null);
  if (!data || data.length === 0) {
    saveLocalData('pos_tables.json', DEFAULT_POS_TABLES);
    return DEFAULT_POS_TABLES;
  }
  return data;
}

export async function updatePosTable(id, status, orderId = null) {
  const tables = await getPosTables();
  const idx = tables.findIndex(t => t.id === id);
  if (idx !== -1) {
    tables[idx].status = status;
    tables[idx].orderId = orderId;
    saveLocalData('pos_tables.json', tables);
    return tables[idx];
  }
  return null;
}

export async function getPosOrders() {
  return getLocalData('pos_orders.json', []);
}

export async function addPosOrder(orderData) {
  const orders = await getPosOrders();

  const now = new Date();
  const dateStr = now.toISOString().slice(0,10).replace(/-/g, '');
  const dailyCount = orders.filter(o => o.createdAt && o.createdAt.startsWith(now.toISOString().slice(0,10))).length + 1;
  const orderNo = `POS-${dateStr}-${String(dailyCount).padStart(3, '0')}`;

  const newOrder = {
    id: `ord-${Date.now()}`,
    orderNo,
    tableId: orderData.tableId || 'Takeaway',
    tableName: orderData.tableName || 'สั่งกลับบ้าน',
    orderType: orderData.orderType || 'dine-in', // 'dine-in' | 'takeaway' | 'delivery'
    status: orderData.status || 'pending', // 'pending' | 'cooking' | 'served' | 'paid' | 'cancelled'
    items: orderData.items || [], // [{ id, name, price, qty, notes }]
    subtotal: parseFloat(orderData.subtotal) || 0,
    discount: parseFloat(orderData.discount) || 0,
    serviceCharge: parseFloat(orderData.serviceCharge) || 0,
    vat: parseFloat(orderData.vat) || 0,
    total: parseFloat(orderData.total) || 0,
    paymentMethod: orderData.paymentMethod || null, // 'cash' | 'promptpay' | 'credit'
    receivedAmount: parseFloat(orderData.receivedAmount) || 0,
    changeAmount: parseFloat(orderData.changeAmount) || 0,
    createdAt: now.toISOString(),
    updatedAt: now.toISOString(),
    staffName: orderData.staffName || 'Staff'
  };

  orders.unshift(newOrder);
  saveLocalData('pos_orders.json', orders);

  // Update table status if dine-in
  if (newOrder.tableId && newOrder.tableId !== 'Takeaway' && newOrder.tableId !== 'Delivery') {
    await updatePosTable(newOrder.tableId, 'occupied', newOrder.id);
  }

  return newOrder;
}

export async function updatePosOrder(id, updateData) {
  const orders = await getPosOrders();
  const idx = orders.findIndex(o => o.id === id);
  if (idx !== -1) {
    orders[idx] = { ...orders[idx], ...updateData, updatedAt: new Date().toISOString() };
    saveLocalData('pos_orders.json', orders);
    return orders[idx];
  }
  return null;
}

export async function payPosOrder(id, paymentInfo) {
  const orders = await getPosOrders();
  const idx = orders.findIndex(o => o.id === id);
  if (idx === -1) return null;

  const order = orders[idx];
  order.status = 'paid';
  order.paymentMethod = paymentInfo.paymentMethod || 'cash';
  order.receivedAmount = parseFloat(paymentInfo.receivedAmount) || order.total;
  order.changeAmount = Math.max(0, order.receivedAmount - order.total);
  order.paidAt = new Date().toISOString();
  order.updatedAt = new Date().toISOString();

  saveLocalData('pos_orders.json', orders);

  // Free table if dine-in
  if (order.tableId && order.tableId !== 'Takeaway' && order.tableId !== 'Delivery') {
    await updatePosTable(order.tableId, 'available', null);
  }

  // --- Automatic Inventory Deduction ---
  try {
    const inventory = await getInventoryItems();
    const posMenuItems = await getPosMenuItems();
    let inventoryChanged = false;

    for (const orderItem of order.items) {
      const menuItem = posMenuItems.find(m => m.id === orderItem.id || m.name === orderItem.name);
      if (menuItem && menuItem.ingredients && menuItem.ingredients.length > 0) {
        for (const ing of menuItem.ingredients) {
          const invIdx = inventory.findIndex(inv => 
            inv.name.trim().toLowerCase() === ing.inventoryName.trim().toLowerCase()
          );
          if (invIdx !== -1) {
            const deductQty = (ing.amount || 1) * orderItem.qty;
            inventory[invIdx].quantity = Math.max(0, (inventory[invIdx].quantity || 0) - deductQty);
            inventoryChanged = true;
          }
        }
      } else {
        // Direct match with inventory associatedPosItem or name
        const invIdx = inventory.findIndex(inv => 
          inv.associatedPosItem === orderItem.name || inv.name.trim().toLowerCase() === orderItem.name.trim().toLowerCase()
        );
        if (invIdx !== -1) {
          const deductQty = orderItem.qty;
          inventory[invIdx].quantity = Math.max(0, (inventory[invIdx].quantity || 0) - deductQty);
          inventoryChanged = true;
        }
      }
    }

    if (inventoryChanged) {
      saveLocalData('inventory.json', inventory);
      console.log(`📦 Auto-deducted inventory items for paid POS order ${order.orderNo}`);
    }
  } catch (err) {
    console.error('Error auto-deducting inventory for POS order:', err);
  }

  return order;
}

export async function deletePosOrder(id) {
  const orders = await getPosOrders();
  const order = orders.find(o => o.id === id);
  if (order && order.tableId && order.tableId !== 'Takeaway' && order.tableId !== 'Delivery') {
    await updatePosTable(order.tableId, 'available', null);
  }
  const filtered = orders.filter(o => o.id !== id);
  saveLocalData('pos_orders.json', filtered);
  return true;
}

