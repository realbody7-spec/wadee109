import React, { useState } from 'react';
import { 
  ClipboardList, 
  Clock, 
  Settings, 
  MessageSquare, 
  Play, 
  Info,
  CalendarDays,
  Package,
  TrendingUp,
  BarChart3,
  ArrowUpRight,
  X
} from 'lucide-react';

export default function Dashboard({ sops, schedules, logs, settings, onTriggerSchedule, setView, inventory = [], reconciliation = [], role = 'admin', setInventoryFilterName }) {
  // Count statistics
  const activeSchedulesCount = schedules.filter(s => s.active).length;
  const totalSops = sops.length;
  const totalNotifications = logs.length;
  const isSimulation = settings.simulationMode;

  // Chart & Drill-Down Configuration
  const [chartType, setChartType] = useState('daily'); // 'daily' | 'monthly'
  const [daysRange, setDaysRange] = useState(7); // 7 | 15 | 30
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [tooltip, setTooltip] = useState({ visible: false, x: 0, y: 0, date: '', category: '', cost: 0 });
  const [selectedCategoryModal, setSelectedCategoryModal] = useState(null);
  const [hoveredCategoryKey, setHoveredCategoryKey] = useState(null);
  const [modalSearchText, setModalSearchText] = useState('');

  // Map of categories to labels and colors
  const categoriesConfig = {
    "เครื่องครัว/ของแห้ง": { label: 'เครื่องครัว/ของแห้ง', color: '#8b5cf6' }, // violet
    "ผัก": { label: 'ผัก', color: '#10b981' }, // green
    "เนื้อหมู / ไก่": { label: 'เนื้อหมู / ไก่', color: '#f59e0b' }, // amber
    "เนื้อวัว": { label: 'เนื้อวัว', color: '#ec4899' }, // pink
    "ทะเล": { label: 'ทะเล', color: '#3b82f6' }, // blue
    "ของทอด": { label: 'ของทอด', color: '#f97316' }, // orange
    "น้ำจิ้ม": { label: 'น้ำจิ้ม', color: '#a855f7' }, // purple
    "เครื่องดื่ม": { label: 'เครื่องดื่ม', color: '#eab308' }, // yellow
    "Asset": { label: 'Asset', color: '#6b7280' }, // gray
    "เงินเดือนพนักงาน + ค่าเช่าร้าน + กับข้าวพนักงาน": { label: 'เงินเดือน/ค่าเช่า', color: '#ef4444' }, // red
    "ค่าส่งของ": { label: 'ค่าส่งของ', color: '#14b8a6' }, // teal
    "น้ำแข็ง": { label: 'น้ำแข็ง', color: '#06b6d4' }, // cyan
    "แก๊ส": { label: 'แก๊ส', color: '#f43f5e' }, // rose
    "ถ่าน": { label: 'ถ่าน', color: '#78350f' }, // brown
    "ค่าน้ำ + ค่าไฟ + เน็ต": { label: 'ค่าน้ำ/ไฟ/เน็ต', color: '#6366f1' }, // indigo
    "การตลาด/ปรับปรุงร้าน": { label: 'การตลาด', color: '#fca5a5' },
    "ค่าบริการ": { label: 'ค่าบริการ', color: '#4b5563' },
    "others": { label: 'อื่นๆ', color: '#9ca3af' }
  };

  // Format dates
  const formatDate = (isoString) => {
    if (!isoString) return 'ยังไม่เคยทำงาน';
    return new Date(isoString).toLocaleString('th-TH', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      day: 'numeric',
      month: 'short'
    });
  };

  const getLocalDayStr = (d) => {
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const date = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${date}`;
  };

  // Generate timeline labels based on selection
  const dailyLabels = [];
  for (let i = daysRange - 1; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    dailyLabels.push(getLocalDayStr(d));
  }

  const monthlyLabels = [];
  for (let m = 0; m < 12; m++) {
    const monthStr = String(m + 1).padStart(2, '0');
    monthlyLabels.push(`${selectedYear}-${monthStr}`);
  }

  const activeLabels = chartType === 'daily' ? dailyLabels : monthlyLabels;

  // Helper to normalize English or raw category strings into standard Thai category keys
  const normalizeCategory = (item) => {
    if (!item) return 'others';
    const rawCat = (item.category || '').toString().trim();
    const rawCatLower = rawCat.toLowerCase();
    const itemName = (item.name || '').toString().trim().toLowerCase();

    // 1. Exact match with configured Thai categories
    if (categoriesConfig[rawCat]) return rawCat;

    // 2. English / Alias mappings
    if (rawCatLower === 'meat') return 'เนื้อหมู / ไก่';
    if (rawCatLower === 'seafood') return 'ทะเล';
    if (rawCatLower === 'vegetables' || rawCatLower === 'vegetable' || rawCatLower === 'veg') return 'ผัก';
    if (rawCatLower === 'dairy' || rawCatLower === 'dry' || rawCatLower === 'groceries') return 'เครื่องครัว/ของแห้ง';
    if (rawCatLower === 'beef') return 'เนื้อวัว';
    if (rawCatLower === 'beverage' || rawCatLower === 'drink' || rawCatLower === 'drinks') return 'เครื่องดื่ม';
    if (rawCatLower === 'fried' || rawCatLower === 'snack') return 'ของทอด';
    if (rawCatLower === 'sauce') return 'น้ำจิ้ม';
    if (rawCatLower === 'asset') return 'Asset';
    if (rawCatLower === 'salary' || rawCatLower === 'rent') return 'เงินเดือนพนักงาน + ค่าเช่าร้าน + กับข้าวพนักงาน';
    if (rawCatLower === 'utility' || rawCatLower === 'utilities') return 'ค่าน้ำ + ค่าไฟ + เน็ต';

    // 3. Keyword matching from Item Name
    if (itemName.includes('หมู') || itemName.includes('ไก่') || itemName.includes('ตับ') || itemName.includes('เบคอน') || itemName.includes('สันคอ') || itemName.includes('สามชั้น') || itemName.includes('ปีก')) {
      return 'เนื้อหมู / ไก่';
    }
    if (itemName.includes('วัว') || itemName.includes('เนื้อออส') || itemName.includes('ริบอาย') || itemName.includes('เสือ') || itemName.includes('สันใน')) {
      return 'เนื้อวัว';
    }
    if (itemName.includes('กุ้ง') || itemName.includes('หมึก') || itemName.includes('ปู') || itemName.includes('ปลา') || itemName.includes('แซลมอน') || itemName.includes('ทะเล') || itemName.includes('กะพรุน')) {
      return 'ทะเล';
    }
    if (itemName.includes('ผัก') || itemName.includes('กะหล่ำ') || itemName.includes('เห็ด') || itemName.includes('แครอท') || itemName.includes('มะเขือ') || itemName.includes('หอม') || itemName.includes('กระเทียม') || itemName.includes('มะนาว') || itemName.includes('บล็อคโคลี่') || itemName.includes('ตั้งโอ๋')) {
      return 'ผัก';
    }
    if (itemName.includes('ซอส') || itemName.includes('น้ำจิ้ม') || itemName.includes('โชยุ') || itemName.includes('วาซาบิ') || itemName.includes('bbq')) {
      return 'น้ำจิ้ม';
    }
    if (itemName.includes('น้ำเปล่า') || itemName.includes('โซดา') || itemName.includes('เบียร์') || itemName.includes('เครื่องดื่ม') || itemName.includes('ไอติม') || itemName.includes('หลอด') || itemName.includes('น้ำอัดลม')) {
      return 'เครื่องดื่ม';
    }
    if (itemName.includes('ทอด') || itemName.includes('เฟรนฟราย') || itemName.includes('นักเก็ต') || itemName.includes('เกี๊ยวซ่า')) {
      return 'ของทอด';
    }
    if (itemName.includes('น้ำตาล') || itemName.includes('เนย') || itemName.includes('น้ำปลา') || itemName.includes('เกลือ') || itemName.includes('ชูรส') || itemName.includes('ไข่') || itemName.includes('ข้าว') || itemName.includes('ถุง') || itemName.includes('แป้ง') || itemName.includes('ซีอิ๊ว')) {
      return 'เครื่องครัว/ของแห้ง';
    }

    return rawCat || 'others';
  };

  // Process data from local inward logs (inventory)
  const chartData = activeLabels.map(label => {
    const labelItems = inventory.filter(item => {
      if (!item.date) return false;
      const itemDate = new Date(item.date);
      const year = itemDate.getFullYear();
      const month = String(itemDate.getMonth() + 1).padStart(2, '0');
      const date = String(itemDate.getDate()).padStart(2, '0');
      const itemLabel = chartType === 'daily' ? `${year}-${month}-${date}` : `${year}-${month}`;
      return itemLabel === label;
    });

    const total = labelItems.reduce((sum, item) => sum + (item.cost || 0), 0);
    
    // Group costs by category using normalizeCategory
    const breakdown = {};
    labelItems.forEach(item => {
      const cat = normalizeCategory(item);
      breakdown[cat] = (breakdown[cat] || 0) + (item.cost || 0);
    });

    return {
      label,
      total,
      breakdown
    };
  });

  // Calculate statistics for active period
  const periodTotal = chartData.reduce((sum, d) => sum + d.total, 0);
  const periodAverage = periodTotal / chartData.length;

  const periodCatCosts = {};
  chartData.forEach(d => {
    Object.keys(d.breakdown).forEach(cat => {
      periodCatCosts[cat] = (periodCatCosts[cat] || 0) + d.breakdown[cat];
    });
  });

  let topCat = null;
  let topCatCost = 0;
  Object.keys(periodCatCosts).forEach(cat => {
    if (periodCatCosts[cat] > topCatCost) {
      topCatCost = periodCatCosts[cat];
      topCat = cat;
    }
  });

  const maxVal = Math.max(...chartData.map(d => d.total), 1000);

  // Helper formatting for labels
  const formatDailyLabel = (dateStr) => {
    const parts = dateStr.split('-');
    if (parts.length !== 3) return dateStr;
    const [, m, d] = parts;
    const months = ['ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.', 'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'];
    return `${parseInt(d)} ${months[parseInt(m) - 1]}`;
  };

  const formatMonthlyLabel = (monthStr) => {
    const parts = monthStr.split('-');
    if (parts.length !== 2) return monthStr;
    const [y, m] = parts;
    const months = ['ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.', 'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'];
    const shortYear = (parseInt(y) + 543) % 100;
    return `${months[parseInt(m) - 1]} ${shortYear}`;
  };

  const categoriesInUse = Object.keys(periodCatCosts).filter(cat => periodCatCosts[cat] > 0);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem', position: 'relative' }}>
      {/* Simulation Banner */}
      <div className="alert-bar">
        <div className="alert-info-wrapper">
          <div style={{ color: isSimulation ? 'var(--accent-blue)' : 'var(--accent-green)', display: 'flex', alignItems: 'center' }}>
            <Info size={24} />
          </div>
          <div>
            <h4>{isSimulation ? 'ระบบอยู่ในโหมดจำลอง (Simulation Mode)' : 'ระบบอยู่ในโหมดใช้งานจริง (Production Mode)'}</h4>
            <p>
              {isSimulation 
                ? 'ระบบจะไม่ส่งข้อความจริงไปยังแชท แต่จะบันทึกข้อความไว้ที่หน้า "ประวัติการส่ง (Logs)" เพื่อใช้สำหรับทดสอบขั้นตอนการตั้งเวลา'
                : 'ข้อความแจ้งเตือนทั้งหมดจะถูกยิงไปยัง Line Notify/Push หรือ Facebook Messenger ตามที่ได้ตั้งค่าไว้'}
            </p>
          </div>
        </div>
        {role === 'admin' && (
          <button className="btn btn-secondary" onClick={() => setView('integrations')}>
            ตั้งค่าการเชื่อมต่อ
          </button>
        )}
      </div>

      {/* Metrics Section */}
      <div className="metrics-grid">
        <div className="card metric-card green">
          <div className="metric-icon-wrapper">
            <ClipboardList size={28} />
          </div>
          <div className="metric-details">
            <p>SOP ในระบบ</p>
            <div className="metric-number">{totalSops}</div>
          </div>
        </div>

        <div className="card metric-card blue">
          <div className="metric-icon-wrapper">
            <Clock size={28} />
          </div>
          <div className="metric-details">
            <p>ตารางเตือนที่รันอยู่</p>
            <div className="metric-number">{activeSchedulesCount} <span style={{fontSize: '1rem', fontWeight: 'normal', color: 'var(--text-secondary)'}}>/ {schedules.length}</span></div>
          </div>
        </div>

        <div className="card metric-card pink">
          <div className="metric-icon-wrapper">
            <Settings size={28} />
          </div>
          <div className="metric-details">
            <p>โหมดการแจ้งเตือน</p>
            <div className="metric-number" style={{ fontSize: '1.25rem', marginTop: '0.5rem', color: isSimulation ? 'var(--accent-blue)' : 'var(--accent-green)' }}>
              {isSimulation ? 'Simulation' : 'Live API'}
            </div>
          </div>
        </div>

        <div className="card metric-card purple">
          <div className="metric-icon-wrapper">
            <MessageSquare size={28} />
          </div>
          <div className="metric-details">
            <p>แจ้งเตือนไปแล้ว</p>
            <div className="metric-number">{totalNotifications}</div>
          </div>
        </div>
      </div>

      {/* NEW: Full-Width Expense Bar Chart Card */}
      {(role === 'admin' || role === 'manager') && (
        <div className="card card-accent-blue" style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {/* Header row with chart controller */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <div style={{ padding: '8px', background: 'rgba(14, 165, 233, 0.1)', color: 'var(--accent-blue)', borderRadius: '10px' }}>
                <BarChart3 size={22} />
              </div>
              <div>
                <h2 style={{ fontSize: '1.2rem', fontWeight: '700', color: 'var(--text-primary)' }}>วิเคราะห์ต้นทุนวัตถุดิบและค่าใช้จ่ายสะสม</h2>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>คำนวณแบบเรียลไทม์จากบันทึกรับเข้าคลังสินค้า</p>
              </div>
            </div>

            {/* Controls */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
              {/* Type Selector Toggle */}
              <div style={{ display: 'flex', background: 'rgba(0,0,0,0.15)', padding: '3px', borderRadius: '8px', border: '1px solid var(--border-card)' }}>
                <button 
                  className={`btn ${chartType === 'daily' ? 'btn-primary' : ''}`}
                  style={{ padding: '0.35rem 0.85rem', fontSize: '0.8rem', borderRadius: '6px', background: chartType === 'daily' ? 'var(--accent-blue)' : 'none', border: 'none', color: chartType === 'daily' ? '#fff' : 'var(--text-secondary)' }}
                  onClick={() => setChartType('daily')}
                >
                  รายวัน
                </button>
                <button 
                  className={`btn ${chartType === 'monthly' ? 'btn-primary' : ''}`}
                  style={{ padding: '0.35rem 0.85rem', fontSize: '0.8rem', borderRadius: '6px', background: chartType === 'monthly' ? 'var(--accent-blue)' : 'none', border: 'none', color: chartType === 'monthly' ? '#fff' : 'var(--text-secondary)' }}
                  onClick={() => setChartType('monthly')}
                >
                  รายเดือน
                </button>
              </div>

              {/* Range Filters */}
              {chartType === 'daily' ? (
                <select 
                  className="form-control"
                  style={{ width: '130px', padding: '0.35rem 0.75rem', fontSize: '0.8rem' }}
                  value={daysRange}
                  onChange={(e) => setDaysRange(parseInt(e.target.value))}
                >
                  <option value={7}>ย้อนหลัง 7 วัน</option>
                  <option value={15}>ย้อนหลัง 15 วัน</option>
                  <option value={30}>ย้อนหลัง 30 วัน</option>
                </select>
              ) : (
                <select 
                  className="form-control"
                  style={{ width: '110px', padding: '0.35rem 0.75rem', fontSize: '0.8rem' }}
                  value={selectedYear}
                  onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                >
                  <option value={2026}>ปี 2569 (2026)</option>
                  <option value={2025}>ปี 2568 (2025)</option>
                  <option value={2024}>ปี 2567 (2024)</option>
                </select>
              )}
            </div>
          </div>

          {/* Quick Metrics of selection */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', padding: '1rem', background: 'rgba(0,0,0,0.01)', borderRadius: '12px', border: '1px solid var(--border-card)' }}>
            <div>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>ยอดรวมค่าใช้จ่ายในช่วงนี้</span>
              <h3 style={{ fontSize: '1.25rem', fontWeight: '700', color: 'var(--accent-amber)', marginTop: '0.2rem' }}>
                {periodTotal.toLocaleString()} <span style={{ fontSize: '0.85rem', fontWeight: 'normal' }}>บาท</span>
              </h3>
            </div>
            <div>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>ค่าเฉลี่ยต่อ{chartType === 'daily' ? 'วัน' : 'เดือน'}</span>
              <h3 style={{ fontSize: '1.25rem', fontWeight: '700', color: 'var(--text-primary)', marginTop: '0.2rem' }}>
                {Math.round(periodAverage).toLocaleString()} <span style={{ fontSize: '0.85rem', fontWeight: 'normal' }}>บาท</span>
              </h3>
            </div>
            {topCat && (
              <div>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>หมวดหมู่ที่จ่ายสูงสุด</span>
                <h3 style={{ fontSize: '1.05rem', fontWeight: '700', color: 'var(--accent-green)', marginTop: '0.2rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={`${categoriesConfig[topCat]?.label || topCat} (${(periodCatCosts[topCat] || 0).toLocaleString()} ฿)`}>
                  {categoriesConfig[topCat]?.label || topCat} <span style={{ fontSize: '0.8rem', fontWeight: 'normal', color: 'var(--text-secondary)' }}>({Math.round(((periodCatCosts[topCat] || 0) / (periodTotal || 1)) * 100)}%)</span>
                </h3>
              </div>
            )}
          </div>

          {/* Chart Graphic Area (Grouped Bar Chart) */}
          <div style={{ 
            position: 'relative', 
            width: '100%', 
            minHeight: '320px', 
            padding: '2.5rem 0.5rem 2.5rem 3.5rem', 
            background: 'rgba(255,255,255,0.01)', 
            border: '1px solid var(--border-card)', 
            borderRadius: '16px',
            overflowX: 'auto'
          }}>
            
            {/* Grid Line Marks */}
            {[0, 0.25, 0.5, 0.75, 1].map((ratio, index) => {
              // Find max single category cost for scaling bar heights
              let maxCatCost = 1000;
              chartData.forEach(d => {
                Object.values(d.breakdown).forEach(cost => {
                  if (cost > maxCatCost) maxCatCost = cost;
                });
              });

              const val = Math.round(maxCatCost * ratio);
              const bottomPercent = ratio * 100;
              return (
                <React.Fragment key={index}>
                  {/* Y-Axis Label */}
                  <span style={{ 
                    position: 'absolute', 
                    left: '8px', 
                    bottom: `calc(${bottomPercent}% * 0.68 + 2.5rem)`, 
                    transform: 'translateY(50%)', 
                    fontSize: '0.7rem', 
                    color: 'var(--text-muted)', 
                    textAlign: 'right', 
                    width: '42px',
                    fontWeight: '600'
                  }}>
                    {val >= 1000 ? `${(val / 1000).toFixed(1)}k` : val}
                  </span>
                  {/* Grid line */}
                  <div style={{ 
                    position: 'absolute', 
                    left: '3.5rem', 
                    right: '0.5rem', 
                    bottom: `calc(${bottomPercent}% * 0.68 + 2.5rem)`, 
                    height: '1px', 
                    borderBottom: '1px dashed var(--border-card)', 
                    opacity: 0.6 
                  }} />
                </React.Fragment>
              );
            })}

            {/* Grouped Bars Container */}
            <div style={{ 
              display: 'flex', 
              width: '100%', 
              height: '100%', 
              alignItems: 'flex-end', 
              justify: 'space-around', 
              position: 'relative', 
              zIndex: 2,
              gap: '0.5rem'
            }}>
              {(() => {
                let maxCatCost = 1000;
                chartData.forEach(d => {
                  Object.values(d.breakdown).forEach(cost => {
                    if (cost > maxCatCost) maxCatCost = cost;
                  });
                });

                return chartData.map((d, index) => {
                  const activeCats = Object.keys(d.breakdown).filter(cat => (d.breakdown[cat] || 0) > 0);

                  return (
                    <div 
                      key={index}
                      style={{ 
                        display: 'flex', 
                        flexDirection: 'column', 
                        alignItems: 'center', 
                        flex: 1,
                        minWidth: '42px',
                        height: '80%', 
                        position: 'relative'
                      }}
                    >
                      {/* Total badge on top of group */}
                      {d.total > 0 && (
                        <span style={{
                          position: 'absolute',
                          top: '-1.8rem',
                          fontSize: '0.68rem',
                          fontWeight: '700',
                          color: 'var(--accent-amber)',
                          background: 'rgba(245, 158, 11, 0.12)',
                          padding: '1px 6px',
                          borderRadius: '4px',
                          border: '1px solid rgba(245, 158, 11, 0.25)',
                          whiteSpace: 'nowrap',
                          zIndex: 3
                        }}>
                          {d.total >= 1000 ? `${(d.total / 1000).toFixed(1)}k` : d.total.toLocaleString()} ฿
                        </span>
                      )}

                      {/* Side-by-side grouped bars for categories in this period */}
                      <div style={{
                        display: 'flex',
                        width: '100%',
                        height: '100%',
                        alignItems: 'flex-end',
                        justify: 'center',
                        gap: '4px'
                      }}>
                        {activeCats.length > 0 ? (
                          activeCats.map((cat) => {
                            const cost = d.breakdown[cat] || 0;
                            const heightPercent = maxCatCost > 0 ? Math.max(8, (cost / maxCatCost) * 100) : 0;
                            const config = categoriesConfig[cat] || categoriesConfig.others;
                            
                            return (
                              <div
                                key={cat}
                                style={{
                                  flex: 1,
                                  maxWidth: '28px',
                                  height: `${heightPercent}%`,
                                  backgroundColor: config.color,
                                  borderRadius: '6px 6px 0 0',
                                  position: 'relative',
                                  cursor: 'pointer',
                                  transition: 'transform 0.15s ease, opacity 0.15s ease',
                                  boxShadow: '0 2px 6px rgba(0,0,0,0.15)'
                                }}
                                className="grouped-bar-item"
                                onMouseEnter={(e) => {
                                  const rect = e.target.getBoundingClientRect();
                                  setTooltip({
                                    visible: true,
                                    x: rect.left + window.scrollX + rect.width / 2,
                                    y: rect.top + window.scrollY - 8,
                                    date: chartType === 'daily' ? formatDailyLabel(d.label) : formatMonthlyLabel(d.label),
                                    category: config.label,
                                    cost: cost
                                  });
                                }}
                                onMouseLeave={() => setTooltip(prev => ({ ...prev, visible: false }))}
                              >
                                {/* Numerical label on top of each bar */}
                                <div style={{
                                  position: 'absolute',
                                  top: '-1.4rem',
                                  left: '50%',
                                  transform: 'translateX(-50%)',
                                  fontSize: '0.62rem',
                                  fontWeight: '700',
                                  color: 'var(--text-primary)',
                                  whiteSpace: 'nowrap',
                                  pointerEvents: 'none'
                                }}>
                                  {cost >= 1000 ? `${(cost / 1000).toFixed(1)}k` : cost.toLocaleString()}
                                </div>
                              </div>
                            );
                          })
                        ) : (
                          // Empty placeholder
                          <div style={{
                            width: '16px',
                            height: '4px',
                            backgroundColor: 'rgba(255,255,255,0.06)',
                            borderRadius: '2px',
                            position: 'relative'
                          }}>
                            <span style={{
                              position: 'absolute',
                              top: '-1.2rem',
                              left: '50%',
                              transform: 'translateX(-50%)',
                              fontSize: '0.6rem',
                              color: 'var(--text-muted)'
                            }}>
                              0
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Date/Period label under group */}
                      <span style={{ position: 'absolute', bottom: '-2rem', fontSize: '0.68rem', color: 'var(--text-muted)', whiteSpace: 'nowrap', textAlign: 'center', fontWeight: '500' }}>
                        {chartType === 'daily' ? formatDailyLabel(d.label) : formatMonthlyLabel(d.label).split(' ')[0]}
                      </span>
                    </div>
                  );
                });
              })()}
            </div>
          </div>

          {/* Chart Tooltip Render */}
          {tooltip.visible && (
            <div 
              style={{
                position: 'absolute',
                left: `${tooltip.x}px`,
                top: `${tooltip.y}px`,
                transform: 'translate(-50%, -100%)',
                backgroundColor: 'rgba(15, 23, 42, 0.96)',
                color: '#fff',
                padding: '0.55rem 0.85rem',
                borderRadius: '8px',
                fontSize: '0.75rem',
                boxShadow: '0 4px 16px rgba(0,0,0,0.25)',
                pointerEvents: 'none',
                zIndex: 9999,
                border: '1px solid rgba(255,255,255,0.12)',
                lineHeight: '1.4'
              }}
            >
              <div style={{ fontWeight: '700', borderBottom: '1px solid rgba(255,255,255,0.15)', paddingBottom: '3px', marginBottom: '5px', color: '#e2e8f0' }}>
                {tooltip.date}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '2px' }}>
                <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: Object.values(categoriesConfig).find(c => c.label === tooltip.category)?.color || '#9ca3af' }} />
                <span>หมวดหมู่: <strong>{tooltip.category}</strong></span>
              </div>
              <div>ยอดรับเข้า: <strong style={{ color: 'var(--accent-amber)', fontSize: '0.85rem' }}>{(tooltip.cost || 0).toLocaleString()} บาท</strong></div>
            </div>
          )}

          {/* Legend section */}
          {categoriesInUse.length > 0 && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem 1rem', padding: '0.5rem 0', borderTop: '1px solid var(--border-card)', fontSize: '0.75rem' }}>
              {categoriesInUse.map(cat => {
                const config = categoriesConfig[cat] || categoriesConfig.others;
                return (
                  <div key={cat} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <span style={{ width: '10px', height: '10px', borderRadius: '3px', backgroundColor: config.color }} />
                    <span style={{ color: 'var(--text-secondary)' }}>{config.label}</span>
                    <strong style={{ color: 'var(--text-primary)' }}>({(periodCatCosts[cat] || 0).toLocaleString()} ฿)</strong>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* NEW: Interactive Donut Chart & Category Breakdown Card (Matching User Request Screenshot) */}
      {(role === 'admin' || role === 'manager') && (
        <div className="card card-accent-green" style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {/* Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <div style={{ fontSize: '1.5rem', lineHeight: 1 }}>🍕</div>
              <div>
                <h2 style={{ fontSize: '1.2rem', fontWeight: '700', color: 'var(--text-primary)' }}>
                  สัดส่วนวัตถุดิบและรายจ่ายของร้าน <span style={{ fontSize: '0.85rem', fontWeight: 'normal', color: 'var(--text-muted)' }}>(คลิกที่สีเพื่อเจาะดู)</span>
                </h2>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>คลิกที่วงกลมหรือชื่อหมวดหมู่ด้านขวาเพื่อเปิดดูรายการสินค้าที่สั่งซื้อโดยละเอียด</p>
              </div>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '2rem', alignItems: 'center' }}>
            {/* Left Side: Interactive SVG Donut Chart */}
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', position: 'relative', minHeight: '260px' }}>
              <svg width="240" height="240" viewBox="0 0 240 240">
                <g transform="rotate(-90 120 120)">
                  {(() => {
                    const radius = 75;
                    const strokeWidth = 34;
                    const circumference = 2 * Math.PI * radius;
                    let accumulatedPercent = 0;

                    const activeCatKeys = Object.keys(periodCatCosts).filter(cat => periodCatCosts[cat] > 0);
                    if (activeCatKeys.length === 0 || periodTotal === 0) {
                      return (
                        <circle 
                          cx="120" 
                          cy="120" 
                          r={radius} 
                          fill="transparent" 
                          stroke="var(--border-card)" 
                          strokeWidth={strokeWidth} 
                        />
                      );
                    }

                    return activeCatKeys.map((catKey) => {
                      const cost = periodCatCosts[catKey];
                      const percent = cost / periodTotal;
                      const dashArray = `${percent * circumference} ${circumference}`;
                      const dashOffset = -accumulatedPercent * circumference;
                      accumulatedPercent += percent;

                      const config = categoriesConfig[catKey] || categoriesConfig.others;
                      const isHovered = hoveredCategoryKey === catKey;

                      return (
                        <circle
                          key={catKey}
                          cx="120"
                          cy="120"
                          r={radius}
                          fill="transparent"
                          stroke={config.color}
                          strokeWidth={isHovered ? strokeWidth + 6 : strokeWidth}
                          strokeDasharray={dashArray}
                          strokeDashoffset={dashOffset}
                          style={{
                            cursor: 'pointer',
                            transition: 'all 0.2s ease',
                            opacity: hoveredCategoryKey && !isHovered ? 0.45 : 1,
                            filter: isHovered ? 'drop-shadow(0 0 6px rgba(0,0,0,0.3))' : 'none'
                          }}
                          onMouseEnter={() => setHoveredCategoryKey(catKey)}
                          onMouseLeave={() => setHoveredCategoryKey(null)}
                          onClick={() => {
                            setSelectedCategoryModal(catKey);
                            setModalSearchText('');
                          }}
                        >
                          <title>{`${config.label}: ฿${cost.toLocaleString()} (${(percent * 100).toFixed(1)}%) - คลิกเพื่อเจาะดู`}</title>
                        </circle>
                      );
                    });
                  })()}
                </g>
              </svg>

              {/* Center Label inside Donut Ring */}
              <div style={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                textAlign: 'center',
                pointerEvents: 'none'
              }}>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: '600' }}>
                  {hoveredCategoryKey ? (categoriesConfig[hoveredCategoryKey]?.label || hoveredCategoryKey) : 'รายจ่ายรวม'}
                </div>
                <div style={{ fontSize: '1.35rem', fontWeight: '800', color: 'var(--text-primary)', margin: '2px 0' }}>
                  ฿{(hoveredCategoryKey ? periodCatCosts[hoveredCategoryKey] : periodTotal).toLocaleString()}
                </div>
                <div style={{ fontSize: '0.85rem', fontWeight: '700', color: 'var(--accent-amber)' }}>
                  {hoveredCategoryKey 
                    ? `${((periodCatCosts[hoveredCategoryKey] / (periodTotal || 1)) * 100).toFixed(1)}%`
                    : '100%'}
                </div>
              </div>
            </div>

            {/* Right Side: Category Legend List */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem', maxHeight: '280px', overflowY: 'auto', paddingRight: '0.5rem' }}>
              {Object.keys(periodCatCosts)
                .filter(cat => periodCatCosts[cat] > 0)
                .sort((a, b) => periodCatCosts[b] - periodCatCosts[a])
                .map(catKey => {
                  const cost = periodCatCosts[catKey];
                  const percent = (cost / (periodTotal || 1)) * 100;
                  const config = categoriesConfig[catKey] || categoriesConfig.others;
                  const isHovered = hoveredCategoryKey === catKey;

                  return (
                    <div 
                      key={catKey} 
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '0.45rem 0.75rem',
                        borderRadius: '8px',
                        backgroundColor: isHovered ? 'rgba(0,0,0,0.06)' : 'transparent',
                        border: '1px solid',
                        borderColor: isHovered ? config.color : 'transparent',
                        cursor: 'pointer',
                        transition: 'all 0.15s ease'
                      }}
                      onMouseEnter={() => setHoveredCategoryKey(catKey)}
                      onMouseLeave={() => setHoveredCategoryKey(null)}
                      onClick={() => {
                        setSelectedCategoryModal(catKey);
                        setModalSearchText('');
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                        <span style={{ 
                          width: '12px', 
                          height: '12px', 
                          borderRadius: '50%', 
                          backgroundColor: config.color,
                          boxShadow: `0 0 6px ${config.color}66`
                        }} />
                        <span style={{ fontSize: '0.85rem', fontWeight: '600', color: 'var(--text-primary)' }}>
                          {config.label}
                        </span>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <span style={{ fontSize: '0.85rem', fontWeight: '700', color: 'var(--text-primary)' }}>
                          ฿{cost.toLocaleString()}
                        </span>
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                          ({percent.toFixed(1)}%)
                        </span>
                      </div>
                    </div>
                  );
                })}
            </div>
          </div>
        </div>
      )}

      {/* NEW: DRILL DOWN CATEGORY DETAIL MODAL */}
      {selectedCategoryModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.65)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999,
          padding: '1rem'
        }}
        onClick={() => setSelectedCategoryModal(null)}
        >
          <div style={{
            backgroundColor: 'var(--bg-card, #1e293b)',
            color: 'var(--text-primary, #f8fafc)',
            borderRadius: '16px',
            width: '100%',
            maxWidth: '850px',
            maxHeight: '85vh',
            display: 'flex',
            flexDirection: 'column',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.5), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
            border: '1px solid var(--border-card, rgba(255,255,255,0.1))',
            overflow: 'hidden'
          }}
          onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div style={{
              padding: '1.25rem 1.5rem',
              borderBottom: '1px solid var(--border-card, rgba(255,255,255,0.1))',
              display: 'flex',
              justify: 'space-between',
              alignItems: 'center',
              background: 'rgba(0,0,0,0.15)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <span style={{
                  width: '16px',
                  height: '16px',
                  borderRadius: '50%',
                  backgroundColor: categoriesConfig[selectedCategoryModal]?.color || '#10b981'
                }} />
                <div>
                  <h3 style={{ fontSize: '1.15rem', fontWeight: '700', margin: 0 }}>
                    รายละเอียดรายการ: {categoriesConfig[selectedCategoryModal]?.label || selectedCategoryModal}
                  </h3>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    ยอดรวมหมวดหมู่นี้: <strong>฿{(periodCatCosts[selectedCategoryModal] || 0).toLocaleString()}</strong>
                  </span>
                </div>
              </div>

              <button 
                onClick={() => setSelectedCategoryModal(null)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--text-muted)',
                  cursor: 'pointer',
                  padding: '4px',
                  borderRadius: '6px',
                  display: 'flex',
                  alignItems: 'center'
                }}
              >
                <X size={20} />
              </button>
            </div>

            {/* Search Filter inside Modal */}
            <div style={{ padding: '0.75rem 1.5rem', borderBottom: '1px solid var(--border-card)' }}>
              <input 
                type="text" 
                className="form-control" 
                placeholder="🔍 พิมพ์ค้นหาชื่อวัตถุดิบ/สินค้า..." 
                value={modalSearchText}
                onChange={(e) => setModalSearchText(e.target.value)}
                style={{ width: '100%', fontSize: '0.85rem', padding: '0.45rem 0.85rem' }}
              />
            </div>

            {/* Modal Table Content */}
            <div style={{ padding: '1rem 1.5rem', overflowY: 'auto', flex: 1 }}>
              {(() => {
                const categoryItems = inventory.filter(item => {
                  const cat = normalizeCategory(item);
                  if (cat !== selectedCategoryModal) return false;
                  if (modalSearchText.trim()) {
                    return (item.name || '').toLowerCase().includes(modalSearchText.trim().toLowerCase());
                  }
                  return true;
                });

                if (categoryItems.length === 0) {
                  return (
                    <div style={{ textAlign: 'center', padding: '3rem 1rem', color: 'var(--text-muted)' }}>
                      ไม่พบรายการสั่งซื้อ/รับเข้าในหมวดหมู่นี้
                    </div>
                  );
                }

                return (
                  <table className="table" style={{ width: '100%', fontSize: '0.85rem' }}>
                    <thead>
                      <tr>
                        <th>วันที่สั่งซื้อ</th>
                        <th>ชื่อรายการ / วัตถุดิบ</th>
                        <th>จำนวน</th>
                        <th>ยอดเงิน (บาท)</th>
                        <th>ผู้รับเข้า</th>
                        <th>หลักฐานบิล</th>
                      </tr>
                    </thead>
                    <tbody>
                      {categoryItems.map((item, idx) => (
                        <tr key={item.id || idx}>
                          <td>{item.date ? new Date(item.date).toLocaleDateString('th-TH') : '-'}</td>
                          <td style={{ fontWeight: '600', color: 'var(--text-primary)' }}>{item.name}</td>
                          <td>{item.quantity ? `${item.quantity} ${item.unit || ''}` : '-'}</td>
                          <td style={{ fontWeight: '700', color: 'var(--accent-amber)' }}>
                            {(item.cost || 0).toLocaleString()} ฿
                          </td>
                          <td>{item.staff || 'พนักงาน'}</td>
                          <td>
                            {item.imageUrl || item.image ? (
                              <a 
                                href={item.imageUrl || item.image} 
                                target="_blank" 
                                rel="noreferrer"
                                style={{ color: 'var(--accent-blue)', textDecoration: 'underline', fontSize: '0.75rem' }}
                              >
                                🖼️ เปิดดูบิล
                              </a>
                            ) : (
                              <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>-</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                );
              })()}
            </div>
          </div>
        </div>
      )}

      {/* Inventory & POS Reconciliation Section (50/50 split or full-width) */}
      <div className={(role === 'admin' || role === 'manager') ? "dashboard-grid" : ""}>
        {/* Recent Purchases / Inbound Orders */}
        <div className="card card-accent-amber" style={role === 'staff' ? { width: '100%' } : {}}>
          <div className="card-title-row">
            <h2>ประวัติจัดซื้อวัตถุดิบล่าสุด (ในเครื่อง)</h2>
            <button className="btn btn-secondary" onClick={() => setView('inventory')}>
              {(role === 'admin' || role === 'manager') ? 'จัดการคลัง' : 'บันทึกวัตถุดิบ'}
            </button>
          </div>

          <div className="list-container" style={{ maxHeight: '280px' }}>
            {inventory.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
                ยังไม่มีข้อมูลการรับเข้าวัตถุดิบในคลัง
              </div>
            ) : (
              inventory.slice(0, 5).map(item => (
                <div 
                  className="list-item" 
                  key={item.id} 
                  style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', cursor: 'pointer' }}
                  onClick={() => {
                    setInventoryFilterName(item.name);
                    setView('inventory');
                  }}
                  title={`คลิกเพื่อกรองเฉพาะวัตถุดิบ ${item.name}`}
                >
                  {item.image ? (
                    <div style={{ width: '40px', height: '40px', borderRadius: '6px', overflow: 'hidden', border: '1px solid var(--border-card)', flexShrink: 0 }}>
                      <img src={item.image} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt="" />
                    </div>
                  ) : (
                    <div style={{ width: '40px', height: '40px', borderRadius: '6px', background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border-card)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', flexShrink: 0 }}>
                      <Package size={16} />
                    </div>
                  )}
                  <div className="item-info" style={{ flexGrow: 1 }}>
                    <span className="item-title">{item.name}</span>
                    <span className="item-subtitle">
                      จำนวน: <strong>{item.quantity || 0} {item.unit || ''}</strong> {item.pieces ? <span>({item.pieces} ชิ้น)</span> : ''} | ยอดเงิน: <strong>{(item.cost || 0).toLocaleString()} บาท</strong>
                    </span>
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    {new Date(item.date).toLocaleDateString('th-TH', { day: 'numeric', month: 'short' })}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* POS Sales Reconciliation Summary */}
        {(role === 'admin' || role === 'manager') && (
          <div className="card card-accent-green">
            <div className="card-title-row">
              <h2>สรุปการกระทบยอดขายจริง vs คลังวัตถุดิบ</h2>
              <button className="btn btn-secondary btn-icon-only" onClick={() => setView('inventory')} title="ดูรายงานโดยละเอียด">
                <TrendingUp size={16} />
              </button>
            </div>

            {reconciliation.length > 0 && (
              <div 
                style={{ marginBottom: '1.25rem', padding: '1rem', background: 'rgba(0,0,0,0.015)', borderRadius: '12px', border: '1px solid var(--border-card)', cursor: 'pointer' }}
                onClick={() => setView('inventory')}
                title="คลิกเพื่อดูรายละเอียดการกระทบยอดวัตถุดิบและยอดขาย"
              >
                <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '0.75rem', fontWeight: '500' }}>แผนภูมิวิเคราะห์ส่วนต่างจานเสิร์ฟต่อวัตถุดิบหลัก:</p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  {reconciliation.slice(0, 3).map((row, idx) => {
                    const maxVal = Math.max(row.potentialServings, row.actualSold, 1);
                    const potWidth = (row.potentialServings / maxVal) * 100;
                    const actWidth = (row.actualSold / maxVal) * 100;
                    
                    return (
                      <div 
                        key={idx} 
                        style={{ 
                          fontSize: '0.75rem', 
                          cursor: 'pointer', 
                          padding: '4px 8px', 
                          borderRadius: '6px', 
                          transition: 'background-color 0.2s',
                        }}
                        className="dashboard-recon-row-interactive"
                        onClick={(e) => {
                          e.stopPropagation();
                          setInventoryFilterName(row.name);
                          setView('inventory');
                        }}
                        title={`คลิกเพื่อกรองเฉพาะวัตถุดิบ ${row.name}`}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem', fontWeight: '500' }}>
                          <span>{row.name} (POS: {row.posItemMatched})</span>
                          {row.discrepancy > 0 && (
                            <span style={{ color: 'var(--accent-danger)' }}>ของเสีย/ต่าง: {row.discrepancy} จาน ({row.discrepancyPercentage}%)</span>
                          )}
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '3px', paddingLeft: '0.5rem', borderLeft: '2px solid rgba(188, 170, 144, 0.2)' }}>
                          {/* Potential bar */}
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <span style={{ width: '45px', color: 'var(--text-muted)', fontSize: '0.7rem' }}>รับเข้า:</span>
                            <div style={{ flexGrow: 1, height: '8px', background: 'rgba(0,0,0,0.04)', borderRadius: '4px', overflow: 'hidden' }}>
                              <div style={{ width: `${potWidth}%`, height: '100%', background: 'linear-gradient(90deg, #0ea5e9, #3b82f6)', borderRadius: '4px' }} />
                            </div>
                            <span style={{ width: '45px', textAlign: 'right', fontWeight: 'bold' }}>{row.potentialServings}</span>
                          </div>
                          {/* Actual bar */}
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <span style={{ width: '45px', color: 'var(--text-muted)', fontSize: '0.7rem' }}>ขายจริง:</span>
                            <div style={{ flexGrow: 1, height: '8px', background: 'rgba(0,0,0,0.04)', borderRadius: '4px', overflow: 'hidden' }}>
                              <div style={{ width: `${actWidth}%`, height: '100%', background: 'linear-gradient(90deg, #10b981, #059669)', borderRadius: '4px' }} />
                            </div>
                            <span style={{ width: '45px', textAlign: 'right', fontWeight: 'bold' }}>{row.actualSold}</span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            <div className="list-container" style={{ maxHeight: '280px' }}>
              {reconciliation.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
                  ไม่มีข้อมูลการกระทบยอดในขณะนี้
                </div>
              ) : (
                reconciliation.slice(0, 5).map((row, idx) => {
                  const isLoss = row.discrepancy > 0;
                  const badgeColor = isLoss ? 'var(--accent-danger)' : 'var(--accent-green)';
                  return (
                    <div 
                      className="list-item" 
                      key={idx} 
                      style={{ flexDirection: 'column', gap: '0.5rem', alignItems: 'stretch', cursor: 'pointer' }}
                      onClick={() => {
                        setInventoryFilterName(row.name);
                        setView('inventory');
                      }}
                      title={`คลิกเพื่อกรองเฉพาะวัตถุดิบ ${row.name}`}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span className="item-title" style={{ fontWeight: '600' }}>{row.name}</span>
                        <span className="item-subtitle" style={{ fontSize: '0.8rem', color: badgeColor }}>
                          {isLoss ? `ของเสีย/ขาด: ${row.discrepancy} เสิร์ฟ` : 'ปริมาณตรงกันครบถ้วน'}
                        </span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                        <span>เสิร์ฟที่ซื้อ: <strong>{row.potentialServings}</strong></span>
                        <span>ขายได้จริง (POS): <strong>{row.actualSold}</strong></span>
                      </div>
                      <div style={{ width: '100%', height: '4px', background: 'rgba(0,0,0,0.04)', borderRadius: '2px', overflow: 'hidden', marginTop: '2px' }}>
                        <div style={{ 
                          width: `${Math.min(100, Math.max(0, 100 - row.discrepancyPercentage))}%`, 
                          height: '100%', 
                          background: row.discrepancyPercentage > 10 ? 'var(--accent-danger)' : 'var(--accent-green)' 
                        }} />
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}
      </div>

      {/* Active Schedules & Live Notification Logs Section */}
      <div className="dashboard-grid">
        {/* Active Schedules Quick Control */}
        <div className="card card-accent-blue">
          <div className="card-title-row">
            <h2>ตารางแจ้งเตือนความคืบหน้า</h2>
            {(role === 'admin' || role === 'manager') && (
              <button className="btn btn-secondary btn-icon-only" onClick={() => setView('scheduler')} title="แก้ไขตารางเวลา">
                <CalendarDays size={18} />
              </button>
            )}
          </div>

          <div className="list-container" style={{ maxHeight: '380px' }}>
            {schedules.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
                ไม่มีตารางเวลาในขณะนี้
              </div>
            ) : (
              schedules.map(schedule => (
                <div className="list-item" key={schedule.id}>
                  <div className="item-info">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <span className={`status-dot`} style={{ 
                        backgroundColor: schedule.active ? 'var(--accent-green)' : 'var(--text-muted)',
                        boxShadow: schedule.active ? '0 0 6px var(--accent-green)' : 'none',
                        animation: schedule.active ? 'pulse 2.5s infinite' : 'none'
                      }}></span>
                      <span className="item-title">{schedule.name}</span>
                    </div>
                    <span className="item-subtitle">
                      SOP: {schedule.sopTitle} | Cron: <code style={{color: 'var(--accent-blue)'}}>{schedule.cronExpression}</code>
                    </span>
                    <span className="item-subtitle" style={{ fontSize: '0.75rem' }}>
                      รันล่าสุดเมื่อ: {formatDate(schedule.lastRun)}
                    </span>
                  </div>

                  {(role === 'admin' || role === 'manager') && (
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <button 
                        className="btn btn-secondary btn-icon-only" 
                        onClick={() => onTriggerSchedule(schedule.id)}
                        title="กดทดสอบส่งเดี๋ยวนี้ (Trigger Test)"
                      >
                        <Play size={14} style={{ color: 'var(--accent-green)' }} />
                      </button>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>

        {/* Live Notification Activity Stream */}
        <div className="card card-accent-purple">
          <div className="card-title-row">
            <h2>ประวัติการยิงการเตือนล่าสุด</h2>
            {role === 'admin' && (
              <button className="btn btn-secondary" onClick={() => setView('logs')}>
                ดูทั้งหมด
              </button>
            )}
          </div>

          <div className="list-container" style={{ maxHeight: '380px' }}>
            {logs.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
                ยังไม่มีการส่งแจ้งเตือนในระบบ
              </div>
            ) : (
              logs.slice(0, 5).map(log => (
                <div className="list-item" key={log.id}>
                  <div className="item-info">
                    <span className="item-title">{log.scheduleName}</span>
                    <span className="item-subtitle">SOP: {log.sopTitle}</span>
                    <span className="item-subtitle" style={{fontSize: '0.75rem'}}>
                      {new Date(log.timestamp).toLocaleString('th-TH')}
                    </span>
                  </div>
                  <div>
                    <span className={`badge badge-${log.status}`}>
                      {log.status === 'simulated' ? 'จำลอง' : log.status === 'success' ? 'สำเร็จ' : 'ล้มเหลว'}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
