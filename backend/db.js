import pg from 'pg';
import fs from 'fs';
import path from 'path';

const { Pool } = pg;

let pool = null;
let isConnected = false;

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

export async function initDatabase(connectionString) {
  const dbUrl = connectionString || process.env.DATABASE_URL || process.env.SUPABASE_DB_URL;
  
  if (!dbUrl) {
    console.log('ℹ️ No DATABASE_URL provided. Running with Local JSON storage.');
    isConnected = false;
    return false;
  }

  try {
    pool = new Pool({
      connectionString: dbUrl,
      ssl: dbUrl.includes('localhost') ? false : { rejectUnauthorized: false }
    });

    const client = await pool.connect();
    console.log('✅ Connected to Supabase / PostgreSQL database successfully!');
    client.release();
    isConnected = true;

    // Create Tables
    await createTables();
    
    // Auto-migrate local JSON data if tables are empty
    await autoMigrateLocalData();
    
    return true;
  } catch (err) {
    console.error('⚠️ Could not connect to Supabase/PostgreSQL:', err.message);
    isConnected = false;
    return false;
  }
}

async function createTables() {
  if (!pool || !isConnected) return;

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
  if (!pool || !isConnected) return;

  try {
    // Check inventory count
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

    // Check users count
    const userRes = await pool.query('SELECT COUNT(*) FROM users');
    if (parseInt(userRes.rows[0].count, 10) === 0) {
      const localUsers = getLocalData('users.json', []);
      for (const user of localUsers) {
        await pool.query(
          `INSERT INTO users (id, username, password, name, role)
           VALUES ($1, $2, $3, $4, $5)
           ON CONFLICT (id) DO NOTHING`,
          [
            user.id || `usr-${Date.now()}`,
            user.username,
            user.password,
            user.name || user.username,
            user.role || 'staff'
          ]
        );
      }
      if (localUsers.length > 0) {
        console.log(`✨ Migrated ${localUsers.length} users to Supabase PostgreSQL.`);
      }
    }
  } catch (err) {
    console.error('Error during auto-migration:', err);
  }
}

export function isDbConnected() {
  return isConnected;
}

// --- CRUD Operations ---

export async function getInventoryItems() {
  if (isConnected && pool) {
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
      console.error('Database query error (getInventoryItems):', e);
    }
  }
  return getLocalData('inventory.json', []);
}

export async function addInventoryItem(item) {
  // Always update local data
  const localData = getLocalData('inventory.json', []);
  localData.unshift(item);
  saveLocalData('inventory.json', localData);
  saveLocalData('inventory_backup.json', localData);

  if (isConnected && pool) {
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
      console.error('Database insert error (addInventoryItem):', e);
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

  if (isConnected && pool) {
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
      console.error('Database update error (updateInventoryItem):', e);
    }
  }
  return updatedItem;
}

export async function deleteInventoryItem(id) {
  const localData = getLocalData('inventory.json', []);
  const filtered = localData.filter(i => i.id !== id);
  saveLocalData('inventory.json', filtered);
  saveLocalData('inventory_backup.json', filtered);

  if (isConnected && pool) {
    try {
      await pool.query('DELETE FROM inventory WHERE id=$1', [id]);
    } catch (e) {
      console.error('Database delete error (deleteInventoryItem):', e);
    }
  }
  return true;
}

export async function getUsers() {
  if (isConnected && pool) {
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
      console.error('Database query error (getUsers):', e);
    }
  }
  return getLocalData('users.json', []);
}

export async function saveUsers(users) {
  saveLocalData('users.json', users);

  if (isConnected && pool) {
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
      console.error('Database save error (saveUsers):', e);
    }
  }
  return users;
}
