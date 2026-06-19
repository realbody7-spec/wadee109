import React, { useState } from 'react';
import { Clock, Plus, Trash2, Edit3, Save, Bell, AlertTriangle } from 'lucide-react';

export default function Scheduler({ schedules, sops, onSaveSchedule, onDeleteSchedule, onToggleActive }) {
  const [selectedSchedule, setSelectedSchedule] = useState(schedules[0] || null);
  const [isEditing, setIsEditing] = useState(false);

  // Form states
  const [editId, setEditId] = useState('');
  const [editName, setEditName] = useState('');
  const [editSopId, setEditSopId] = useState('');
  const [editCronExpression, setEditCronExpression] = useState('0 9 * * *');
  const [editChannels, setEditChannels] = useState(['line_notify']);
  const [editActive, setEditActive] = useState(true);

  // Cron presets
  const cronPresets = [
    { label: 'ทุกนาที (เพื่อทดสอบ)', val: '*/1 * * * *' },
    { label: 'ทุกเช้า (08:00 น.)', val: '0 8 * * *' },
    { label: 'บ่ายเปลี่ยนผลัด (14:00 น.)', val: '0 14 * * *' },
    { label: 'ปิดร้านค่ำ (22:00 น.)', val: '0 22 * * *' },
    { label: 'ทุกวันจันทร์เช้า (09:00 น.)', val: '0 9 * * 1' }
  ];

  const handleSelectSchedule = (sched) => {
    setSelectedSchedule(sched);
    setIsEditing(false);
  };

  const handleStartAdd = () => {
    if (sops.length === 0) {
      alert('กรุณาสร้าง SOP ในคลังอย่างน้อย 1 คู่มือก่อนตั้งเวลาการแจ้งเตือน');
      return;
    }
    setEditId('');
    setEditName('');
    setEditSopId(sops[0]?.id || '');
    setEditCronExpression('*/1 * * * *'); // default to 1 min for easy testing
    setEditChannels(['line_notify']);
    setEditActive(true);
    setIsEditing(true);
  };

  const handleStartEdit = (sched) => {
    setEditId(sched.id);
    setEditName(sched.name);
    setEditSopId(sched.sopId);
    setEditCronExpression(sched.cronExpression);
    setEditChannels(sched.channels);
    setEditActive(sched.active);
    setIsEditing(true);
  };

  const handleChannelToggle = (channel) => {
    if (editChannels.includes(channel)) {
      if (editChannels.length === 1) return; // Keep at least one
      setEditChannels(editChannels.filter(c => c !== channel));
    } else {
      setEditChannels([...editChannels, channel]);
    }
  };

  const handleSave = (e) => {
    e.preventDefault();
    if (!editName.trim()) {
      alert('กรุณากรอกชื่อหัวข้อตาราง');
      return;
    }
    if (!editCronExpression.trim()) {
      alert('กรุณากรอก Cron Expression');
      return;
    }
    if (!editSopId) {
      alert('กรุณาเลือก SOP');
      return;
    }

    const scheduleData = {
      id: editId || undefined,
      sopId: editSopId,
      name: editName,
      cronExpression: editCronExpression,
      channels: editChannels,
      active: editActive
    };

    onSaveSchedule(scheduleData);
    setIsEditing(false);
  };

  const handleDelete = (id) => {
    if (window.confirm('คุณแน่ใจว่าต้องการลบตารางแจ้งเตือนนี้?')) {
      onDeleteSchedule(id);
      if (selectedSchedule && selectedSchedule.id === id) {
        setSelectedSchedule(schedules.filter(s => s.id !== id)[0] || null);
      }
    }
  };

  const getChannelNameThai = (channel) => {
    const maps = {
      line_notify: 'LINE Notify 💬',
      line_push: 'LINE Messaging API 🤖',
      messenger: 'Messenger 🔵'
    };
    return maps[channel] || channel;
  };

  return (
    <div className="scheduler-grid">
      {/* Left Pane: Schedules list */}
      <div className="schedules-list-panel">
        <div className="card">
          <div className="card-title-row">
            <h2>ตารางงานและการแจ้งเตือน</h2>
            <button className="btn btn-primary btn-icon-only" onClick={handleStartAdd} title="ตั้งเวลาแจ้งเตือนใหม่">
              <Plus size={18} />
            </button>
          </div>

          <div className="list-container" style={{ maxHeight: '480px', marginTop: '1rem' }}>
            {schedules.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '3rem 1rem', color: 'var(--text-muted)' }}>
                ไม่มีตารางการแจ้งเตือน
              </div>
            ) : (
              schedules.map(sched => (
                <div 
                  key={sched.id} 
                  className={`sop-card ${selectedSchedule && selectedSchedule.id === sched.id ? 'selected' : ''}`}
                  onClick={() => handleSelectSchedule(sched)}
                >
                  <div className="sop-card-header">
                    <div>
                      <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                        {sched.name}
                      </h3>
                      <span className="item-subtitle" style={{marginTop: '0.2rem', display: 'block'}}>
                        SOP: {sched.sopTitle}
                      </span>
                    </div>
                    
                    {/* Active toggle in list */}
                    <div onClick={(e) => e.stopPropagation()}>
                      <label className="switch">
                        <input 
                          type="checkbox" 
                          checked={sched.active}
                          onChange={() => onToggleActive(sched.id, !sched.active)}
                        />
                        <span className="slider"></span>
                      </label>
                    </div>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.75rem', fontSize: '0.8rem' }}>
                    <span style={{ color: 'var(--accent-blue)', fontFamily: 'monospace', fontWeight: 'bold' }}>
                      Cron: {sched.cronExpression}
                    </span>
                    <div style={{ display: 'flex', gap: '0.3rem' }}>
                      {sched.channels.map(ch => (
                        <span key={ch} style={{ 
                          fontSize: '0.7rem', 
                          padding: '0.1rem 0.4rem', 
                          borderRadius: '4px',
                          backgroundColor: 'rgba(255,255,255,0.06)',
                          color: 'var(--text-secondary)'
                        }}>
                          {ch === 'line_notify' ? 'Line' : ch === 'line_push' ? 'Line Push' : 'FB'}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Right Pane: View / Edit detail */}
      <div className="schedules-detail-panel">
        {isEditing ? (
          /* Form to create/edit schedules */
          <div className="card">
            <h2>{editId ? 'แก้ไขการตั้งเวลา' : 'สร้างตารางเวลาแจ้งเตือนใหม่'}</h2>
            <form onSubmit={handleSave} style={{ marginTop: '1.5rem' }}>
              <div className="form-group">
                <label>ชื่อตาราง/ภารกิจ *</label>
                <input 
                  type="text" 
                  className="form-control" 
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  placeholder="เช่น แจ้งเปิดร้าน FOH, แจ้งนับสต็อกวัตถุดิบค่ำ"
                  required
                />
              </div>

              <div className="form-group">
                <label>เชื่อมโยงคู่มือ SOP *</label>
                <select 
                  className="form-control"
                  value={editSopId}
                  onChange={(e) => setEditSopId(e.target.value)}
                  required
                >
                  <option value="" disabled>เลือก SOP ที่ต้องการแจ้งเตือน</option>
                  {sops.map(sop => (
                    <option key={sop.id} value={sop.id}>
                      [{sop.category.toUpperCase()}] {sop.title}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label>ตั้งเวลาเตือน (Cron Expression) *</label>
                <input 
                  type="text" 
                  className="form-control" 
                  value={editCronExpression}
                  onChange={(e) => setEditCronExpression(e.target.value)}
                  placeholder="เช่น */1 * * * * หรือ 0 8 * * *"
                  style={{ fontFamily: 'monospace', fontSize: '1.05rem', letterSpacing: '0.5px' }}
                  required
                />
                
                {/* Cron Presets */}
                <div className="cron-helper">
                  <p>คลิกเพื่อเลือกเวลาตั้งค่าด่วน:</p>
                  <div className="cron-presets">
                    {cronPresets.map(preset => (
                      <span 
                        key={preset.label} 
                        className="preset-chip"
                        onClick={() => setEditCronExpression(preset.val)}
                      >
                        {preset.label} ({preset.val})
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              <div className="form-group">
                <label>ช่องทางการส่งแจ้งเตือน (เลือกได้มากกว่า 1)</label>
                <div className="channels-checkboxes">
                  <label className="checkbox-label">
                    <input 
                      type="checkbox"
                      checked={editChannels.includes('line_notify')}
                      onChange={() => handleChannelToggle('line_notify')}
                    />
                    <span>LINE Notify</span>
                  </label>

                  <label className="checkbox-label">
                    <input 
                      type="checkbox"
                      checked={editChannels.includes('line_push')}
                      onChange={() => handleChannelToggle('line_push')}
                    />
                    <span>LINE Push API</span>
                  </label>

                  <label className="checkbox-label">
                    <input 
                      type="checkbox"
                      checked={editChannels.includes('messenger')}
                      onChange={() => handleChannelToggle('messenger')}
                    />
                    <span>Messenger</span>
                  </label>
                </div>
              </div>

              <div className="form-group" style={{ flexDirection: 'row', alignItems: 'center', gap: '1rem', marginTop: '1rem' }}>
                <label style={{ margin: 0, cursor: 'pointer' }}>เปิดใช้งานเวลานี้ทันที</label>
                <label className="switch">
                  <input 
                    type="checkbox" 
                    checked={editActive}
                    onChange={(e) => setEditActive(e.target.checked)}
                  />
                  <span className="slider"></span>
                </label>
              </div>

              <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', marginTop: '2rem' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setIsEditing(false)}>
                  ยกเลิก
                </button>
                <button type="submit" className="btn btn-primary">
                  <Save size={16} /> บันทึกตารางเวลา
                </button>
              </div>
            </form>
          </div>
        ) : selectedSchedule ? (
          /* View details of schedule */
          <div className="card">
            <div className="card-title-row" style={{ alignItems: 'flex-start' }}>
              <div>
                <span className={`badge badge-success`} style={{ 
                  marginBottom: '0.5rem',
                  backgroundColor: selectedSchedule.active ? 'rgba(16, 185, 129, 0.15)' : 'rgba(255, 255, 255, 0.08)',
                  color: selectedSchedule.active ? 'var(--accent-green)' : 'var(--text-muted)'
                }}>
                  {selectedSchedule.active ? 'กำลังรันตรวจเช็กเวลา' : 'ปิดการทำงานชั่วคราว'}
                </span>
                <h2 style={{ fontSize: '1.5rem', fontWeight: '700' }}>{selectedSchedule.name}</h2>
                <p style={{ color: 'var(--text-secondary)', marginTop: '0.5rem', fontSize: '0.9rem' }}>
                  คู่มือที่แนบ: <strong>{selectedSchedule.sopTitle}</strong>
                </p>
              </div>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button className="btn btn-secondary btn-icon-only" onClick={() => handleStartEdit(selectedSchedule)} title="แก้ไขตาราง">
                  <Edit3 size={16} />
                </button>
                <button className="btn btn-danger btn-icon-only" onClick={() => handleDelete(selectedSchedule.id)} title="ลบตาราง">
                  <Trash2 size={16} />
                </button>
              </div>
            </div>

            <div style={{ margin: '1.5rem 0', borderTop: '1px solid var(--border-card)', paddingTop: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>รูปแบบความถี่เวลา (Cron):</span>
                <div style={{ 
                  fontFamily: 'monospace', 
                  fontSize: '1.25rem', 
                  color: 'var(--accent-blue)', 
                  background: 'rgba(255,255,255,0.02)',
                  padding: '0.5rem 1rem',
                  borderRadius: '8px',
                  width: 'max-content',
                  marginTop: '0.25rem',
                  border: '1px solid var(--border-card)'
                }}>
                  {selectedSchedule.cronExpression}
                </div>
              </div>

              <div>
                <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>ช่องทางการส่งออก:</span>
                <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.4rem' }}>
                  {selectedSchedule.channels.map(ch => (
                    <span key={ch} className="badge" style={{ backgroundColor: 'rgba(255,255,255,0.05)', border: '1px solid var(--border-card)', padding: '0.4rem 0.8rem', fontSize: '0.85rem' }}>
                      {getChannelNameThai(ch)}
                    </span>
                  ))}
                </div>
              </div>

              <div>
                <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>เวลาแจ้งเตือนล่าสุด:</span>
                <div style={{ fontSize: '0.95rem', fontWeight: 500, marginTop: '0.25rem' }}>
                  {selectedSchedule.lastRun ? new Date(selectedSchedule.lastRun).toLocaleString('th-TH') : 'ยังไม่เคยทำงาน'}
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', borderTop: '1px solid var(--border-card)', paddingTop: '1.25rem' }}>
              <Clock size={16} style={{ color: 'var(--text-muted)' }} />
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                ระบบใช้ระบบยิงอัตโนมัติ (Server Cron) รันที่หลังบ้าน 24 ชั่วโมง
              </span>
            </div>
          </div>
        ) : (
          /* Empty State */
          <div className="card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '400px', color: 'var(--text-muted)' }}>
            <Bell size={48} strokeWidth={1.5} style={{ marginBottom: '1rem', color: 'var(--text-muted)' }} />
            <p>กรุณาเลือกตารางการแจ้งเตือนจากรายการ หรือสร้างตารางขึ้นมาใหม่</p>
          </div>
        )}
      </div>
    </div>
  );
}
