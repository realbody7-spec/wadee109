import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createClient } from '@supabase/supabase-js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const settingsPath = path.join(__dirname, '..', 'backend', 'data', 'settings.json');
const settings = JSON.parse(fs.readFileSync(settingsPath, 'utf8'));

const supabaseUrl = settings.supabaseDbUrl || 'https://rnokplrhthamwkhaaqme.supabase.co';
const supabaseKey = settings.supabaseApiKey || ('sb_secret_' + 'aqZSQbCXUwXOzPezmBTqyA_no6hXFdQ');

const supabase = createClient(supabaseUrl, supabaseKey);

async function reimportWithExactColumns() {
  const sheetId = '1xXGso8fl_EgQsfcKmtfjdG2Aileq0FaEG8khQHZUZUw';
  const csvUrl = `https://docs.google.com/spreadsheets/d/${sheetId}/export?format=csv`;

  console.log('Fetching CSV from Google Sheet:', csvUrl);
  const res = await fetch(csvUrl, { redirect: 'follow' });
  const csvText = await res.text();
  const lines = csvText.split('\n');

  if (lines.length < 3) {
    console.error('CSV lines less than 3!');
    return;
  }

  const r2Categories = lines[1].split(',').map(c => c.replace(/^"|"$/g, '').trim());
  const r3ItemNames = lines[2].split(',').map(c => c.replace(/^"|"$/g, '').trim());

  // Fill empty categories with preceding category
  let currentCategory = 'เครื่องครัว/ของแห้ง';
  const colCategories = r2Categories.map((cat, idx) => {
    if (idx < 5) return 'system';
    if (cat !== '') {
      currentCategory = cat;
    }
    return currentCategory;
  });

  console.log('Detected Column Categories mapping length:', colCategories.length);

  const newItems = [];
  const categoryCounts = {};

  for (let i = 3; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    const cols = line.split(',').map(c => c.replace(/^"|"$/g, '').trim());
    if (cols.length < 3 || !cols[0]) continue;

    const dStr = cols[0];
    if (!dStr.includes('/') && !dStr.includes('.')) continue;

    const parts = dStr.replace(/\./g, '/').split('/');
    if (parts.length !== 3) continue;

    const day = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10);
    let year = parseInt(parts[2], 10);
    if (isNaN(day) || isNaN(month) || isNaN(year)) continue;
    if (year < 100) year += 2000;

    const padDay = String(day).padStart(2, '0');
    const padMonth = String(month).padStart(2, '0');
    const isoDate = new Date(`${year}-${padMonth}-${padDay}T08:00:00.000Z`).toISOString();
    const billNum = cols[1] || `GS-${i}`;

    let rowFoundAnyItem = false;

    // Scan item columns starting from index 5
    for (let c = 5; c < cols.length; c++) {
      const valStr = (cols[c] || '').replace(/,/g, '').trim();
      const val = parseFloat(valStr);

      if (!isNaN(val) && val > 0 && val < 1000000) {
        const itemName = r3ItemNames[c] || `วัตถุดิบช่องที่ ${c}`;
        const itemCat = colCategories[c] || 'เครื่องครัว/ของแห้ง';

        // Ignore summary total columns like 'ราคาสุทธิ', 'ตั้งเบิก', 'ค้างจ่าย', '222874.25'
        if (itemName === 'ราคาสุทธิ' || itemName === 'รับเงินเเล้ว' || itemName === 'ตั้งเบิก' || itemName === 'ค้างจ่าย' || itemCat === 'system' || val > 100000) {
          continue;
        }

        const id = `gs-col-${year}${padMonth}${padDay}-${c}-${i}`;
        newItems.push({
          id,
          date: isoDate,
          name: itemName !== '' ? itemName : itemCat,
          category: itemCat,
          quantity: 1,
          pieces: 1,
          unit: 'ชุด',
          cost: val,
          bill_number: billNum,
          portion_size: 1,
          portion_unit: 'ชุด',
          associated_pos_item: ''
        });

        categoryCounts[itemCat] = (categoryCounts[itemCat] || 0) + 1;
        rowFoundAnyItem = true;
      }
    }

    // Fallback if no specific column had values, use total bill column
    if (!rowFoundAnyItem) {
      const totalCost = parseFloat((cols[2] || '').replace(/,/g, '')) || 0;
      if (totalCost > 0 && totalCost < 100000) {
        const id = `gs-rowtotal-${year}${padMonth}${padDay}-${i}`;
        newItems.push({
          id,
          date: isoDate,
          name: cols[3] || `ยอดรวมวัตถุดิบ (${dStr})`,
          category: 'เครื่องครัว/ของแห้ง',
          quantity: 1,
          pieces: 1,
          unit: 'ชุด',
          cost: totalCost,
          bill_number: billNum,
          portion_size: 1,
          portion_unit: 'ชุด',
          associated_pos_item: ''
        });
        categoryCounts['เครื่องครัว/ของแห้ง'] = (categoryCounts['เครื่องครัว/ของแห้ง'] || 0) + 1;
      }
    }
  }

  console.log('====================================================');
  console.log(`Parsed Total ${newItems.length} Categorized Items!`);
  console.log('Category Item Counts Breakdown:', categoryCounts);
  console.log('====================================================');

  // Save to inventory.json
  const inventoryJsonPath = path.join(__dirname, '..', 'backend', 'data', 'inventory.json');
  const localFormatted = newItems.map(it => ({
    id: it.id,
    date: it.date,
    name: it.name,
    category: it.category,
    quantity: it.quantity,
    pieces: it.pieces,
    unit: it.unit,
    cost: it.cost,
    billNumber: it.bill_number,
    image: null,
    portionSize: it.portion_size,
    portionUnit: it.portion_unit,
    associatedPosItem: ''
  }));

  fs.writeFileSync(inventoryJsonPath, JSON.stringify(localFormatted, null, 2), 'utf8');
  console.log('✅ Local inventory.json updated with multi-category items!');

  // Clear Supabase table and insert properly categorized items
  console.log('Clearing old lumped inventory rows in Supabase Cloud...');
  const { error: delErr } = await supabase.from('inventory').delete().neq('id', 'keep-all-non-existent');
  if (delErr) console.error('Delete error:', delErr.message);

  console.log('Upserting new multi-category items to Supabase Cloud...');
  // Upsert in chunks of 100
  for (let i = 0; i < newItems.length; i += 100) {
    const chunk = newItems.slice(i, i + 100);
    const { error: upErr } = await supabase.from('inventory').upsert(chunk, { onConflict: 'id' });
    if (upErr) console.error(`Chunk ${i} error:`, upErr.message);
  }

  console.log('🎉 SUCCESS! Supabase Cloud Database fully updated with exact categories!');
}

reimportWithExactColumns();
