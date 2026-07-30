import React, { useState, useEffect, useRef } from 'react';
import { 
  Camera, 
  Upload, 
  Plus, 
  Trash2, 
  Pencil,
  ClipboardList, 
  TrendingUp, 
  AlertTriangle, 
  FileText, 
  CheckCircle2, 
  X, 
  RefreshCw,
  Image as ImageIcon,
  DollarSign,
  Package,
  Layers,
  PieChart
} from 'lucide-react';

const schemaData = {
  "เครื่องครัว/ของแห้ง": ['น้ำตาลปี๊บ', 'น้ำตาลทราย', 'งาขาว', 'ชูรส', 'น้ำปลา', 'น้ำส้มสายชู', 'น้ำปลาร้า', 'น้ำมัน', 'น้ำมันงา', 'ซอสมะเขือ', 'ซอสพริก', 'มายองเนส', 'น้ำจิ้มบ๊วย', 'ซอสสูตร5', 'ซอสหอยนางรม', 'ซีอิ๊วฉลากแดง', 'ซีอิ๊วขาว สูตร1', 'ซอสฝาเขียว', 'เบกกิ้งโซดา', 'ไวไว', 'มาม่า', 'หมี่หยก', 'วุ้นเส้น', 'ข้าวสาร', 'ข้าวคั่ว', 'ผงมะนาว', 'กระเทียมดอง', 'น้ำมะขาม', 'พริกป่น', 'โชยุ', 'วาซาบิ', 'เกลือ', 'น้ำยาล้างจาน', 'ผงซักฟอก', 'ถุงขยะ 18*20', 'ถุงหิ้ว 12*26', 'ถุงร้อน 8*12', 'ถุงหิ้ว 8*16', 'ไข่ไก่', 'เต้าหู้ไข่'],
  "ผัก": ['กะหล่ำ', 'เห็ดเข็ม', 'แครอท', 'ผักบุ้ง', 'ข้าวโพด', 'ต้นหอม', 'ผักชี', 'ตั้งโอ๋', 'กระเทียม', 'กระเทียมเจียว', 'พริกไทย', 'พริกเขียว', 'พริกแดง', 'กุ้งแห้ง', 'มะละกอ', 'มะนาว', 'หอมใหญ่', 'หอมแดง', 'มะเขือเทศ', 'ถั่วฝักยาว', 'ถั่วตำไทย', 'ใบกะเพรา', 'ข่า', 'ตะไคร้', 'ใบมะกรูด', 'ผักชีใบเลื่อย', 'โหระพา', 'ใบเตย', 'เม็ดมะม่วง'],
  "เนื้อหมู / ไก่": ['เนื้อหมู', 'สามชั้น', 'สันคอ', 'หมูสับ', 'ตับ', 'เบคอน', 'เอ็นไก่', 'ปีกไก่', 'มันหมูเจียว', 'กระดูกหมู', 'สะโพกหมู', 'มันก้อน'],
  "เนื้อวัว": ['สันคอ', 'เสือ', 'สันใน', 'เนื้อออส', 'ผ้าขี้ริ้ว', 'สามชั้น', 'สันนอก'],
  "ทะเล": ['หมึกสด', 'หมึกหมูกะทะ', 'หมึกกรอบ', 'กุ้ง', 'กุ้ง หมูกะทะ', 'ปูอัด', 'เต้าหู้ปลา', 'กะพรุน'],
  "ของทอด": ['เกี๊ยวซ่า', 'เฟรนฟราย', 'นักเก็ต', 'ไก่กรอบ', 'แป้งทอดกรอบ', 'เอโร่ อิบิโรลไส้กุ้งแช่แข็ง', 'เต้าหู้ชีส'],
  "น้ำจิ้ม": ['วดี', 'BBQ'],
  "เครื่องดื่ม": ['น้ำอัดลม', 'โซดา', 'น้ำเปล่า', 'หลอดน้ำงอ', 'เบียร์ช้าง', 'เบียร์ลีโอ', 'เบียร์สิงห์', 'รีแบน', 'รีกลม', 'ขนมหวาน', 'ไอติม'],
  "Asset": ['แปรงขัดกระทะ', 'สเปรย์กำจัดแมลง', 'กาวดักแมลงวัน', 'น้ำยาถูพื้น', 'น้ำยาล้างจาน', 'ล้างห้องน้ำ', 'สบู่ล้างมือ', 'น้ำยาเช็ดโต๊ะ', 'ทิชชู่', 'หลอดงอ', 'ตะเกียบไม้', 'กระดาษความร้อน', 'อื่นๆ'],
  "เงินเดือนพนักงาน + ค่าเช่าร้าน + กับข้าวพนักงาน": ['เงินเดือนพนักงาน + ค่าเช่าร้าน + กับข้าวพนักงาน'],
  "ค่าส่งของ": ['ค่าส่งของ'],
  "น้ำแข็ง": ['หลอด', 'บด'],
  "แก๊ส": ['แก๊ส'],
  "ถ่าน": ['ถ่าน'],
  "ค่าน้ำ + ค่าไฟ + เน็ต": ['ค่าน้ำ + ค่าไฟ + เน็ต'],
  "การตลาด/ปรับปรุงร้าน": ['การตลาด/ปรับปรุงร้าน'],
  "ค่าบริการ": ['ค่าบริการ']
};

export default function InventoryManager({ role = 'admin', filterName = '', setFilterName = () => {} }) {
  const [subTab, setSubTab] = useState('intake'); // 'intake' | 'pos' | 'reconciliation'
  const [inventoryItems, setInventoryItems] = useState([]);
  const [posSales, setPosSales] = useState([]);
  const [reconData, setReconData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [categoryFilter, setCategoryFilter] = useState('all');

  // Form states
  const [name, setName] = useState('');
  const [category, setCategory] = useState('เครื่องครัว/ของแห้ง');
  const [quantity, setQuantity] = useState('');
  const [unit, setUnit] = useState('kg');
  const [cost, setCost] = useState('');
  const [billNumber, setBillNumber] = useState('');
  const [portionSize, setPortionSize] = useState('');
  const [portionUnit, setPortionUnit] = useState('kg');
  const [associatedPosItem, setAssociatedPosItem] = useState('');
  const [image, setImage] = useState(null);
  const [pieces, setPieces] = useState('');
  const [editingItem, setEditingItem] = useState(null);

  // Camera states
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState('');
  const videoRef = useRef(null);
  const streamRef = useRef(null);

  // POS Import states
  const [posPasteText, setPosPasteText] = useState('');
  const [showImageModal, setShowImageModal] = useState(null);

  // Categories helper
  const categories = {
    "เครื่องครัว/ของแห้ง": { label: 'เครื่องครัว/ของแห้ง', color: 'var(--accent-purple)', badgeClass: 'badge-closing' },
    "ผัก": { label: 'ผัก', color: 'var(--accent-green)', badgeClass: 'badge-kitchen' },
    "เนื้อหมู / ไก่": { label: 'เนื้อหมู / ไก่', color: 'var(--accent-amber)', badgeClass: 'badge-opening' },
    "เนื้อวัว": { label: 'เนื้อวัว', color: 'var(--accent-pink)', badgeClass: 'badge-shift_handover' },
    "ทะเล": { label: 'ทะเล', color: 'var(--accent-blue)', badgeClass: 'badge-bar' },
    "ของทอด": { label: 'ของทอด', color: 'var(--accent-orange)', badgeClass: 'badge-cleaning' },
    "น้ำจิ้ม": { label: 'น้ำจิ้ม', color: 'var(--accent-purple)', badgeClass: 'badge-opening' },
    "เครื่องดื่ม": { label: 'เครื่องดื่ม', color: 'var(--accent-amber)', badgeClass: 'badge-bar' },
    "Asset": { label: 'Asset', color: 'var(--text-muted)', badgeClass: 'badge-cleaning' },
    "เงินเดือนพนักงาน + ค่าเช่าร้าน + กับข้าวพนักงาน": { label: 'เงินเดือน', color: 'var(--text-muted)', badgeClass: 'badge-closing' },
    "ค่าส่งของ": { label: 'ค่าส่งของ', color: 'var(--text-muted)', badgeClass: 'badge-shift_handover' },
    "น้ำแข็ง": { label: 'น้ำแข็ง', color: 'var(--text-muted)', badgeClass: 'badge-bar' },
    "แก๊ส": { label: 'แก๊ส', color: 'var(--text-muted)', badgeClass: 'badge-kitchen' },
    "ถ่าน": { label: 'ถ่าน', color: 'var(--text-muted)', badgeClass: 'badge-bar' },
    "ค่าน้ำ + ค่าไฟ + เน็ต": { label: 'ค่าน้ำ/ไฟ/เน็ต', color: 'var(--text-muted)', badgeClass: 'badge-closing' },
    "การตลาด/ปรับปรุงร้าน": { label: 'การตลาด', color: 'var(--text-muted)', badgeClass: 'badge-opening' },
    "ค่าบริการ": { label: 'ค่าบริการ', color: 'var(--text-muted)', badgeClass: 'badge-shift_handover' },
    "others": { label: 'อื่นๆ', color: 'var(--text-muted)', badgeClass: 'badge-cleaning' }
  };

  useEffect(() => {
    fetchInventory();
    fetchPosSales();
    fetchReconciliation();
  }, []);

  useEffect(() => {
    if (role === 'staff') {
      setSubTab('intake');
    }
  }, [role]);

  useEffect(() => {
    if (schemaData[category] && schemaData[category].length > 0) {
      setName(schemaData[category][0]);
    } else {
      setName('');
    }
  }, [category]);

  const fetchInventory = async () => {
    try {
      const res = await fetch('/api/inventory');
      if (res.ok) setInventoryItems(await res.json());
    } catch (err) {
      console.error('Error fetching inventory:', err);
    }
  };

  const fetchPosSales = async () => {
    try {
      const res = await fetch('/api/pos-sales');
      if (res.ok) setPosSales(await res.json());
    } catch (err) {
      console.error('Error fetching POS sales:', err);
    }
  };

  const fetchReconciliation = async () => {
    try {
      const res = await fetch('/api/reconciliation');
      if (res.ok) {
        const data = await res.json();
        setReconData(data.reconciliation || []);
      }
    } catch (err) {
      console.error('Error fetching reconciliation:', err);
    }
  };

  // CAMERA FUNCTIONS
  const startCamera = async () => {
    setCameraError('');
    setCameraActive(true);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'environment', width: 640, height: 480 } 
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
    } catch (err) {
      console.error('Camera access denied:', err);
      setCameraError('ไม่สามารถเข้าถึงกล้องถ่ายรูปได้ กรุณาใช้การอัปโหลดไฟล์แทน');
      setCameraActive(false);
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setCameraActive(false);
  };

  const capturePhoto = () => {
    if (!videoRef.current) return;
    const canvas = document.createElement('canvas');
    canvas.width = videoRef.current.videoWidth || 640;
    canvas.height = videoRef.current.videoHeight || 480;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
    
    const base64Image = canvas.toDataURL('image/jpeg', 0.85);
    setImage(base64Image);
    stopCamera();
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => {
      setImage(reader.result);
    };
    reader.readAsDataURL(file);
  };

  // FORM SUBMISSION
  const handleSaveInventory = async (e) => {
    e.preventDefault();
    if (!name || !quantity || !cost) {
      alert('กรุณากรอกข้อมูลที่จำเป็น: ชื่อวัตถุดิบ, จำนวน และต้นทุนรวม');
      return;
    }

    setLoading(true);
    try {
      const payload = {
        name,
        category,
        quantity: parseFloat(quantity),
        pieces: parseFloat(pieces) || 0,
        unit,
        cost: parseFloat(cost),
        billNumber,
        image,
        portionSize: parseFloat(portionSize) || (quantity ? parseFloat(quantity) : 1),
        portionUnit: portionUnit || unit,
        associatedPosItem: associatedPosItem || name
      };

      const isEdit = !!editingItem;
      const url = isEdit ? `/api/inventory/${editingItem.id}` : '/api/inventory';
      const method = isEdit ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method: method,
        headers: { 
          'Content-Type': 'application/json',
          'x-user-role': role
        },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        // Clear form
        setName('');
        setQuantity('');
        setPieces('');
        setCost('');
        setBillNumber('');
        setImage(null);
        setPortionSize('');
        setPortionUnit('kg');
        setAssociatedPosItem('');
        setEditingItem(null);
        
        // Refresh Lists
        await Promise.all([
          fetchInventory(),
          fetchReconciliation()
        ]);
        alert(isEdit ? 'แก้ไขข้อมูลวัตถุดิบสำเร็จ!' : 'บันทึกข้อมูลนำเข้าวัตถุดิบสำเร็จ!');
      } else {
        const errorData = await res.json().catch(() => ({}));
        alert(errorData.error || 'บันทึกข้อมูลไม่สำเร็จ กรุณาลองใหม่อีกครั้ง');
      }
    } catch (err) {
      console.error('Error saving inventory:', err);
      alert('เกิดข้อผิดพลาดในการเชื่อมต่อเซิร์ฟเวอร์');
    } finally {
      setLoading(false);
    }
  };

  const handleEditInventory = (item) => {
    setEditingItem(item);
    setName(item.name || '');
    setCategory(item.category || 'เครื่องครัว/ของแห้ง');
    setQuantity(item.quantity !== undefined ? item.quantity.toString() : '');
    setPieces(item.pieces !== undefined && item.pieces !== null ? item.pieces.toString() : '');
    setUnit(item.unit || '');
    setCost(item.cost !== undefined ? item.cost.toString() : '');
    setBillNumber(item.billNumber || '');
    setPortionSize(item.portionSize !== undefined ? item.portionSize.toString() : '');
    setPortionUnit(item.portionUnit || '');
    setAssociatedPosItem(item.associatedPosItem || '');
    setImage(item.image || null);
    
    // Switch to intake tab
    setSubTab('intake');
  };

  const handleCancelEdit = () => {
    setEditingItem(null);
    setName('');
    setCategory('เครื่องครัว/ของแห้ง');
    setQuantity('');
    setPieces('');
    setUnit('kg');
    setCost('');
    setBillNumber('');
    setPortionSize('');
    setPortionUnit('kg');
    setAssociatedPosItem('');
    setImage(null);
  };

  const handleDeleteInventory = async (id) => {
    if (!confirm('ยืนยันที่จะลบรายการรับเข้าวัตถุดิบนี้หรือไม่?')) return;
    try {
      const res = await fetch(`/api/inventory/${id}`, { 
        method: 'DELETE',
        headers: { 'x-user-role': role }
      });
      if (res.ok) {
        await Promise.all([
          fetchInventory(),
          fetchReconciliation()
        ]);
      } else {
        const errorData = await res.json().catch(() => ({}));
        alert(errorData.error || 'ลบข้อมูลไม่สำเร็จ');
      }
    } catch (err) {
      console.error('Error deleting inventory:', err);
    }
  };

  // POS IMPORT
  const handleImportPOS = async (e) => {
    e.preventDefault();
    if (!posPasteText.trim()) {
      alert('กรุณากรอกหรือวางข้อมูลยอดขายก่อนทำการนำเข้า');
      return;
    }

    // Parse CSV or Text
    // Expected format: menuItemName,quantitySold (or tab separated, or lines)
    const lines = posPasteText.split('\n');
    const salesList = [];

    lines.forEach(line => {
      if (!line.trim()) return;
      // Split by comma, tab or semicolon
      const parts = line.split(/[,\t;]+/);
      if (parts.length >= 2) {
        const itemName = parts[0].replace(/"/g, '').trim();
        const quantitySold = parseInt(parts[1].trim());
        if (itemName && !isNaN(quantitySold)) {
          salesList.push({ itemName, quantitySold });
        }
      }
    });

    if (salesList.length === 0) {
      alert('ไม่พบรูปแบบข้อมูลที่ถูกต้อง รูปแบบที่ถูกต้องคือ: "ชื่อเมนู,จำนวนที่ขาย"');
      return;
    }

    try {
      const res = await fetch('/api/pos-sales/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sales: salesList })
      });

      if (res.ok) {
        setPosPasteText('');
        await Promise.all([
          fetchPosSales(),
          fetchReconciliation()
        ]);
        alert(`นำเข้ายอดขายเรียบร้อยแล้ว รวมทั้งหมด ${salesList.length} รายการ!`);
      } else {
        alert('การนำเข้าข้อมูลไม่สำเร็จ');
      }
    } catch (err) {
      console.error('Error importing POS sales:', err);
      alert('เกิดข้อผิดพลาดในการเชื่อมต่อ');
    }
  };

  const handleClearPOS = async () => {
    if (!confirm('ต้องการล้างข้อมูลยอดขาย POS ทั้งหมดในตารางหรือไม่?')) return;
    try {
      const res = await fetch('/api/pos-sales', { method: 'DELETE' });
      if (res.ok) {
        await Promise.all([
          fetchPosSales(),
          fetchReconciliation()
        ]);
      }
    } catch (err) {
      console.error('Error clearing POS sales:', err);
    }
  };

  // Mock POS preset loader
  const loadMockPreset = (presetType) => {
    const presets = {
      lunch: `ข้าวหมูกรอบ,22\nแซลมอนซาชิมิ,8\nต้มยำกุ้งน้ำข้น,12\nผัดผักบุ้งไฟแดง,14\nไก่ผัดเม็ดมะม่วง,9`,
      dinner: `ข้าวหมูกรอบ,42\nแซลมอนซาชิมิ,28\nต้มยำกุ้งน้ำข้น,31\nผัดผักบุ้งไฟแดง,26\nไก่ผัดเม็ดมะม่วง,18\nเสต็กเนื้อริบอาย,12`
    };
    setPosPasteText(presets[presetType] || '');
  };

  // Filters
  const filteredInventory = inventoryItems.filter(item => {
    if (categoryFilter !== 'all' && item.category !== categoryFilter) return false;
    if (filterName) {
      return item.name.toLowerCase().includes(filterName.toLowerCase());
    }
    return true;
  });

  const filteredPosSales = posSales.filter(sale => {
    if (filterName) {
      return sale.itemName.toLowerCase().includes(filterName.toLowerCase());
    }
    return true;
  });

  const filteredReconData = reconData.filter(row => {
    if (filterName) {
      return (
        row.name.toLowerCase().includes(filterName.toLowerCase()) ||
        (row.posItemMatched && row.posItemMatched.toLowerCase().includes(filterName.toLowerCase()))
      );
    }
    return true;
  });

  // Total Calculations
  const totalReceivedCost = filteredInventory.reduce((acc, curr) => acc + curr.cost, 0);
  const totalPotentialServings = filteredReconData.reduce((acc, curr) => acc + curr.potentialServings, 0);
  const totalActualSold = filteredReconData.reduce((acc, curr) => acc + curr.actualSold, 0);
  const totalDiscrepancy = filteredReconData.reduce((acc, curr) => acc + curr.discrepancy, 0);

  // Helper to get formatted date string in Thai
  const formatThaiDate = (isoString) => {
    if (!isoString) return '-';
    const date = new Date(isoString);
    const months = ['ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.', 'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'];
    return `${date.getDate()} ${months[date.getMonth()]} ${date.getFullYear() + 543} ${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')} น.`;
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      
      {/* Sub Tabs menu */}
      {(role === 'admin' || role === 'manager') && (
        <div className="alert-bar" style={{ padding: '0.5rem 1rem', background: 'var(--bg-secondary)', marginBottom: '0' }}>
          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <button 
              className={`btn ${subTab === 'intake' ? 'btn-primary' : 'btn-secondary'}`} 
              onClick={() => setSubTab('intake')}
              style={{ padding: '0.5rem 1rem', borderRadius: '10px' }}
            >
              <Plus size={16} />
              <span>1. บันทึกรับวัตถุดิบ</span>
            </button>
            <button 
              className={`btn ${subTab === 'pos' ? 'btn-primary' : 'btn-secondary'}`} 
              onClick={() => setSubTab('pos')}
              style={{ padding: '0.5rem 1rem', borderRadius: '10px' }}
            >
              <ClipboardList size={16} />
              <span>2. นำเข้ายอดขาย POS</span>
            </button>
            <button 
              className={`btn ${subTab === 'reconciliation' ? 'btn-primary' : 'btn-secondary'}`} 
              onClick={() => setSubTab('reconciliation')}
              style={{ padding: '0.5rem 1rem', borderRadius: '10px' }}
            >
              <TrendingUp size={16} />
              <span>3. กระทบยอดและวิเคราะห์ส่วนต่าง</span>
            </button>
          </div>
          <div className="system-time" style={{ fontSize: '0.85rem' }}>
            คลังวัตถุดิบสะสม: <strong>{inventoryItems.length} รายการ</strong> | ยอดขาย: <strong>{posSales.length} เสิร์ฟ</strong>
          </div>
        </div>
      )}

      {/* Active Filter Indicator */}
      {filterName && (
        <div className="alert-bar" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(188, 170, 144, 0.15)', border: '1px dashed var(--accent-amber)', padding: '0.75rem 1rem', borderRadius: '12px', margin: '0' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--accent-amber)' }}>
            <ClipboardList size={18} />
            <span>กำลังกรองแสดงเฉพาะวัตถุดิบ: <strong>"{filterName}"</strong></span>
          </div>
          <button 
            type="button"
            className="btn btn-secondary" 
            style={{ padding: '0.25rem 0.75rem', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '0.25rem', border: '1px solid rgba(188, 170, 144, 0.3)' }}
            onClick={() => setFilterName('')}
          >
            <X size={14} />
            <span>ล้างการกรอง (แสดงทั้งหมด)</span>
          </button>
        </div>
      )}

      {/* TAB 1: INTAKE */}
      {subTab === 'intake' && (
        <div className="sop-grid">
          {/* Left Column: Form */}
          <form className="card card-accent-amber" onSubmit={handleSaveInventory} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <div className="card-title-row" style={{ marginBottom: '0.5rem' }}>
              <h2>{editingItem ? 'แก้ไขข้อมูลวัตถุดิบขาเข้า' : 'บันทึกรับวัตถุดิบขาเข้า'}</h2>
              <Package size={20} className="logo-icon" />
            </div>

            <div className="form-group">
              <label>ชื่อวัตถุดิบ <span style={{ color: 'var(--accent-danger)' }}>*</span></label>
              <select 
                className="form-control" 
                value={name} 
                onChange={(e) => setName(e.target.value)} 
                required 
              >
                <option value="">-- เลือกรายการวัตถุดิบ --</option>
                {(schemaData[category] || []).map(item => (
                  <option key={item} value={item}>{item}</option>
                ))}
              </select>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div className="form-group">
                <label>หมวดหมู่วัตถุดิบ</label>
                <select className="form-control" value={category} onChange={(e) => setCategory(e.target.value)}>
                  {Object.keys(categories).map(key => (
                    <option key={key} value={key}>{categories[key].label}</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label>เลขที่บิล/ใบเสร็จ</label>
                <input 
                  type="text" 
                  className="form-control" 
                  placeholder="เช่น INV001" 
                  value={billNumber} 
                  onChange={(e) => setBillNumber(e.target.value)} 
                />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem' }}>
              <div className="form-group">
                <label>จำนวนที่รับเข้า <span style={{ color: 'var(--accent-danger)' }}>*</span></label>
                <input 
                  type="number" 
                  step="any" 
                  className="form-control" 
                  placeholder="เช่น 10, 2500" 
                  value={quantity} 
                  onChange={(e) => setQuantity(e.target.value)} 
                  required 
                />
              </div>
              <div className="form-group">
                <label>จำนวนชิ้น</label>
                <input 
                  type="number" 
                  step="any" 
                  className="form-control" 
                  placeholder="เช่น 5" 
                  value={pieces} 
                  onChange={(e) => setPieces(e.target.value)} 
                />
              </div>
              <div className="form-group">
                <label>หน่วยนับ</label>
                <input 
                  type="text" 
                  className="form-control" 
                  placeholder="เช่น kg, กรัม, ชิ้น" 
                  value={unit} 
                  onChange={(e) => setUnit(e.target.value)} 
                />
              </div>
            </div>

            <div className="form-group">
              <label>ต้นทุนรวมทั้งหมด (บาท) <span style={{ color: 'var(--accent-danger)' }}>*</span></label>
              <input 
                type="number" 
                step="any" 
                className="form-control" 
                placeholder="เช่น 1500" 
                value={cost} 
                onChange={(e) => setCost(e.target.value)} 
                required 
              />
            </div>

            {/* Serving Calculation parameters */}
            <div style={{ padding: '1rem', background: 'rgba(255,255,255,0.02)', borderRadius: '12px', border: '1px solid var(--border-card)' }}>
              <h4 style={{ fontSize: '0.85rem', fontWeight: '600', marginBottom: '0.75rem', display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                <PieChart size={16} style={{ color: 'var(--accent-green)' }} />
                <span>การคำนวณจำนวนจานเสิร์ฟ</span>
              </h4>
              <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '1rem', marginBottom: '0.75rem' }}>
                <div className="form-group" style={{ marginBottom: '0' }}>
                  <label>ปริมาณใช้ต่อ 1 เสิร์ฟ</label>
                  <input 
                    type="number" 
                    step="any" 
                    className="form-control" 
                    placeholder="เช่น 0.2 (200กรัม)" 
                    value={portionSize} 
                    onChange={(e) => setPortionSize(e.target.value)} 
                  />
                </div>
                <div className="form-group" style={{ marginBottom: '0' }}>
                  <label>หน่วยใช้ต่อเสิร์ฟ</label>
                  <input 
                    type="text" 
                    className="form-control" 
                    placeholder="เช่น kg" 
                    value={portionUnit} 
                    onChange={(e) => setPortionUnit(e.target.value)} 
                  />
                </div>
              </div>
              <div className="form-group" style={{ marginBottom: '0' }}>
                <label>ชื่อเมนูที่ใช้ใน POS เพื่อเช็คยอดขาย</label>
                <input 
                  type="text" 
                  className="form-control" 
                  placeholder="เช่น ข้าวหมูกรอบ (เว้นว่างไว้จะใช้ชื่อวัตถุดิบ)" 
                  value={associatedPosItem} 
                  onChange={(e) => setAssociatedPosItem(e.target.value)} 
                />
              </div>
              {quantity && portionSize && (
                <div style={{ fontSize: '0.8rem', color: 'var(--accent-green)', marginTop: '0.5rem', fontWeight: '500' }}>
                  คาดว่าจะทำได้: <strong>{Math.floor(parseFloat(quantity) / parseFloat(portionSize))} เสิร์ฟ</strong>
                </div>
              )}
            </div>

            {/* Photo Capture Section */}
            <div className="form-group">
              <label>รูปภาพวัตถุดิบ / รูปบิลใบเสร็จ</label>
              
              {!image && !cameraActive && (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <button type="button" className="btn btn-secondary" onClick={startCamera}>
                    <Camera size={16} />
                    <span>เปิดกล้องถ่ายภาพ</span>
                  </button>
                  <div style={{ position: 'relative' }}>
                    <input 
                      type="file" 
                      accept="image/*" 
                      id="file-upload" 
                      style={{ display: 'none' }} 
                      onChange={handleFileChange}
                    />
                    <label htmlFor="file-upload" className="btn btn-secondary" style={{ width: '100%', cursor: 'pointer' }}>
                      <Upload size={16} />
                      <span>อัปโหลดรูปภาพ</span>
                    </label>
                  </div>
                </div>
              )}

              {cameraActive && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', alignItems: 'center' }}>
                  <div style={{ position: 'relative', width: '100%', height: '240px', background: '#000', borderRadius: '12px', overflow: 'hidden', border: '1px solid var(--border-card)' }}>
                    <video ref={videoRef} style={{ width: '100%', height: '100%', objectFit: 'cover' }} muted playsInline />
                    <div style={{ position: 'absolute', bottom: '10px', left: '50%', transform: 'translateX(-50%)', display: 'flex', gap: '10px' }}>
                      <button type="button" className="btn btn-primary" onClick={capturePhoto}>ถ่ายภาพ</button>
                      <button type="button" className="btn btn-secondary" onClick={stopCamera}>ยกเลิก</button>
                    </div>
                  </div>
                  {cameraError && <p style={{ color: 'var(--accent-danger)', fontSize: '0.8rem' }}>{cameraError}</p>}
                </div>
              )}

              {image && (
                <div style={{ position: 'relative', width: '100%', height: '180px', borderRadius: '12px', overflow: 'hidden', border: '1px solid var(--border-card)' }}>
                  <img src={image} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt="Captured Bill" />
                  <button 
                    type="button" 
                    className="btn btn-danger btn-icon-only" 
                    onClick={() => setImage(null)}
                    style={{ position: 'absolute', top: '10px', right: '10px', width: '30px', height: '30px', borderRadius: '50%' }}
                  >
                    <X size={16} />
                  </button>
                </div>
              )}
            </div>

            {editingItem ? (
              <div style={{ display: 'flex', gap: '1rem', width: '100%' }}>
                <button 
                  type="submit" 
                  className="btn btn-primary" 
                  style={{ flexGrow: 2, padding: '0.85rem' }} 
                  disabled={loading}
                >
                  {loading ? 'กำลังบันทึกการแก้ไข...' : 'บันทึกการแก้ไข'}
                </button>
                <button 
                  type="button" 
                  className="btn btn-secondary" 
                  style={{ flexGrow: 1, padding: '0.85rem' }} 
                  onClick={handleCancelEdit}
                >
                  ยกเลิก
                </button>
              </div>
            ) : (
              <button type="submit" className="btn btn-primary" style={{ width: '100%', padding: '0.85rem' }} disabled={loading}>
                {loading ? 'กำลังบันทึกข้อมูล...' : 'บันทึกรับวัตถุดิบ'}
              </button>
            )}
          </form>

          {/* Right Column: Inventory Logs */}
          <div className="card card-accent-blue" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <div className="card-title-row" style={{ marginBottom: '0.5rem' }}>
              <h2>ประวัติการรับเข้าวัตถุดิบ</h2>
              <select 
                className="form-control" 
                style={{ width: '180px', padding: '0.4rem 0.8rem', fontSize: '0.85rem' }}
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
              >
                <option value="all">ทุกหมวดหมู่</option>
                {Object.keys(categories).map(key => (
                  <option key={key} value={key}>{categories[key].label}</option>
                ))}
              </select>
            </div>

            <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem' }}>
              <div style={{ position: 'relative', flexGrow: 1 }}>
                <input 
                  type="text" 
                  className="form-control" 
                  placeholder="พิมพ์ค้นหา/กรองชื่อวัตถุดิบที่นี่..." 
                  value={filterName}
                  onChange={(e) => setFilterName(e.target.value)}
                  style={{ paddingRight: '2.5rem', padding: '0.45rem 1rem', fontSize: '0.85rem', borderRadius: '10px' }}
                />
                {filterName && (
                  <button 
                    type="button"
                    style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', display: 'flex', alignItems: 'center', padding: 0 }}
                    onClick={() => setFilterName('')}
                    title="ล้างข้อมูลการค้นหา"
                  >
                    <X size={16} />
                  </button>
                )}
              </div>
            </div>

            <div className="list-container" style={{ maxHeight: '620px' }}>
              {filteredInventory.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
                  <Package size={48} style={{ marginBottom: '1rem', strokeWidth: 1.2 }} />
                  <p>ไม่พบรายการวัตถุดิบที่บันทึกไว้</p>
                </div>
              ) : (
                filteredInventory.map(item => {
                  const cat = categories[item.category] || categories.others;
                  const potential = item.portionSize > 0 ? Math.floor(item.quantity / item.portionSize) : 0;
                  return (
                    <div className="list-item" key={item.id} style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                      {item.image ? (
                        <div 
                          style={{ width: '50px', height: '50px', borderRadius: '8px', overflow: 'hidden', cursor: 'zoom-in', border: '1px solid var(--border-card)', flexShrink: 0 }}
                          onClick={() => setShowImageModal(item.image)}
                        >
                          <img src={item.image} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt="" />
                        </div>
                      ) : (
                        <div style={{ width: '50px', height: '50px', borderRadius: '8px', background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border-card)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', flexShrink: 0 }}>
                          <ImageIcon size={20} />
                        </div>
                      )}

                      <div className="item-info" style={{ flexGrow: 1 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <span className="item-title">{item.name}</span>
                          <span className={`badge ${cat.badgeClass}`}>{cat.label}</span>
                        </div>
                        <span className="item-subtitle">
                          จำนวน: <strong>{item.quantity || 0} {item.unit || ''}</strong> {item.pieces ? <span>({item.pieces} ชิ้น)</span> : ''} | ราคารับเข้า: <strong>{(item.cost || 0).toLocaleString()} บาท</strong>
                        </span>
                        <span className="item-subtitle" style={{ color: 'var(--accent-green)' }}>
                          คำนวณจำนวนเสิร์ฟ: <strong>{potential} เสิร์ฟ</strong> (สูตรใช้ {item.portionSize} {item.portionUnit}/เสิร์ฟ)
                        </span>
                        {item.billNumber && (
                          <span className="item-subtitle" style={{ fontSize: '0.75rem', opacity: 0.8 }}>
                            เลขบิล: {item.billNumber} | POS จับคู่: {item.associatedPosItem || item.name}
                          </span>
                        )}
                        <span className="item-subtitle" style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                          บันทึกเมื่อ: {formatThaiDate(item.date)}
                        </span>
                      </div>

                      {(role === 'admin' || role === 'manager') && (
                        <div style={{ display: 'flex', gap: '0.5rem', flexShrink: 0 }}>
                          <button 
                            type="button"
                            className="btn btn-secondary btn-icon-only" 
                            onClick={() => handleEditInventory(item)}
                            title="แก้ไขรายการ"
                          >
                            <Pencil size={16} style={{ color: 'var(--accent-blue)' }} />
                          </button>
                          <button 
                            type="button"
                            className="btn btn-danger btn-icon-only" 
                            onClick={() => handleDeleteInventory(item.id)}
                            title="ลบรายการ"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>

            {inventoryItems.length > 0 && (
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '1rem', background: 'rgba(255,255,255,0.01)', borderRadius: '12px', border: '1px solid var(--border-card)', marginTop: 'auto' }}>
                <span style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>ต้นทุนสะสมรวมทั้งหมด:</span>
                <strong style={{ color: 'var(--accent-amber)', fontSize: '1.05rem' }}>{totalReceivedCost.toLocaleString()} บาท</strong>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 2: POS IMPORT */}
      {subTab === 'pos' && (
        <div className="sop-grid">
          {/* Left Column: Import Box */}
          <form className="card card-accent-purple" onSubmit={handleImportPOS} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <div className="card-title-row" style={{ marginBottom: '0.5rem' }}>
              <h2>นำเข้าข้อมูลยอดขายจาก POS</h2>
              <ClipboardList size={20} className="logo-icon" />
            </div>

            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: '1.4' }}>
              ระบุรายการเมนูและจำนวนจาน/เสิร์ฟที่ขายได้จากระบบขายของร้าน (POS) เพื่อใช้คำนวณเปรียบเทียบหาปริมาณวัตถุดิบและของเสีย
            </p>

            {/* Quick Presets */}
            <div style={{ display: 'flex', gap: '0.5rem', flexDirection: 'column' }}>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>ใช้ข้อมูลตัวอย่างด่วน:</span>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button type="button" className="btn btn-secondary" onClick={() => loadMockPreset('lunch')} style={{ flex: 1, fontSize: '0.8rem' }}>
                  ☀️ โหลดยอดขายจำลอง มื้อเที่ยง
                </button>
                <button type="button" className="btn btn-secondary" onClick={() => loadMockPreset('dinner')} style={{ flex: 1, fontSize: '0.8rem' }}>
                  🌙 โหลดยอดขายจำลอง มื้อค่ำ
                </button>
              </div>
            </div>

            <div className="form-group">
              <label>วางข้อมูลยอดขาย (คั่นด้วยเครื่องหมายจุลภาค <code>,</code> หรือเว้นวรรค/Tab)</label>
              <textarea 
                className="form-control" 
                placeholder="รูปแบบ:&#10;ชื่อเมนู,จำนวนขาย&#10;เช่น:&#10;ข้าวหมูกรอบ,42&#10;แซลมอนซาชิมิ,28" 
                value={posPasteText} 
                onChange={(e) => setPosPasteText(e.target.value)}
                style={{ height: '240px', fontFamily: 'monospace', fontSize: '0.9rem' }}
                required
              />
            </div>

            <div style={{ display: 'flex', gap: '1rem' }}>
              <button type="button" className="btn btn-secondary" style={{ flex: 1 }} onClick={() => setPosPasteText('')}>
                ล้างข้อมูลพิมพ์
              </button>
              <button type="submit" className="btn btn-primary" style={{ flex: 1.5 }}>
                นำเข้าข้อมูลสู่ระบบ
              </button>
            </div>
          </form>

          {/* Right Column: POS Sales List */}
          <div className="card card-accent-green" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <div className="card-title-row" style={{ marginBottom: '0.5rem' }}>
              <h2>ข้อมูลยอดขายที่นำเข้าแล้ว</h2>
              {posSales.length > 0 && (
                <button className="btn btn-danger" onClick={handleClearPOS} style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem' }}>
                  <Trash2 size={14} />
                  <span>ล้างข้อมูลยอดขายทั้งหมด</span>
                </button>
              )}
            </div>

            <div className="list-container" style={{ maxHeight: '520px' }}>
              {filteredPosSales.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
                  <ClipboardList size={48} style={{ marginBottom: '1rem', strokeWidth: 1.2 }} />
                  <p>{filterName ? 'ไม่พบข้อมูลยอดขายตามเงื่อนไขการกรอง' : 'ยังไม่มีข้อมูลยอดขายในระบบ\nกรุณานำเข้าข้อมูลจากฟอร์มด้านซ้าย'}</p>
                </div>
              ) : (
                filteredPosSales.map((sale) => (
                  <div className="list-item" key={sale.id}>
                    <div className="item-info">
                      <span className="item-title">{sale.itemName}</span>
                      <span className="item-subtitle" style={{ fontSize: '0.75rem' }}>
                        นำเข้าเมื่อ: {formatThaiDate(sale.importDate)}
                      </span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <span style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>ขายได้:</span>
                      <span className="badge badge-kitchen" style={{ fontSize: '0.95rem', fontWeight: 'bold' }}>
                        {sale.quantitySold} เสิร์ฟ
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>

            {filteredPosSales.length > 0 && (
              <div style={{ padding: '1rem', background: 'rgba(255,255,255,0.01)', borderRadius: '12px', border: '1px solid var(--border-card)', marginTop: 'auto', display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>จำนวนจานเสิร์ฟที่จำหน่ายรวม:</span>
                <strong style={{ color: 'var(--accent-green)', fontSize: '1.1rem' }}>
                  {filteredPosSales.reduce((acc, curr) => acc + curr.quantitySold, 0).toLocaleString()} เสิร์ฟ
                </strong>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 3: RECONCILIATION */}
      {subTab === 'reconciliation' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {/* Summary metrics row */}
          <div className="metrics-grid">
            <div className="card metric-card blue">
              <div className="metric-icon-wrapper">
                <Package size={24} />
              </div>
              <div className="metric-details">
                <p>จำนวนเสิร์ฟวัตถุดิบทั้งหมดที่ซื้อ</p>
                <div className="metric-number">{totalPotentialServings} จาน</div>
              </div>
            </div>
            
            <div className="card metric-card green">
              <div className="metric-icon-wrapper">
                <TrendingUp size={24} />
              </div>
              <div className="metric-details">
                <p>ยอดขายจานเสิร์ฟจริง (จาก POS)</p>
                <div className="metric-number">{totalActualSold} จาน</div>
              </div>
            </div>

            <div className={`card metric-card ${totalDiscrepancy > 0 ? 'pink' : 'purple'}`}>
              <div className="metric-icon-wrapper">
                <AlertTriangle size={24} />
              </div>
              <div className="metric-details">
                <p>ของเสีย / จำนวนเสิร์ฟที่ขาดหาย</p>
                <div className="metric-number" style={{ color: totalDiscrepancy > 0 ? 'var(--accent-danger)' : 'var(--text-primary)' }}>
                  {totalDiscrepancy} จาน
                </div>
              </div>
            </div>
          </div>

          {/* Reconciliation Table */}
          <div className="card card-accent-green" style={{ overflowX: 'auto' }}>
            <div className="card-title-row" style={{ marginBottom: '1.25rem' }}>
              <h2>ตารางกระทบยอดขายและวัตถุดิบขาเข้า</h2>
              <button 
                className="btn btn-secondary" 
                onClick={fetchReconciliation}
                style={{ padding: '0.4rem 0.8rem', fontSize: '0.85rem' }}
              >
                <RefreshCw size={14} />
                <span>รีเฟรชข้อมูล</span>
              </button>
            </div>

            {filteredReconData.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '4rem', color: 'var(--text-muted)' }}>
                <TrendingUp size={48} style={{ marginBottom: '1rem', strokeWidth: 1.2 }} />
                <p>{filterName ? 'ไม่พบข้อมูลการกระทบยอดวัตถุดิบตามที่คัดกรอง' : 'ยังไม่มีข้อมูลในการกระทบยอด\nกรุณากรอกข้อมูลวัตถุดิบขาเข้าในขั้นตอนที่ 1 และนำเข้ายอดขายในขั้นตอนที่ 2'}</p>
              </div>
            ) : (
              <table className="reconciliation-table">
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--border-card)', color: 'var(--text-secondary)' }}>
                    <th style={{ padding: '0.75rem 1rem' }}>วัตถุดิบ</th>
                    <th style={{ padding: '0.75rem 1rem' }}>หมวดหมู่</th>
                    <th style={{ padding: '0.75rem 1rem' }}>ปริมาณรับเข้ารวม</th>
                    <th style={{ padding: '0.75rem 1rem' }}>จานเสิร์ฟคาดการณ์ (A)</th>
                    <th style={{ padding: '0.75rem 1rem' }}>จานขายจริงจาก POS (B)</th>
                    <th style={{ padding: '0.75rem 1rem' }}>ส่วนต่างของเสีย (A - B)</th>
                    <th style={{ padding: '0.75rem 1rem', width: '220px' }}>สถานะ/ส่วนต่าง (%)</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredReconData.map((row, idx) => {
                    const cat = categories[row.category] || categories.others;
                    const lossColor = row.discrepancy > 0 ? 'var(--accent-danger)' : 'var(--accent-green)';
                    const lossPercent = row.discrepancyPercentage;
                    
                    return (
                      <tr key={idx} style={{ borderBottom: '1px solid rgba(255,255,255,0.03)', height: '60px' }}>
                        <td style={{ padding: '0.75rem 1rem', fontWeight: '500' }}>
                          <div>{row.name}</div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                            POS: {row.posItemMatched}
                          </div>
                        </td>
                        <td style={{ padding: '0.75rem 1rem' }}>
                          <span className={`badge ${cat.badgeClass}`}>{cat.label}</span>
                        </td>
                        <td style={{ padding: '0.75rem 1rem' }}>
                          {row.totalQuantity.toLocaleString()} {row.unit}
                        </td>
                        <td style={{ padding: '0.75rem 1rem', fontWeight: 'bold', color: 'var(--accent-blue)' }}>
                          {row.potentialServings} เสิร์ฟ
                        </td>
                        <td style={{ padding: '0.75rem 1rem', fontWeight: 'bold', color: 'var(--accent-green)' }}>
                          {row.actualSold} เสิร์ฟ
                        </td>
                        <td style={{ padding: '0.75rem 1rem', fontWeight: 'bold', color: lossColor }}>
                          {row.discrepancy} เสิร์ฟ
                        </td>
                        <td style={{ padding: '0.75rem 1rem' }}>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem' }}>
                              <span>{row.discrepancy > 0 ? 'ของเสีย' : 'ครบถ้วน'}</span>
                              <span style={{ color: lossColor }}>{lossPercent}%</span>
                            </div>
                            <div style={{ width: '100%', height: '6px', background: 'rgba(255,255,255,0.08)', borderRadius: '3px', overflow: 'hidden' }}>
                              <div style={{ 
                                width: `${Math.min(100, Math.max(0, 100 - lossPercent))}%`, 
                                height: '100%', 
                                background: lossPercent > 10 ? 'var(--accent-danger)' : 'var(--accent-green)' 
                              }} />
                            </div>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}

      {/* Image zoom modal */}
      {showImageModal && (
        <div 
          style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.85)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, cursor: 'zoom-out' }}
          onClick={() => setShowImageModal(null)}
        >
          <div style={{ position: 'relative', maxWidth: '90%', maxHeight: '80%', background: 'var(--bg-secondary)', borderRadius: '20px', overflow: 'hidden', padding: '1rem', border: '1px solid var(--border-card)' }}>
            <img src={showImageModal} style={{ maxWidth: '100%', maxHeight: '70vh', borderRadius: '12px' }} alt="Large preview" />
            <button 
              className="btn btn-secondary" 
              style={{ position: 'absolute', top: '15px', right: '15px', background: 'rgba(0,0,0,0.5)', border: 'none', borderRadius: '50%', width: '40px', height: '40px', padding: 0 }}
              onClick={() => setShowImageModal(null)}
            >
              <X size={20} />
            </button>
          </div>
        </div>
      )}

    </div>
  );
}
