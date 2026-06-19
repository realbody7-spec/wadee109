import React from 'react';
import { Trash2, Terminal, Cpu, MessageSquareDashed } from 'lucide-react';

export default function LogConsole({ logs, onClearLogs }) {
  const handleClear = () => {
    if (window.confirm('คุณแน่ใจว่าต้องการล้างประวัติการแจ้งเตือนทั้งหมดหรือไม่?')) {
      onClearLogs();
    }
  };

  const formatLogTime = (isoString) => {
    return new Date(isoString).toLocaleString('th-TH');
  };

  const getStatusLabel = (status) => {
    switch (status) {
      case 'simulated': return 'SIMULATED (โหมดจำลอง)';
      case 'success': return 'SUCCESS (สำเร็จ)';
      case 'failed': return 'FAILED (ล้มเหลว)';
      default: return status.toUpperCase();
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 700 }}>คอนโซลล็อกแบบเรียลไทม์ (Live Alerts Console)</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
            ติดตามการยิงแจ้งเตือนเข้าระบบและภายนอก โดยระบบเชื่อมต่อผ่าน Event Source (SSE) เพื่อดึงข้อมูลสดทันทีที่มีการขยับกำหนดเวลา
          </p>
        </div>
        <button 
          className="btn btn-danger" 
          onClick={handleClear}
          disabled={logs.length === 0}
          style={{ fontSize: '0.85rem' }}
        >
          <Trash2 size={14} /> ล้างล็อกทั้งหมด
        </button>
      </div>

      <div className="log-terminal">
        <div className="terminal-header">
          <div className="terminal-title">
            <Terminal size={16} />
            <span>RESTAURANT_SOP_SCHEDULER_LOGGER://STREAM</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.8rem' }}>
            <Cpu size={14} style={{ animation: 'pulse 1.5s infinite' }} />
            <span>ONLINE</span>
          </div>
        </div>

        {logs.length === 0 ? (
          <div className="empty-logs">
            <MessageSquareDashed size={40} style={{ marginBottom: '1rem', opacity: 0.3 }} />
            <p>-- ไม่มีล็อกการแจ้งเตือนเกิดขึ้น หรือยังไม่มีรอบการตั้งเวลาที่ครบกำหนด --</p>
            <p style={{ fontSize: '0.8rem', marginTop: '0.5rem', opacity: 0.5 }}>
              * ลองเปิดใช้งานหน้า "ตั้งเวลาแจ้งเตือน" ทุกนาที เพื่อทดสอบดูความเคลื่อนไหวที่หน้านี้ได้ *
            </p>
          </div>
        ) : (
          logs.map((log) => (
            <div key={log.id} className={`log-line ${log.status}`}>
              <div className="log-meta-info">
                <span>[TIME: {formatLogTime(log.timestamp)}]</span>
                <span>[SOP_ID: {log.sopId}]</span>
                <span className="log-badge-channel">
                  CHANNELS: {log.channels.join(', ').toUpperCase()}
                </span>
                <span style={{ fontWeight: 'bold' }}>
                  STATUS: {getStatusLabel(log.status)}
                </span>
              </div>
              <div style={{ marginTop: '0.5rem', opacity: 0.95 }}>
                {log.messageContent}
              </div>
              {log.details && (
                <div style={{ 
                  marginTop: '0.5rem', 
                  fontSize: '0.8rem', 
                  opacity: 0.7, 
                  fontStyle: 'italic',
                  color: log.status === 'failed' ? '#fca5a5' : '#93c5fd'
                }}>
                  ผลตอบรับ: {log.details}
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
