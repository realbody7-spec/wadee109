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

async function importNewSheet() {
  const sheetId = '1xXGso8fl_EgQsfcKmtfjdG2Aileq0FaEG8khQHZUZUw';
  const csvUrl = `https://docs.google.com/spreadsheets/d/${sheetId}/export?format=csv`;

  console.log('Fetching CSV from new Google Sheet:', csvUrl);
  const res = await fetch(csvUrl, { redirect: 'follow' });
  const csvText = await res.text();

  const lines = csvText.split('\n').map(l => l.trim()).filter(Boolean);
  console.log(`Total CSV lines received: ${lines.length}`);

  const items = [];
  for (let i = 0; i < lines.length; i++) {
    const cols = lines[i].split(',').map(c => c.replace(/^"|"$/g, '').trim());
    if (cols.length >= 3 && cols[0]) {
      const dStr = cols[0];
      // Check date pattern DD/MM/YYYY or DD.MM/YYYY
      if (dStr.includes('/') || dStr.includes('.')) {
        const parts = dStr.replace(/\./g, '/').split('/');
        if (parts.length === 3) {
          const day = parseInt(parts[0], 10);
          const month = parseInt(parts[1], 10);
          let year = parseInt(parts[2], 10);

          if (!isNaN(day) && !isNaN(month) && !isNaN(year)) {
            if (year < 100) year += 2000;
            const padDay = String(day).padStart(2, '0');
            const padMonth = String(month).padStart(2, '0');
            const isoDate = new Date(`${year}-${padMonth}-${padDay}T08:00:00.000Z`).toISOString();

            // Total bill amount column is index 2 or index 20
            let costVal = parseFloat(cols[2].replace(/,/g, '')) || 0;
            if (isNaN(costVal) || costVal <= 0) {
              // Try finding total bill column in row
              for (let k = cols.length - 1; k >= 2; k--) {
                const val = parseFloat(cols[k].replace(/,/g, ''));
                if (!isNaN(val) && val > 10 && val < 1000000) {
                  costVal = val;
                  break;
                }
              }
            }

            if (costVal > 0) {
              items.push({
                id: `gs-new-sheet-${i}-${year}${padMonth}${padDay}`,
                date: isoDate,
                name: cols[3] || `ยอดซื้อวัตถุดิบ (${dStr})`,
                category: 'meat',
                quantity: 1,
                pieces: 1,
                unit: 'ชุด',
                cost: costVal,
                bill_number: cols[1] || `GS-NEW-${i}`,
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

  console.log(`Successfully parsed ${items.length} valid transaction rows from new Google Sheet!`);

  // Merge with existing local inventory.json
  const inventoryJsonPath = path.join(__dirname, '..', 'backend', 'data', 'inventory.json');
  let existingItems = [];
  try {
    if (fs.existsSync(inventoryJsonPath)) {
      existingItems = JSON.parse(fs.readFileSync(inventoryJsonPath, 'utf8'));
    }
  } catch (e) {}

  const mergedMap = new Map();
  existingItems.forEach(it => { if (it && it.id) mergedMap.set(it.id, it); });
  items.forEach(it => {
    const localObj = {
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
    };
    mergedMap.set(it.id, localObj);
  });

  const finalMerged = Array.from(mergedMap.values());
  fs.writeFileSync(inventoryJsonPath, JSON.stringify(finalMerged, null, 2), 'utf8');
  console.log(`✅ Saved ${finalMerged.length} total merged items to inventory.json`);

  console.log('Upserting all new sheet items to Supabase Cloud Database...');
  const { data, error } = await supabase.from('inventory').upsert(items, { onConflict: 'id' });

  if (error) {
    console.error('Supabase Error:', error.message);
  } else {
    console.log(`🎉 SUCCESS! ${items.length} records from new Google Sheet imported to Supabase Cloud Database!`);
  }
}

importNewSheet();
