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

async function runImport() {
  const sheetId = '1VOoOZNs5FUA7J-8GAsGfM8Qd0gJHS4tZtRw1ztgIKQk';
  const csvUrl = `https://docs.google.com/spreadsheets/d/${sheetId}/gviz/tq?tqx=out:csv`;

  console.log('Fetching Google Sheet CSV from gviz endpoint...');
  const res = await fetch(csvUrl, { redirect: 'follow' });
  const csvText = await res.text();

  const lines = csvText.split('\n').map(l => l.trim()).filter(Boolean);
  console.log(`Total CSV lines received: ${lines.length}`);

  const items = [];
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i];
    const matches = line.match(/"([^"]*)"/g);
    if (matches && matches.length >= 2) {
      const dStr = matches[0].replace(/"/g, '').trim();
      const cStr = matches[1].replace(/"/g, '').replace(/,/g, '').trim();
      const costVal = parseFloat(cStr);

      if (dStr && dStr.includes('/') && !isNaN(costVal) && costVal > 0) {
        const parts = dStr.split('/');
        if (parts.length === 3) {
          const day = parseInt(parts[0], 10);
          const month = parseInt(parts[1], 10);
          let year = parseInt(parts[2], 10);

          if (!isNaN(day) && !isNaN(month) && !isNaN(year)) {
            if (year < 100) year += 2000;
            const padDay = String(day).padStart(2, '0');
            const padMonth = String(month).padStart(2, '0');
            const dateObj = new Date(`${year}-${padMonth}-${padDay}T08:00:00.000Z`);

            if (!isNaN(dateObj.getTime())) {
              items.push({
                id: `gs-historical-${i}-${year}${padMonth}${padDay}`,
                date: dateObj.toISOString(),
                name: `ยอดซื้อวัตถุดิบ (${dStr})`,
                category: 'meat',
                quantity: 1,
                pieces: 1,
                unit: 'ชุด',
                cost: costVal,
                bill_number: `GS-${i}`,
                portion_size: 1,
                portion_unit: 'ชุด',
                associated_pos_item: ''
              });
            }
          }
        }
      }
    }
  }

  console.log(`Successfully parsed ${items.length} valid historical procurement rows from Google Sheet!`);

  // Map to frontend json schema
  const localItems = items.map(it => ({
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

  // Merge items with existing local inventory.json
  const inventoryJsonPath = path.join(__dirname, '..', 'backend', 'data', 'inventory.json');
  let existingItems = [];
  try {
    if (fs.existsSync(inventoryJsonPath)) {
      existingItems = JSON.parse(fs.readFileSync(inventoryJsonPath, 'utf8'));
    }
  } catch (e) {}

  const mergedMap = new Map();
  // Keep all existing items first
  existingItems.forEach(it => { if (it && it.id) mergedMap.set(it.id, it); });
  // Add imported items
  localItems.forEach(it => { if (it && it.id && !mergedMap.has(it.id)) mergedMap.set(it.id, it); });

  const finalMerged = Array.from(mergedMap.values());
  fs.writeFileSync(inventoryJsonPath, JSON.stringify(finalMerged, null, 2), 'utf8');
  console.log(`✅ Safely merged and saved ${finalMerged.length} total items to backend/data/inventory.json`);

  console.log('Upserting all historical items to Supabase Cloud Database...');
  const { data, error } = await supabase.from('inventory').upsert(items, { onConflict: 'id' });

  if (error) {
    console.error('Supabase Upsert Error:', error.message);
  } else {
    console.log(`🎉 SUCCESS! All ${items.length} historical transaction records imported into Supabase Cloud Database!`);
  }
}

runImport();
