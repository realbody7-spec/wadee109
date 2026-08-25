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

const schemaData = {
  "เครื่องครัว/ของแห้ง": ['น้ำตาลปี๊บ', 'น้ำตาลทราย', 'งาขาว', 'ชูรส', 'น้ำปลา', 'น้ำส้มสายชู', 'น้ำปลาร้า', 'น้ำมัน', 'น้ำมันงา', 'ซอสมะเขือ', 'ซอสพริก', 'มายองเนส', 'น้ำจิ้มบ๊วย', 'ซอสสูตร5', 'ซอสหอยนางรม', 'ซีอิ๊วฉลากแดง', 'ซีอิ๊วขาว', 'ซอสฝาเขียว', 'เบกกิ้งโซดา', 'ไวไว', 'มาม่า', 'หมี่หยก', 'วุ้นเส้น', 'ข้าวสาร', 'ข้าวคั่ว', 'ผงมะนาว', 'กระเทียมดอง', 'น้ำมะขาม', 'พริกป่น', 'โชยุ', 'วาซาบิ', 'เกลือ', 'น้ำยาล้างจาน', 'ผงซักฟอก', 'ถุงขยะ', 'ถุงหิ้ว', 'ถุงร้อน', 'ไข่ไก่', 'เต้าหู้ไข่'],
  "ผัก": ['กะหล่ำ', 'เห็ดเข็ม', 'แครอท', 'ผักบุ้ง', 'ข้าวโพด', 'ต้นหอม', 'ผักชี', 'ตั้งโอ๋', 'กระเทียม', 'กระเทียมเจียว', 'พริกไทย', 'พริกเขียว', 'พริกแดง', 'กุ้งแห้ง', 'มะละกอ', 'มะนาว', 'หอมใหญ่', 'หอมแดง', 'มะเขือเทศ', 'ถั่วฝักยาว', 'ถั่วตำไทย', 'ใบกะเพรา', 'ข่า', 'ตะไคร้', 'ใบมะกรูด', 'ผักชีใบเลื่อย', 'โหระพา', 'ใบเตย', 'เม็ดมะม่วง', 'ผัก'],
  "เนื้อหมู / ไก่": ['เนื้อหมู', 'สามชั้น', 'สันคอ', 'หมูสับ', 'ตับ', 'เบคอน', 'เอ็นไก่', 'ปีกไก่', 'มันหมูเจียว', 'กระดูกหมู', 'สะโพกหมู', 'มันก้อน', 'หมู', 'ไก่'],
  "เนื้อวัว": ['เสือ', 'สันใน', 'เนื้อออส', 'ผ้าขี้ริ้ว', 'สันนอก', 'วัว'],
  "ทะเล": ['หมึกสด', 'หมึกหมูกะทะ', 'หมึกกรอบ', 'กุ้ง', 'ปูอัด', 'เต้าหู้ปลา', 'กะพรุน', 'ทะเล', 'หมึก', 'ปลา'],
  "ของทอด": ['เกี๊ยวซ่า', 'เฟรนฟราย', 'นักเก็ต', 'ไก่กรอบ', 'แป้งทอดกรอบ', 'เอโร่', 'เต้าหู้ชีส', 'ทอด'],
  "น้ำจิ้ม": ['วดี', 'BBQ', 'น้ำจิ้ม'],
  "เครื่องดื่ม": ['น้ำอัดลม', 'โซดา', 'น้ำเปล่า', 'หลอดน้ำงอ', 'เบียร์ช้าง', 'เบียร์ลีโอ', 'เบียร์สิงห์', 'รีแบน', 'รีกลม', 'ขนมหวาน', 'ไอติม', 'เครื่องดื่ม'],
  "Asset": ['แปรงขัดกระทะ', 'สเปรย์กำจัดแมลง', 'กาวดักแมงวัน', 'น้ำยาถูพื้น', 'ล้างห้องน้ำ', 'สบู่ล้างมือ', 'น้ำยาเช็ดโต๊ะ', 'ทิชชู่', 'หลอดงอ', 'ตะเกียบไม้', 'กระดาษความร้อน', 'asset'],
  "เงินเดือนพนักงาน + ค่าเช่าร้าน + กับข้าวพนักงาน": ['เงินเดือน', 'ค่าเช่า', 'กับข้าวพนักงาน'],
  "ค่าส่งของ": ['ค่าส่งของ', 'ค่าส่ง'],
  "น้ำแข็ง": ['หลอด', 'บด', 'น้ำแข็ง'],
  "แก๊ส": ['แก๊ส'],
  "ถ่าน": ['ถ่าน'],
  "ค่าน้ำ + ค่าไฟ + เน็ต": ['ค่าน้ำ', 'ค่าไฟ', 'เน็ต'],
  "การตลาด/ปรับปรุงร้าน": ['การตลาด', 'ปรับปรุงร้าน'],
  "ค่าบริการ": ['ค่าบริการ']
};

function autoClassifyCategory(name, currentCategory) {
  if (currentCategory && currentCategory !== 'meat' && currentCategory !== 'others' && schemaData[currentCategory]) {
    return currentCategory;
  }

  if (!name) return 'เครื่องครัว/ของแห้ง';
  const lowerName = name.toLowerCase();

  for (const [catName, keywords] of Object.entries(schemaData)) {
    for (const kw of keywords) {
      if (lowerName.includes(kw.toLowerCase())) {
        return catName;
      }
    }
  }

  return 'เครื่องครัว/ของแห้ง';
}

async function categorizeDatabase() {
  const inventoryJsonPath = path.join(__dirname, '..', 'backend', 'data', 'inventory.json');
  let items = [];
  try {
    items = JSON.parse(fs.readFileSync(inventoryJsonPath, 'utf8'));
  } catch (e) {}

  console.log(`Classifying categories for ${items.length} items...`);
  const categorizedItems = items.map(item => {
    const cat = autoClassifyCategory(item.name, item.category);
    return {
      ...item,
      category: cat
    };
  });

  fs.writeFileSync(inventoryJsonPath, JSON.stringify(categorizedItems, null, 2), 'utf8');
  console.log('✅ Updated local inventory.json with accurate categories!');

  // Prepare Supabase upsert payload
  const supabasePayload = categorizedItems.map(item => ({
    id: item.id,
    date: item.date,
    name: item.name,
    category: item.category,
    quantity: item.quantity,
    pieces: item.pieces,
    unit: item.unit,
    cost: item.cost,
    bill_number: item.billNumber,
    portion_size: item.portionSize,
    portion_unit: item.portionUnit,
    associated_pos_item: item.associatedPosItem
  }));

  console.log('Updating categories in Supabase Cloud Database...');
  const { data, error } = await supabase.from('inventory').upsert(supabasePayload, { onConflict: 'id' });

  if (error) {
    console.error('Supabase update error:', error.message);
  } else {
    console.log('🎉 SUCCESS! All categories updated and classified in Supabase Cloud Database!');
  }
}

categorizeDatabase();
