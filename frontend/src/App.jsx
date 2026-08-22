import React, { useState, useEffect } from 'react';
import { 
  LayoutDashboard, 
  BookOpen, 
  CalendarClock, 
  Link2, 
  Terminal as TerminalIcon, 
  Sun, 
  Moon, 
  Wifi, 
  WifiOff,
  ClipboardList,
  Users,
  LogOut,
  Menu,
  X,
  ShoppingBag
} from 'lucide-react';
import Dashboard from './components/Dashboard.jsx';
import SopManager from './components/SopManager.jsx';
import Scheduler from './components/Scheduler.jsx';
import Integrations from './components/Integrations.jsx';
import LogConsole from './components/LogConsole.jsx';
import InventoryManager from './components/InventoryManager.jsx';
import Login from './components/Login.jsx';
import StaffManagement from './components/StaffManagement.jsx';
import PosManager from './components/PosManager.jsx';

export default function App() {
  const [view, setView] = useState('dashboard');
  const [theme, setTheme] = useState('light');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState(() => {
    const saved = localStorage.getItem('currentUser');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        return null;
      }
    }
    return null;
  });
  const [inventoryFilterName, setInventoryFilterName] = useState(''); // filter by material name
  const [sops, setSops] = useState([]);
  const [schedules, setSchedules] = useState([]);
  const [logs, setLogs] = useState([]);
  const [inventory, setInventory] = useState([]);
  const [reconciliation, setReconciliation] = useState([]);
  const [settings, setSettings] = useState({
    simulationMode: true,
    lineNotifyToken: '',
    lineChannelAccessToken: '',
    lineUserId: '',
    lineChannelSecret: '',
    googleSheetWebhookUrl: '',
    driveFolderId: '',
    messengerPageAccessToken: '',
    messengerRecipientId: '',
    supabaseDbUrl: '',
    supabaseApiKey: ''
  });
  
  const [loading, setLoading] = useState(true);
  const [connected, setConnected] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());

  const role = currentUser ? currentUser.role : null;

  const handleLoginSuccess = (user) => {
    setCurrentUser(user);
    localStorage.setItem('currentUser', JSON.stringify(user));
    if (user.role === 'staff') {
      setView('pos');
    } else {
      setView('dashboard');
    }
  };

  const handleLogout = () => {
    setCurrentUser(null);
    localStorage.removeItem('currentUser');
    setView('dashboard');
  };

  // Redirect staff to allowed views (pos or inventory)
  useEffect(() => {
    if (role === 'staff' && view !== 'inventory' && view !== 'pos') {
      setView('pos');
    }
  }, [role, view]);

  // Update current clock
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Fetch initial data
  const fetchData = async () => {
    try {
      setLoading(true);
      const [sopsRes, schedulesRes, settingsRes, logsRes, invRes, reconRes] = await Promise.all([
        fetch('/api/sops'),
        fetch('/api/schedules'),
        fetch('/api/settings'),
        fetch('/api/logs'),
        fetch('/api/inventory'),
        fetch('/api/reconciliation')
      ]);

      const sopsData = await sopsRes.json();
      const schedulesData = await schedulesRes.json();
      const settingsData = await settingsRes.json();
      const logsData = await logsRes.json();
      const invData = await invRes.json();
      const reconData = await reconRes.json();

      setSops(sopsData);
      setSchedules(schedulesData);
      setSettings(settingsData);
      setLogs(logsData);
      setInventory(invData);
      setReconciliation(reconData.reconciliation || []);
      setConnected(true);
    } catch (error) {
      console.error('Failed to fetch data from backend server:', error);
      setConnected(false);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [view]);

  // Set up Server-Sent Events (SSE) for live notification updates
  useEffect(() => {
    const eventSource = new EventSource('/api/events');

    eventSource.onopen = () => {
      console.log('[SSE] Connection opened');
      setConnected(true);
    };

    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        console.log('[SSE] Event received:', data);

        if (data.type === 'NOTIFICATION_TRIGGERED') {
          // Add new log to the top of logs list
          setLogs(prevLogs => [data.log, ...prevLogs]);

          // Update the specific schedule's lastRun field in state
          setSchedules(prevSchedules => 
            prevSchedules.map(s => 
              s.id === data.schedule.id 
                ? { ...s, lastRun: data.schedule.lastRun } 
                : s
            )
          );
        }
      } catch (err) {
        console.error('[SSE] Failed to parse event data:', err);
      }
    };

    eventSource.onerror = (err) => {
      console.error('[SSE] EventSource failed:', err);
      setConnected(false);
      eventSource.close();
    };

    return () => {
      eventSource.close();
    };
  }, []);

  // Toggle Theme (Dark / Light)
  const toggleTheme = () => {
    const nextTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(nextTheme);
    if (nextTheme === 'light') {
      document.documentElement.removeAttribute('data-theme');
    } else {
      document.documentElement.setAttribute('data-theme', 'dark');
    }
  };

  // --- API HANDLERS ---

  // 1. SOP CRUD
  const handleSaveSop = async (sopData, silent = false) => {
    try {
      const isEdit = !!sopData.id;
      const url = isEdit ? `/api/sops/${sopData.id}` : '/api/sops';
      const method = isEdit ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(sopData)
      });
      
      if (!response.ok) throw new Error('API request failed');
      
      const savedSop = await response.json();
      
      // Refetch both sops and schedules because editing a SOP name updates cache in schedules
      const [sopsRes, schedulesRes] = await Promise.all([
        fetch('/api/sops'),
        fetch('/api/schedules')
      ]);
      setSops(await sopsRes.json());
      setSchedules(await schedulesRes.json());

      if (!silent) {
        alert(isEdit ? 'แก้ไขข้อมูล SOP สำเร็จ!' : 'สร้างคู่มือ SOP สำเร็จ!');
      }
    } catch (err) {
      console.error('Error saving SOP:', err);
      alert('เกิดข้อผิดพลาดในการบันทึก SOP');
    }
  };

  const handleDeleteSop = async (id) => {
    try {
      const response = await fetch(`/api/sops/${id}`, { method: 'DELETE' });
      if (!response.ok) throw new Error('Delete failed');
      
      // Refetch
      const [sopsRes, schedulesRes] = await Promise.all([
        fetch('/api/sops'),
        fetch('/api/schedules')
      ]);
      setSops(await sopsRes.json());
      setSchedules(await schedulesRes.json());
    } catch (err) {
      console.error('Error deleting SOP:', err);
      alert('เกิดข้อผิดพลาดในการลบ SOP');
    }
  };

  // 2. Schedules CRUD
  const handleSaveSchedule = async (scheduleData) => {
    try {
      const isEdit = !!scheduleData.id;
      const url = isEdit ? `/api/schedules/${scheduleData.id}` : '/api/schedules';
      const method = isEdit ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(scheduleData)
      });
      
      if (!response.ok) throw new Error('API request failed');
      
      // Refetch schedules
      const schedulesRes = await fetch('/api/schedules');
      setSchedules(await schedulesRes.json());
      
      alert(isEdit ? 'บันทึกการแก้ไขตารางเวลาสำเร็จ!' : 'สร้างกำหนดการแจ้งเตือนสำเร็จ!');
    } catch (err) {
      console.error('Error saving schedule:', err);
      alert('เกิดข้อผิดพลาดในการบันทึกตารางเวลา');
    }
  };

  const handleDeleteSchedule = async (id) => {
    try {
      const response = await fetch(`/api/schedules/${id}`, { method: 'DELETE' });
      if (!response.ok) throw new Error('Delete failed');
      
      // Refetch
      const schedulesRes = await fetch('/api/schedules');
      setSchedules(await schedulesRes.json());
    } catch (err) {
      console.error('Error deleting schedule:', err);
      alert('เกิดข้อผิดพลาดในการลบตารางเวลา');
    }
  };

  const handleToggleActive = async (id, active) => {
    try {
      const response = await fetch(`/api/schedules/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ active })
      });
      if (!response.ok) throw new Error('Update failed');
      
      // Refetch
      const schedulesRes = await fetch('/api/schedules');
      setSchedules(await schedulesRes.json());
    } catch (err) {
      console.error('Error toggling schedule activity:', err);
    }
  };

  const handleTriggerSchedule = async (id) => {
    try {
      const response = await fetch(`/api/schedules/${id}/trigger`, { method: 'POST' });
      if (!response.ok) throw new Error('Manual trigger failed');
      
      // Notify details are automatically pushed via SSE, but let's fetch logs just in case
      const logsRes = await fetch('/api/logs');
      setLogs(await logsRes.json());
      
      alert('ระบบสั่งส่งข้อความทดสอบเดี๋ยวนี้เรียบร้อยแล้ว! สามารถดูความคืบหน้าที่หน้าล็อก');
    } catch (err) {
      console.error('Error triggering schedule:', err);
      alert('เกิดข้อผิดพลาดในการยิงแจ้งเตือนทดสอบ');
    }
  };

  // 3. Settings Update
  const handleSaveSettings = async (newSettings, silent = false) => {
    try {
      const response = await fetch('/api/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newSettings)
      });
      if (!response.ok) throw new Error('Settings update failed');
      
      const updated = await response.json();
      setSettings(updated);
    } catch (err) {
      console.error('Error saving settings:', err);
      if (!silent) alert('เกิดข้อผิดพลาดในการบันทึกค่าการเชื่อมต่อ');
    }
  };

  // 4. Logs Clear
  const handleClearLogs = async () => {
    try {
      const response = await fetch('/api/logs', { method: 'DELETE' });
      if (!response.ok) throw new Error('Clear failed');
      setLogs([]);
    } catch (err) {
      console.error('Error clearing logs:', err);
      alert('เกิดข้อผิดพลาดในการล้างประวัติ');
    }
  };

  const getThaiMonthName = (monthIdx) => {
    const months = ['ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.', 'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'];
    return months[monthIdx];
  };

  const formattedTime = currentTime.toLocaleTimeString('th-TH');
  const formattedDate = `${currentTime.getDate()} ${getThaiMonthName(currentTime.getMonth())} ${currentTime.getFullYear() + 543}`;

  if (!currentUser) {
    return <Login onLoginSuccess={handleLoginSuccess} />;
  }

  // --- STANDALONE POS APPLICATION MODE ---
  if (view === 'pos') {
    return (
      <div className="min-h-screen bg-slate-100 p-4 md:p-6 font-sans">
        {/* Dedicated Standalone Top Bar */}
        <div className="max-w-7xl mx-auto mb-5 flex items-center justify-between bg-white px-6 py-3.5 rounded-2xl shadow-sm border border-slate-100">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-indigo-600 rounded-xl text-white shadow-md shadow-indigo-100">
              <ShoppingBag className="w-6 h-6" />
            </div>
            <div>
              <h1 className="font-bold text-slate-800 text-base">ระบบหน้าร้านขายอาหาร POS (Standalone Cashier Terminal)</h1>
              <p className="text-xs text-slate-500">ระบบแคชเชียร์ขายหน้าร้าน เปิดโต๊ะ สั่งอาหาร คำนวณบิล และตัดสต็อก</p>
            </div>
          </div>

          <div className="flex items-center gap-3 text-xs">
            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              <span className="text-slate-600 font-medium">แคชเชียร์: <strong>{currentUser.name}</strong></span>
            </div>

            {(role === 'admin' || role === 'manager') && (
              <button
                onClick={() => setView('dashboard')}
                className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl transition-all flex items-center gap-1.5"
              >
                ⚙️ ระบบหลังร้าน & SOP
              </button>
            )}

            <button
              onClick={handleLogout}
              className="px-3.5 py-2 bg-rose-50 hover:bg-rose-100 text-rose-600 font-semibold rounded-xl transition-all"
            >
              ออกจากระบบ
            </button>
          </div>
        </div>

        {/* Dedicated POS Main Content */}
        <div className="max-w-7xl mx-auto">
          <PosManager inventory={inventory} onRefreshInventory={fetchData} />
        </div>
      </div>
    );
  }

  return (
    <div className="app-container">
      {/* Mobile Top Navbar */}
      <div className="mobile-navbar">
        <button className="menu-toggle-btn-mobile" onClick={() => setIsMobileMenuOpen(true)}>
          <Menu size={24} />
        </button>
        <div className="mobile-logo">
          <CalendarClock size={22} className="logo-icon" />
          <span className="logo-text">SOP NOTIFIER</span>
        </div>
        <div style={{ width: 40 }}></div>
      </div>

      {/* Sidebar Navigation */}
      <aside className={`sidebar ${isMobileMenuOpen ? 'mobile-open' : ''}`}>
        <div className="logo-container">
          <CalendarClock size={28} className="logo-icon" />
          <span className="logo-text">SOP NOTIFIER</span>
          <button className="mobile-close-btn" onClick={() => setIsMobileMenuOpen(false)}>
            <X size={20} />
          </button>
        </div>

        {/* User Profile Card */}
        {currentUser && (
          <div className="role-switcher-card" style={{ background: 'rgba(255, 255, 255, 0.04)', border: '1px solid rgba(255, 255, 255, 0.08)', padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-sidebar)', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px' }}>ผู้ใช้งาน:</div>
            <div style={{ fontWeight: '700', color: '#ffffff', fontSize: '0.95rem', marginTop: '0.15rem' }}>{currentUser.name}</div>
            <div style={{ fontSize: '0.8rem', color: role === 'admin' ? 'var(--accent-danger)' : role === 'manager' ? 'var(--accent-green)' : 'var(--accent-blue)', display: 'flex', alignItems: 'center', gap: '0.4rem', marginTop: '0.15rem' }}>
              <span className="status-dot" style={{ width: '6px', height: '6px', backgroundColor: role === 'admin' ? 'var(--accent-danger)' : role === 'manager' ? 'var(--accent-green)' : 'var(--accent-blue)', boxShadow: 'none', animation: 'none' }}></span>
              <span>{role === 'admin' ? 'ผู้ดูแลระบบ' : role === 'manager' ? 'ผู้จัดการร้าน' : 'พนักงาน'}</span>
            </div>
          </div>
        )}

        <ul className="sidebar-menu">
          {(role === 'admin' || role === 'manager') && (
            <li className={`menu-item ${view === 'dashboard' ? 'active' : ''}`}>
              <button onClick={() => { setInventoryFilterName(''); setView('dashboard'); setIsMobileMenuOpen(false); }}>
                <LayoutDashboard size={20} className="icon" />
                <span>แดชบอร์ดหลัก</span>
              </button>
            </li>
          )}

          <li className={`menu-item ${view === 'pos' ? 'active' : ''}`}>
            <button onClick={() => { setInventoryFilterName(''); setView('pos'); setIsMobileMenuOpen(false); }}>
              <ShoppingBag size={20} className="icon" />
              <span>ระบบหน้าร้านขายอาหาร (POS)</span>
            </button>
          </li>
          
          {(role === 'admin' || role === 'manager') && (
            <>
              <li className={`menu-item ${view === 'sops' ? 'active' : ''}`}>
                <button onClick={() => { setInventoryFilterName(''); setView('sops'); setIsMobileMenuOpen(false); }}>
                  <BookOpen size={20} className="icon" />
                  <span>คลังคู่มือ SOP</span>
                </button>
              </li>
              <li className={`menu-item ${view === 'scheduler' ? 'active' : ''}`}>
                <button onClick={() => { setInventoryFilterName(''); setView('scheduler'); setIsMobileMenuOpen(false); }}>
                  <CalendarClock size={20} className="icon" />
                  <span>ตั้งเวลาแจ้งเตือน</span>
                </button>
              </li>
            </>
          )}

          <li className={`menu-item ${view === 'inventory' ? 'active' : ''}`}>
            <button onClick={() => { setInventoryFilterName(''); setView('inventory'); setIsMobileMenuOpen(false); }}>
              <ClipboardList size={20} className="icon" />
              <span>{(role === 'admin' || role === 'manager') ? 'คลังวัตถุดิบและยอดขาย POS' : 'บันทึกนำเข้าจัดซื้อวัตถุดิบ'}</span>
            </button>
          </li>

          {(role === 'admin' || role === 'manager') && (
            <li className={`menu-item ${view === 'staff_management' ? 'active' : ''}`}>
              <button onClick={() => { setInventoryFilterName(''); setView('staff_management'); setIsMobileMenuOpen(false); }}>
                <Users size={20} className="icon" />
                <span>จัดการบัญชีพนักงาน</span>
              </button>
            </li>
          )}

          {role === 'admin' && (
            <>
              <li className={`menu-item ${view === 'integrations' ? 'active' : ''}`}>
                <button onClick={() => { setInventoryFilterName(''); setView('integrations'); setIsMobileMenuOpen(false); }}>
                  <Link2 size={20} className="icon" />
                  <span>การเชื่อมต่อระบบ</span>
                </button>
              </li>
              <li className={`menu-item ${view === 'logs' ? 'active' : ''}`}>
                <button onClick={() => { setInventoryFilterName(''); setView('logs'); setIsMobileMenuOpen(false); }}>
                  <TerminalIcon size={20} className="icon" />
                  <span>คอนโซลล็อกยิงแชท</span>
                </button>
              </li>
            </>
          )}
        </ul>

        {/* Theme toggle btn */}
        <button className="theme-toggle-btn" style={{ marginBottom: '0.5rem' }} onClick={() => { toggleTheme(); setIsMobileMenuOpen(false); }}>
          {theme === 'dark' ? (
            <>
              <Sun size={18} />
              <span>ธีมสว่าง (Light Mode)</span>
            </>
          ) : (
            <>
              <Moon size={18} />
              <span>ธีมมืด (Dark Mode)</span>
            </>
          )}
        </button>

        {/* Logout btn */}
        <button className="theme-toggle-btn" style={{ borderColor: 'rgba(239, 68, 68, 0.2)', color: 'var(--accent-danger)' }} onClick={() => { handleLogout(); setIsMobileMenuOpen(false); }}>
          <LogOut size={18} />
          <span>ออกจากระบบ (Logout)</span>
        </button>
      </aside>

      {/* Backdrop overlay for mobile menu */}
      {isMobileMenuOpen && (
        <div className="sidebar-overlay" onClick={() => setIsMobileMenuOpen(false)}></div>
      )}

      {/* Main Content Pane */}
      <main className="main-content">
        <header className="main-header">
          <div className="header-title">
            <h1>
              {view === 'dashboard' && ((role === 'admin' || role === 'manager') ? 'แดชบอร์ดสรุปผลรวม' : 'ตารางงานและการแจ้งเตือน SOP')}
              {view === 'pos' && 'ระบบขายหน้าร้าน (Point of Sale)'}
              {view === 'sops' && 'คลังคู่มือและขั้นตอนการปฏิบัติงาน'}
              {view === 'scheduler' && 'ระบบตั้งเวลาอัตโนมัติ (Cron Scheduler)'}
              {view === 'inventory' && ((role === 'admin' || role === 'manager') ? 'ระบบคลังวัตถุดิบและการกระทบยอดขาย POS' : 'บันทึกจัดซื้อนำเข้าวัตถุดิบ')}
              {view === 'staff_management' && 'การจัดการบัญชีพนักงาน (Staff Accounts)'}
              {view === 'integrations' && 'การเชื่อมต่อระบบภายนอก (API Connectors)'}
              {view === 'logs' && 'ประวัติและข้อมูลบันทึกทางเทคนิค'}
            </h1>
            <p>ระบบบอทตรวจงานและแจ้งเตือนผู้รับผิดชอบผ่าน Messenger และ Line ตามสเกลร้านอาหาร</p>
          </div>

          <div className="header-meta">
            <div className="system-status" style={{
              backgroundColor: connected ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
              color: connected ? 'var(--accent-green)' : 'var(--accent-danger)',
              borderColor: connected ? 'rgba(16, 185, 129, 0.2)' : 'rgba(239, 68, 68, 0.2)'
            }}>
              {connected ? <Wifi size={14} /> : <WifiOff size={14} />}
              <span>{connected ? 'เซิร์ฟเวอร์ออนไลน์' : 'เซิร์ฟเวอร์ออฟไลน์ (พยายามเชื่อมต่อ...)'}</span>
            </div>
            <div className="system-time">
              <span>{formattedDate} {formattedTime}</span>
            </div>
          </div>
        </header>

        {loading ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '60vh', color: 'var(--text-secondary)' }}>
            <div className="status-dot" style={{ width: '16px', height: '16px', marginBottom: '1rem' }}></div>
            <p>กำลังเตรียมความพร้อมของข้อมูลระบบ...</p>
          </div>
        ) : (
          <>
            {view === 'dashboard' && (
              <Dashboard 
                sops={sops} 
                schedules={schedules} 
                logs={logs} 
                settings={settings}
                inventory={inventory}
                reconciliation={reconciliation}
                onTriggerSchedule={handleTriggerSchedule}
                setView={setView}
                role={role}
                setInventoryFilterName={setInventoryFilterName}
              />
            )}
            
            {view === 'sops' && (
              <SopManager 
                sops={sops} 
                onSaveSop={handleSaveSop} 
                onDeleteSop={handleDeleteSop} 
              />
            )}

            {view === 'scheduler' && (
              <Scheduler 
                schedules={schedules} 
                sops={sops}
                onSaveSchedule={handleSaveSchedule}
                onDeleteSchedule={handleDeleteSchedule}
                onToggleActive={handleToggleActive}
              />
            )}

            {view === 'integrations' && (
              <Integrations 
                settings={settings} 
                onSaveSettings={handleSaveSettings} 
              />
            )}

            {view === 'logs' && (
              <LogConsole 
                logs={logs} 
                onClearLogs={handleClearLogs} 
              />
            )}

            {view === 'staff_management' && (role === 'admin' || role === 'manager') && (
              <StaffManagement 
                currentUser={currentUser} 
              />
            )}

            {view === 'inventory' && (
              <InventoryManager 
                role={role} 
                filterName={inventoryFilterName} 
                setFilterName={setInventoryFilterName} 
              />
            )}
          </>
        )}
      </main>
    </div>
  );
}
