import React, { useState } from 'react';
import { Lock, User, CalendarClock, AlertCircle, Coffee } from 'lucide-react';

export default function Login({ onLoginSuccess }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!username.trim() || !password.trim()) {
      setError('กรุณากรอกชื่อผู้ใช้และรหัสผ่าน');
      return;
    }

    setError('');
    setLoading(true);

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: username.trim(),
          password: password.trim()
        })
      });

      const data = await response.json();

      if (response.ok && data.success) {
        onLoginSuccess(data.user);
      } else {
        setError(data.message || 'ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง');
      }
    } catch (err) {
      console.error('Login error:', err);
      setError('เกิดข้อผิดพลาดในการเชื่อมต่อเซิร์ฟเวอร์');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '100vh',
      width: '100vw',
      background: 'linear-gradient(135deg, var(--bg-primary) 0%, #ecdcc9 100%)',
      padding: '1.5rem',
      position: 'fixed',
      top: 0,
      left: 0,
      zIndex: 9999,
      overflow: 'hidden'
    }}>
      {/* Dynamic soft glowing backgrounds */}
      <div style={{
        position: 'absolute',
        width: '400px',
        height: '400px',
        borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(16, 185, 129, 0.08) 0%, rgba(16, 185, 129, 0) 70%)',
        top: '-10%',
        left: '-10%',
        pointerEvents: 'none'
      }}></div>
      <div style={{
        position: 'absolute',
        width: '500px',
        height: '500px',
        borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(14, 165, 233, 0.08) 0%, rgba(14, 165, 233, 0) 70%)',
        bottom: '-10%',
        right: '-10%',
        pointerEvents: 'none'
      }}></div>

      <div className="card" style={{
        width: '100%',
        maxWidth: '440px',
        padding: '2.5rem',
        boxShadow: '0 20px 40px 0 rgba(60, 51, 42, 0.08), var(--glass-glow)',
        background: 'rgba(255, 255, 255, 0.85)',
        backdropFilter: 'blur(20px)',
        border: '1px solid rgba(188, 170, 144, 0.25)',
        borderRadius: '24px',
        transform: 'none', // Override standard translateY hover to keep it stable
        animation: 'fadeIn 0.5s ease-out'
      }}>
        {/* Header Logo */}
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '0.75rem',
          marginBottom: '2.25rem',
          textAlign: 'center'
        }}>
          <div style={{
            width: '64px',
            height: '64px',
            borderRadius: '18px',
            backgroundColor: 'var(--bg-primary)',
            border: '1px solid rgba(188, 170, 144, 0.2)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--accent-green)',
            boxShadow: '0 8px 16px rgba(16, 185, 129, 0.1)'
          }}>
            <CalendarClock size={32} style={{ filter: 'drop-shadow(0 0 6px rgba(16, 185, 129, 0.25))' }} />
          </div>
          <div>
            <h1 style={{
              fontSize: '1.5rem',
              fontWeight: '700',
              color: 'var(--text-primary)',
              letterSpacing: '-0.5px'
            }}>
              SOP NOTIFIER & INVENTORY
            </h1>
            <p style={{
              fontSize: '0.85rem',
              color: 'var(--text-secondary)',
              marginTop: '0.25rem'
            }}>
              ระบบบันทึกคลังวัตถุดิบและแจ้งเตือนพนักงาน
            </p>
          </div>
        </div>

        {/* Error Alert */}
        {error && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem',
            padding: '0.75rem 1rem',
            backgroundColor: 'rgba(239, 68, 68, 0.08)',
            border: '1px solid rgba(239, 68, 68, 0.15)',
            color: 'var(--accent-danger)',
            borderRadius: '12px',
            fontSize: '0.85rem',
            marginBottom: '1.5rem',
            animation: 'shake 0.3s ease-in-out'
          }}>
            <AlertCircle size={18} style={{ flexShrink: 0 }} />
            <span>{error}</span>
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div className="form-group">
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: '600' }}>
              <User size={16} />
              <span>ชื่อผู้ใช้งาน (Username)</span>
            </label>
            <input
              type="text"
              className="form-control"
              placeholder="กรอกชื่อผู้ใช้ เช่น admin, manager, staff"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              disabled={loading}
              autoFocus
              style={{
                paddingLeft: '1.25rem',
                fontSize: '0.95rem',
                borderRadius: '12px'
              }}
            />
          </div>

          <div className="form-group">
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: '600' }}>
              <Lock size={16} />
              <span>รหัสผ่าน (Password)</span>
            </label>
            <input
              type="password"
              className="form-control"
              placeholder="กรอกรหัสผ่าน"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={loading}
              style={{
                paddingLeft: '1.25rem',
                fontSize: '0.95rem',
                borderRadius: '12px'
              }}
            />
          </div>

          <button
            type="submit"
            className="btn btn-primary"
            disabled={loading}
            style={{
              width: '100%',
              padding: '0.85rem',
              borderRadius: '14px',
              fontSize: '1rem',
              fontWeight: '600',
              marginTop: '1rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.75rem'
            }}
          >
            {loading ? (
              <>
                <div className="status-dot" style={{ width: '8px', height: '8px', backgroundColor: '#ffffff', boxShadow: 'none' }}></div>
                <span>กำลังเข้าสู่ระบบ...</span>
              </>
            ) : (
              <>
                <Coffee size={18} />
                <span>เข้าสู่ระบบ</span>
              </>
            )}
          </button>
        </form>

        <div style={{
          marginTop: '2rem',
          textAlign: 'center',
          fontSize: '0.75rem',
          color: 'var(--text-muted)'
        }}>
          ลิขสิทธิ์ระบบบอทตรวจงานและระบบคลังสินค้า &copy; {new Date().getFullYear()}
        </div>
      </div>

      {/* Embedded CSS Animations */}
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(15px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-5px); }
          75% { transform: translateX(5px); }
        }
      `}</style>
    </div>
  );
}
