import React from 'react';
import { 
  ClipboardList, 
  Clock, 
  Settings, 
  MessageSquare, 
  Play, 
  CheckCircle2, 
  XCircle, 
  Info,
  CalendarDays,
  Package,
  TrendingUp
} from 'lucide-react';

export default function Dashboard({ sops, schedules, logs, settings, onTriggerSchedule, setView, inventory = [], reconciliation = [], role = 'admin', setInventoryFilterName }) {
  // Count statistics
  const activeSchedulesCount = schedules.filter(s => s.active).length;
  const totalSops = sops.length;
  const totalNotifications = logs.length;
  const isSimulation = settings.simulationMode;

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

  // Group inventory items by category to calculate cost percentages
  const categories = {
    meat: { label: 'เนื้อสัตว์', color: 'var(--accent-amber)' },
    seafood: { label: 'อาหารทะเล', color: 'var(--accent-blue)' },
    vegetables: { label: 'ผัก', color: 'var(--accent-green)' },
    dry_goods: { label: 'ของแห้ง/เครื่องปรุง', color: 'var(--accent-purple)' },
    dairy: { label: 'ผลิตภัณฑ์นม/เนย', color: 'var(--accent-pink)' },
    others: { label: 'อื่นๆ', color: 'var(--text-muted)' }
  };

  const costByCategory = {};
  let grandTotalCost = 0;
  inventory.forEach(item => {
    const cat = item.category || 'others';
    costByCategory[cat] = (costByCategory[cat] || 0) + item.cost;
    grandTotalCost += item.cost;
  });

  const categoryBreakdown = Object.keys(categories).map(key => {
    const cost = costByCategory[key] || 0;
    const percentage = grandTotalCost > 0 ? ((cost / grandTotalCost) * 100) : 0;
    return {
      key,
      label: categories[key].label,
      color: categories[key].color,
      cost,
      percentage: parseFloat(percentage.toFixed(1))
    };
  }).filter(c => c.cost > 0);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
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

      {/* Inventory & POS Reconciliation Section (50/50 split or full-width) */}
      <div className={(role === 'admin' || role === 'manager') ? "dashboard-grid" : ""}>
        {/* Recent Purchases / Inbound Orders */}
        <div className="card card-accent-amber" style={role === 'staff' ? { width: '100%' } : {}}>
          <div className="card-title-row">
            <h2>รายการรับเข้าวัตถุดิบ / สั่งซื้อล่าสุด</h2>
            <button className="btn btn-secondary" onClick={() => setView('inventory')}>
              {(role === 'admin' || role === 'manager') ? 'จัดการคลัง' : 'บันทึกวัตถุดิบ'}
            </button>
          </div>

          {(role === 'admin' || role === 'manager') && categoryBreakdown.length > 0 && (
            <div 
              style={{ marginBottom: '1.25rem', padding: '1rem', background: 'rgba(0,0,0,0.015)', borderRadius: '12px', border: '1px solid var(--border-card)', cursor: 'pointer' }}
              onClick={() => setView('inventory')}
              title="คลิกเพื่อดูรายละเอียดคลังวัตถุดิบ"
            >
              <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '0.5rem', fontWeight: '500' }}>แผนภูมิสัดส่วนต้นทุนวัตถุดิบแยกตามหมวดหมู่:</p>
              {/* Stacked bar */}
              <div style={{ display: 'flex', width: '100%', height: '14px', borderRadius: '7px', overflow: 'hidden', background: 'rgba(255,255,255,0.05)', marginBottom: '0.75rem' }}>
                {categoryBreakdown.map(c => (
                  <div 
                    key={c.key} 
                    style={{ 
                      width: `${c.percentage}%`, 
                      height: '100%', 
                      backgroundColor: c.color 
                    }} 
                    title={`${c.label}: ${c.percentage}% (${c.cost.toLocaleString()} ฿)`}
                  />
                ))}
              </div>
              {/* Legend */}
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem 1rem', fontSize: '0.75rem' }}>
                {categoryBreakdown.map(c => (
                  <div key={c.key} style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                    <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: c.color }} />
                    <span style={{ color: 'var(--text-secondary)' }}>{c.label}:</span>
                    <strong>{c.percentage}% ({c.cost.toLocaleString()} ฿)</strong>
                  </div>
                ))}
              </div>
            </div>
          )}

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
                      จำนวน: <strong>{item.quantity} {item.unit}</strong> | ยอดเงิน: <strong>{item.cost.toLocaleString()} บาท</strong>
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

      {/* Active Schedules & Live Notification Logs Section - NOW AT THE BOTTOM */}
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
