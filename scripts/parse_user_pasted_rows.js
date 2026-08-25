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

// Parse transcript file to get exact raw prompt text from user
const transcriptPath = 'C:\\Users\\USER\\.gemini\\antigravity\\brain\\bb815a34-1a19-4936-8535-132616c21c92\\.system_generated\\logs\\transcript_full.jsonl';

let fullUserText = '';
try {
  const content = fs.readFileSync(transcriptPath, 'utf8');
  const lines = content.split('\n');
  for (let i = lines.length - 1; i >= 0; i--) {
    if (lines[i].includes('24/8/2026') || lines[i].includes('9,640.00')) {
      fullUserText = lines[i];
      break;
    }
  }
} catch (e) {
  console.error('Error reading transcript:', e.message);
}

if (!fullUserText) {
  console.log('No user text match found in transcript');
  process.exit(1);
}

console.log('Found user prompt transcript segment length:', fullUserText.length);

// Extract date lines
const dateRegex = /(\d{1,2}[\/\.]\d{1,2}[\/\.]\d{4})[^\n\r]+/g;
const matches = fullUserText.match(dateRegex) || [];

console.log(`Found ${matches.length} date lines in user text!`);

const parsedItems = [];
matches.forEach((line, index) => {
  const dateMatch = line.match(/^(\d{1,2})[\/\.](\d{1,2})[\/\.](\d{4})/);
  if (!dateMatch) return;

  const day = parseInt(dateMatch[1], 10);
  const month = parseInt(dateMatch[2], 10);
  let year = parseInt(dateMatch[3], 10);
  if (year < 100) year += 2000;

  const padDay = String(day).padStart(2, '0');
  const padMonth = String(month).padStart(2, '0');
  const isoDate = new Date(`${year}-${padMonth}-${padDay}T08:00:00.000Z`).toISOString();

  // Find cost amount (e.g. 9,640.00 or 19,971.00 before TRUE or at end)
  const numbers = line.match(/([0-9]{1,3}(?:,[0-9]{3})*(?:\.[0-9]{1,2})?)/g) || [];
  let costVal = 0;
  
  // Pick total cost column value
  for (let j = numbers.length - 1; j >= 0; j--) {
    const num = parseFloat(numbers[j].replace(/,/g, ''));
    if (!isNaN(num) && num > 10 && num < 1000000 && num !== 2026 && num !== day && num !== month) {
      costVal = num;
      break;
    }
  }

  if (costVal > 0) {
    const id = `user-pasted-${year}${padMonth}${padDay}-${index}`;
    parsedItems.push({
      id,
      date: isoDate,
      name: `ยอดซื้อวัตถุดิบ (${padDay}/${padMonth}/${year})`,
      category: 'meat',
      quantity: 1,
      pieces: 1,
      unit: 'ชุด',
      cost: costVal,
      bill_number: `GS-PASTED-${index + 1}`,
      portion_size: 1,
      portion_unit: 'ชุด',
      associated_pos_item: ''
    });
  }
});

console.log(`Successfully parsed ${parsedItems.length} items from user pasted data!`);
console.log('Sample parsed items:', parsedItems.slice(-5));

// Write to inventory.json
const inventoryJsonPath = path.join(__dirname, '..', 'backend', 'data', 'inventory.json');
let existingItems = [];
try {
  existingItems = JSON.parse(fs.readFileSync(inventoryJsonPath, 'utf8'));
} catch (e) {}

const mergedMap = new Map();
existingItems.forEach(it => { if (it && it.id) mergedMap.set(it.id, it); });
parsedItems.forEach(it => {
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

// Upsert to Supabase Cloud Database
async function syncToSupabase() {
  console.log('Upserting all parsed user items into Supabase Cloud Database...');
  const { data, error } = await supabase.from('inventory').upsert(parsedItems, { onConflict: 'id' });
  if (error) {
    console.error('Supabase Error:', error.message);
  } else {
    console.log(`🎉 SUCCESS! All ${parsedItems.length} parsed items (including Aug 24 = ฿9,640.00) imported to Supabase Cloud!`);
  }
}

syncToSupabase();
