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
  LogOut
} from 'lucide-react';
import Dashboard from './components/Dashboard.jsx';
import SopManager from './components/SopManager.jsx';
import Scheduler from './components/Scheduler.jsx';
import Integrations from './components/Integrations.jsx';
import LogConsole from './components/LogConsole.jsx';
import InventoryManager from './components/InventoryManager.jsx';
import Login from './components/Login.jsx';
import StaffManagement from './components/StaffManagement.jsx';

export default function App() {
  const [view, setView] = useState('dashboard');
  const [theme, setTheme] = useState('light');
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
    messengerRecipientId: ''
  });
  
  const [loading, setLoading] = useState(true);
  const [connected, setConnected] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());

  const role = currentUser ? currentUser.role : null;

  const handleLoginSuccess = (user) => {
    setCurrentUser(user);
    localStorage.setItem('currentUser', JSON.stringify(user));
    if (user.role === 'staff') {
      setView('inventory');
    } else {
      setView('dashboard');
    }
  };

  const handleLogout = () => {
    setCurrentUser(null);
    localStorage.removeItem('currentUser');
    setView('dashboard');
  };

  // Redirect staff to allowed views (only inventory, since dashboard/SOP is removed for staff)
  useEffect(() => {
    if (role === 'staff' && view !== 'inventory') {
      setView('inventory');
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

  return (
    <div className="app-container">
      {/* Sidebar Navigation */}
      <aside className="sidebar">
        <div className="logo-container">
          <CalendarClock size={28} className="logo-icon" />
          <span className="logo-text">SOP NOTIFIER</span>
        </div>

        {/* User Profile Card */}
        {currentUser && (
          <div className="role-switcher-card" style={{ background: 'rgba(255, 255, 255, 0.04)', border: '1px solid rgba(255, 255, 255, 0.08)', padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-sidebar)', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px' }}>ผู้ใช้งาน:</div>
            <div style={{ fontWeight: '700', color: '#ffffff', fontSize: '0.95rem', marginTop: '0.15rem' }}>{currentUser.name}</div>
            <div style={{ fontSize: '0.8rem', color: role === 'manager' ? 'var(--accent-green)' : 'var(--accent-blue)', display: 'flex', alignItems: 'center', gap: '0.4rem', marginTop: '0.15rem' }}>
              <span className="status-dot" style={{ width: '6px', height: '6px', backgroundColor: role === 'manager' ? 'var(--accent-green)' : 'var(--accent-blue)', boxShadow: 'none', animation: 'none' }}></span>
              <span>{role === 'manager' ? 'ผู้จัดการร้าน' : 'พนักงาน'}</span>
            </div>
          </div>
        )}

        <ul className="sidebar-menu">
          {role === 'manager' && (
            <li className={`menu-item ${view === 'dashboard' ? 'active' : ''}`}>
              <button onClick={() => { setInventoryFilterName(''); setView('dashboard'); }}>
                <LayoutDashboard size={20} className="icon" />
                <span>แดชบอร์ดหลัก</span>
              </button>
            </li>
          )}
          
          {role === 'manager' && (
            <>
              <li className={`menu-item ${view === 'sops' ? 'active' : ''}`}>
                <button onClick={() => { setInventoryFilterName(''); setView('sops'); }}>
                  <BookOpen size={20} className="icon" />
                  <span>คลังคู่มือ SOP</span>
                </button>
              </li>
              <li className={`menu-item ${view === 'scheduler' ? 'active' : ''}`}>
                <button onClick={() => { setInventoryFilterName(''); setView('scheduler'); }}>
                  <CalendarClock size={20} className="icon" />
                  <span>ตั้งเวลาแจ้งเตือน</span>
                </button>
              </li>
            </>
          )}

          <li className={`menu-item ${view === 'inventory' ? 'active' : ''}`}>
            <button onClick={() => { setInventoryFilterName(''); setView('inventory'); }}>
              <ClipboardList size={20} className="icon" />
              <span>{role === 'manager' ? 'คลังวัตถุดิบและยอดขาย POS' : 'บันทึกนำเข้าจัดซื้อวัตถุดิบ'}</span>
            </button>
          </li>

          {role === 'manager' && (
            <>
              <li className={`menu-item ${view === 'staff_management' ? 'active' : ''}`}>
                <button onClick={() => { setInventoryFilterName(''); setView('staff_management'); }}>
                  <Users size={20} className="icon" />
                  <span>จัดการบัญชีพนักงาน</span>
                </button>
              </li>
              <li className={`menu-item ${view === 'integrations' ? 'active' : ''}`}>
                <button onClick={() => { setInventoryFilterName(''); setView('integrations'); }}>
                  <Link2 size={20} className="icon" />
                  <span>การเชื่อมต่อระบบ</span>
                </button>
              </li>
              <li className={`menu-item ${view === 'logs' ? 'active' : ''}`}>
                <button onClick={() => { setInventoryFilterName(''); setView('logs'); }}>
                  <TerminalIcon size={20} className="icon" />
                  <span>คอนโซลล็อกยิงแชท</span>
                </button>
              </li>
            </>
          )}
        </ul>

        {/* Theme toggle btn */}
        <button className="theme-toggle-btn" style={{ marginBottom: '0.5rem' }} onClick={toggleTheme}>
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
        <button className="theme-toggle-btn" style={{ borderColor: 'rgba(239, 68, 68, 0.2)', color: 'var(--accent-danger)' }} onClick={handleLogout}>
          <LogOut size={18} />
          <span>ออกจากระบบ (Logout)</span>
        </button>
      </aside>

      {/* Main Content Pane */}
      <main className="main-content">
        <header className="main-header">
          <div className="header-title">
            <h1>
              {view === 'dashboard' && (role === 'manager' ? 'แดชบอร์ดสรุปผลรวม' : 'ตารางงานและการแจ้งเตือน SOP')}
              {view === 'sops' && 'คลังคู่มือและขั้นตอนการปฏิบัติงาน'}
              {view === 'scheduler' && 'ระบบตั้งเวลาอัตโนมัติ (Cron Scheduler)'}
              {view === 'inventory' && (role === 'manager' ? 'ระบบคลังวัตถุดิบและการกระทบยอดขาย POS' : 'บันทึกจัดซื้อนำเข้าวัตถุดิบ')}
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

            {view === 'staff_management' && role === 'manager' && (
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
