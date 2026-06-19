import React, { useState, useEffect } from 'react';
import { UserPlus, Trash2, Shield, Users, CheckCircle, XCircle, AlertTriangle, Key } from 'lucide-react';

export default function StaffManagement({ currentUser }) {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [editingUserId, setEditingUserId] = useState(null);
  const [newPasswordVal, setNewPasswordVal] = useState('');
  
  // New User Form States
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [role, setRole] = useState('staff');
  const [formError, setFormError] = useState('');
  const [formSuccess, setFormSuccess] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/users');
      if (response.ok) {
        const data = await response.json();
        setUsers(data);
      }
    } catch (err) {
      console.error('Error fetching users:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateUser = async (e) => {
    e.preventDefault();
    setFormError('');
    setFormSuccess('');

    if (!username.trim() || !password.trim() || !name.trim()) {
      setFormError('กรุณากรอกข้อมูลให้ครบทุกช่อง');
      return;
    }

    if (username.trim().length < 3) {
      setFormError('ชื่อผู้ใช้ต้องมีอย่างน้อย 3 ตัวอักษร');
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: username.trim(),
          password: password.trim(),
          name: name.trim(),
          role
        })
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setFormSuccess(`สร้างบัญชีพนักงาน "${name}" สำเร็จ!`);
        setUsername('');
        setPassword('');
        setName('');
        setRole('staff');
        fetchUsers(); // Refresh list
      } else {
        setFormError(data.error || 'ไม่สามารถสร้างบัญชีผู้ใช้ได้');
      }
    } catch (err) {
      console.error('Error creating user:', err);
      setFormError('เกิดข้อผิดพลาดในการเชื่อมต่อเซิร์ฟเวอร์');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteUser = async (userId, targetUsername) => {
    if (targetUsername === currentUser.username) {
      alert('คุณไม่สามารถลบบัญชีที่กำลังล็อกอินใช้งานอยู่ได้');
      return;
    }

    if (targetUsername === 'manager') {
      alert('ไม่สามารถลบบัญชีผู้จัดการหลัก (manager) ของระบบได้');
      return;
    }

    if (!confirm(`คุณแน่ใจหรือไม่ที่จะลบบัญชีผู้ใช้ "${targetUsername}" ออกจากระบบ?`)) {
      return;
    }

    try {
      const response = await fetch(`/api/users/${userId}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        alert('ลบบัญชีผู้ใช้งานเรียบร้อยแล้ว!');
        fetchUsers();
      } else {
        const data = await response.json();
        alert(data.error || 'ลบผู้ใช้งานไม่สำเร็จ');
      }
    } catch (err) {
      console.error('Error deleting user:', err);
      alert('เกิดข้อผิดพลาดในการส่งคำสั่งลบ');
    }
  };

  const handleChangePassword = async (e, userId) => {
    e.preventDefault();
    if (!newPasswordVal.trim()) {
      alert('กรุณากรอกรหัสผ่านใหม่');
      return;
    }

    try {
      const response = await fetch(`/api/users/${userId}/password`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ newPassword: newPasswordVal.trim() })
      });

      const data = await response.json();
      if (response.ok && data.success) {
        alert('เปลี่ยนรหัสผ่านสำเร็จเรียบร้อยแล้ว!');
        setEditingUserId(null);
        setNewPasswordVal('');
      } else {
        alert(data.error || 'เปลี่ยนรหัสผ่านไม่สำเร็จ');
      }
    } catch (err) {
      console.error('Error changing password:', err);
      alert('เกิดข้อผิดพลาดในการเชื่อมต่อเซิร์ฟเวอร์');
    }
  };

  return (
    <div className="sop-grid">
      {/* Left panel: Add Staff Form */}
      <div className="card card-accent-green" style={{ height: 'fit-content' }}>
        <div className="card-title-row" style={{ marginBottom: '1.25rem' }}>
          <h2 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '1.2rem' }}>
            <UserPlus size={22} style={{ color: 'var(--accent-green)' }} />
            <span>สร้างบัญชีพนักงานใหม่</span>
          </h2>
        </div>

        {formError && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            padding: '0.65rem 1rem',
            borderRadius: '8px',
            backgroundColor: 'rgba(239, 68, 68, 0.1)',
            color: 'var(--accent-danger)',
            border: '1px solid rgba(239, 68, 68, 0.2)',
            fontSize: '0.85rem',
            marginBottom: '1rem'
          }}>
            <XCircle size={16} />
            <span>{formError}</span>
          </div>
        )}

        {formSuccess && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            padding: '0.65rem 1rem',
            borderRadius: '8px',
            backgroundColor: 'rgba(16, 185, 129, 0.1)',
            color: 'var(--accent-green)',
            border: '1px solid rgba(16, 185, 129, 0.2)',
            fontSize: '0.85rem',
            marginBottom: '1rem'
          }}>
            <CheckCircle size={16} />
            <span>{formSuccess}</span>
          </div>
        )}

        <form onSubmit={handleCreateUser} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div className="form-group">
            <label>ชื่อแสดงตัวพนักงาน (Display Name)</label>
            <input
              type="text"
              className="form-control"
              placeholder="เช่น นายสมชาย คนขยัน, ครัว-กุ๊ก A"
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={isSubmitting}
            />
          </div>

          <div className="form-group">
            <label>ชื่อผู้ใช้งาน (Username สำหรับล็อกอิน)</label>
            <input
              type="text"
              className="form-control"
              placeholder="ภาษาอังกฤษเท่านั้น เช่น somchai_kitchen"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              disabled={isSubmitting}
            />
          </div>

          <div className="form-group">
            <label>รหัสผ่านเริ่มต้น (Password)</label>
            <input
              type="password"
              className="form-control"
              placeholder="กรอกรหัสผ่านเข้าใช้งาน"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={isSubmitting}
            />
          </div>

          <div className="form-group">
            <label>ระดับสิทธิ์ผู้ใช้งาน (Role)</label>
            <select
              className="form-control"
              value={role}
              onChange={(e) => setRole(e.target.value)}
              disabled={isSubmitting}
            >
              <option value="staff">👥 พนักงาน (ดูและบันทึกคลังได้อย่างเดียว)</option>
              <option value="manager">🔑 ผู้จัดการ (ควบคุมระบบได้ทั้งหมด)</option>
            </select>
          </div>

          <button
            type="submit"
            className="btn btn-primary"
            disabled={isSubmitting}
            style={{ width: '100%', marginTop: '0.5rem', padding: '0.75rem' }}
          >
            <span>{isSubmitting ? 'กำลังบันทึก...' : 'สร้างบัญชีผู้ใช้'}</span>
          </button>
        </form>
      </div>

      {/* Right panel: Staff List */}
      <div className="card">
        <div className="card-title-row" style={{ marginBottom: '1.25rem' }}>
          <h2 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '1.2rem' }}>
            <Users size={22} style={{ color: 'var(--accent-blue)' }} />
            <span>บัญชีผู้ใช้งานระบบทั้งหมด ({users.length})</span>
          </h2>
        </div>

        {loading && users.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
            <span>กำลังโหลดรายชื่อ...</span>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {users.map(u => (
              <div
                key={u.id}
                className="list-item"
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '1rem 1.25rem',
                  borderLeft: `4px solid ${u.role === 'manager' ? 'var(--accent-green)' : 'var(--accent-blue)'}`
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  <div style={{
                    width: '40px',
                    height: '40px',
                    borderRadius: '50%',
                    backgroundColor: u.role === 'manager' ? 'rgba(16, 185, 129, 0.08)' : 'rgba(14, 165, 233, 0.08)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: u.role === 'manager' ? 'var(--accent-green)' : 'var(--accent-blue)'
                  }}>
                    {u.role === 'manager' ? <Shield size={18} /> : <Users size={18} />}
                  </div>
                  <div>
                    <div style={{ fontWeight: '600', fontSize: '0.95rem' }}>{u.name}</div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                      Username: <strong>{u.username}</strong>
                    </div>
                    {editingUserId === u.id && (
                      <form onSubmit={(e) => handleChangePassword(e, u.id)} style={{ display: 'flex', gap: '0.4rem', marginTop: '0.5rem', width: '260px' }}>
                        <input
                          type="password"
                          placeholder="กรอกรหัสผ่านใหม่"
                          className="form-control"
                          style={{ padding: '0.3rem 0.5rem', fontSize: '0.8rem', height: 'auto', flex: 1, border: '1px solid var(--accent-green)' }}
                          value={newPasswordVal}
                          onChange={(e) => setNewPasswordVal(e.target.value)}
                          autoFocus
                          required
                        />
                        <button type="submit" className="btn btn-primary" style={{ padding: '0.3rem 0.6rem', fontSize: '0.8rem' }}>บันทึก</button>
                        <button type="button" className="btn btn-secondary" style={{ padding: '0.3rem 0.6rem', fontSize: '0.8rem' }} onClick={() => setEditingUserId(null)}>ยกเลิก</button>
                      </form>
                    )}
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <span className={`badge ${u.role === 'manager' ? 'badge-success' : 'badge-simulated'}`}>
                    {u.role === 'manager' ? 'ผู้จัดการ (Manager)' : 'พนักงาน (Staff)'}
                  </span>
                  
                  {editingUserId !== u.id && (
                    <button
                      type="button"
                      className="btn btn-secondary btn-icon-only"
                      onClick={() => {
                        setEditingUserId(u.id);
                        setNewPasswordVal('');
                      }}
                      title="เปลี่ยนรหัสผ่าน"
                      style={{ padding: '0.35rem' }}
                    >
                      <Key size={14} />
                    </button>
                  )}
                  
                  {u.username !== 'manager' && u.username !== currentUser.username && (
                    <button
                      type="button"
                      className="btn btn-danger btn-icon-only"
                      onClick={() => handleDeleteUser(u.id, u.username)}
                      title="ลบบัญชีผู้ใช้นี้"
                      style={{ padding: '0.35rem' }}
                    >
                      <Trash2 size={16} />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        <div style={{
          marginTop: '1.5rem',
          padding: '0.85rem',
          backgroundColor: 'rgba(245, 158, 11, 0.05)',
          border: '1px solid rgba(245, 158, 11, 0.1)',
          borderRadius: '12px',
          display: 'flex',
          gap: '0.5rem',
          fontSize: '0.8rem',
          color: 'var(--text-secondary)'
        }}>
          <AlertTriangle size={16} style={{ color: 'var(--accent-amber)', flexShrink: 0 }} />
          <span>บัญชีผู้จัดการหลัก (username: <strong>manager</strong>) และบัญชีของตัวคุณเองที่กำลังล็อกอิน จะได้รับการคุ้มครองเพื่อความปลอดภัย ไม่สามารถลบออกจากระบบได้</span>
        </div>
      </div>
    </div>
  );
}
