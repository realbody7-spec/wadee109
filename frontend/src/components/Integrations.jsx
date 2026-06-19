import React, { useState } from 'react';
import { Send, CheckCircle, XCircle, AlertTriangle, ShieldCheck, HelpCircle } from 'lucide-react';

export default function Integrations({ settings, onSaveSettings }) {
  const [simulationMode, setSimulationMode] = useState(settings.simulationMode);
  
  // Line Notify States
  const [lineNotifyToken, setLineNotifyToken] = useState(settings.lineNotifyToken || '');
  const [testLineNotifyStatus, setTestLineNotifyStatus] = useState(null); // { success: boolean, msg: string }
  const [isTestingLineNotify, setIsTestingLineNotify] = useState(false);

  // Line Messaging API States
  const [lineChannelAccessToken, setLineChannelAccessToken] = useState(settings.lineChannelAccessToken || '');
  const [lineUserId, setLineUserId] = useState(settings.lineUserId || '');
  const [lineChannelSecret, setLineChannelSecret] = useState(settings.lineChannelSecret || '');
  const [testLinePushStatus, setTestLinePushStatus] = useState(null);
  const [isTestingLinePush, setIsTestingLinePush] = useState(false);

  // Google Sheets States
  const [googleSheetWebhookUrl, setGoogleSheetWebhookUrl] = useState(settings.googleSheetWebhookUrl || '');
  const [driveFolderId, setDriveFolderId] = useState(settings.driveFolderId || '');
  const [testGoogleSheetStatus, setTestGoogleSheetStatus] = useState(null);
  const [isTestingGoogleSheet, setIsTestingGoogleSheet] = useState(false);

  // Messenger States
  const [messengerPageAccessToken, setMessengerPageAccessToken] = useState(settings.messengerPageAccessToken || '');
  const [messengerRecipientId, setMessengerRecipientId] = useState(settings.messengerRecipientId || '');
  const [testMessengerStatus, setTestMessengerStatus] = useState(null);
  const [isTestingMessenger, setIsTestingMessenger] = useState(false);

  const handleSaveAll = (e) => {
    e.preventDefault();
    onSaveSettings({
      simulationMode,
      lineNotifyToken,
      lineChannelAccessToken,
      lineUserId,
      lineChannelSecret,
      googleSheetWebhookUrl,
      driveFolderId,
      messengerPageAccessToken,
      messengerRecipientId
    });
    alert('บันทึกการตั้งค่าการเชื่อมต่อเรียบร้อยแล้ว!');
  };

  const handleToggleSimulation = (e) => {
    const checked = e.target.checked;
    setSimulationMode(checked);
    onSaveSettings({
      simulationMode: checked,
      lineNotifyToken,
      lineChannelAccessToken,
      lineUserId,
      lineChannelSecret,
      googleSheetWebhookUrl,
      driveFolderId,
      messengerPageAccessToken,
      messengerRecipientId
    }, true); // Silent update
  };

  const testLineNotify = async () => {
    if (!lineNotifyToken) {
      alert('กรุณากรอก LINE Notify Token ก่อนทดสอบ');
      return;
    }
    setIsTestingLineNotify(true);
    setTestLineNotifyStatus(null);
    try {
      const response = await fetch('/api/settings/test-line', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: lineNotifyToken })
      });
      const data = await response.json();
      setTestLineNotifyStatus({ success: data.success, msg: data.message });
    } catch (err) {
      setTestLineNotifyStatus({ success: false, msg: 'การเชื่อมต่อฝั่งเซิร์ฟเวอร์ล้มเหลว' });
    } finally {
      setIsTestingLineNotify(false);
    }
  };

  const testGoogleSheet = async () => {
    if (!googleSheetWebhookUrl) {
      alert('กรุณากรอก Google Sheets Webhook URL ก่อนทดสอบ');
      return;
    }
    setIsTestingGoogleSheet(true);
    setTestGoogleSheetStatus(null);
    try {
      const response = await fetch('/api/settings/test-sheet', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          webhookUrl: googleSheetWebhookUrl,
          driveFolderId: driveFolderId
        })
      });
      const data = await response.json();
      setTestGoogleSheetStatus({ success: data.success, msg: data.message });
    } catch (err) {
      setTestGoogleSheetStatus({ success: false, msg: 'การเชื่อมต่อฝั่งเซิร์ฟเวอร์ล้มเหลว' });
    } finally {
      setIsTestingGoogleSheet(false);
    }
  };

  const testLinePush = async () => {
    if (!lineChannelAccessToken || !lineUserId) {
      alert('กรุณากรอก Channel Access Token และ User ID ก่อนทดสอบ');
      return;
    }
    setIsTestingLinePush(true);
    setTestLinePushStatus(null);
    try {
      const response = await fetch('/api/settings/test-line', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: lineChannelAccessToken })
      });
      const data = await response.json();
      setTestLinePushStatus({ success: data.success, msg: data.message });
    } catch (err) {
      //
    } finally {
      setIsTestingLinePush(false);
    }
  };

  const testMessenger = async () => {
    if (!messengerPageAccessToken || !messengerRecipientId) {
      alert('กรุณากรอก Page Access Token และ Recipient ID ก่อนทดสอบ');
      return;
    }
    setIsTestingMessenger(true);
    setTestMessengerStatus(null);
    try {
      const response = await fetch('/api/settings/test-messenger', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          pageAccessToken: messengerPageAccessToken,
          recipientId: messengerRecipientId
        })
      });
      const data = await response.json();
      setTestMessengerStatus({ success: data.success, msg: data.message });
    } catch (err) {
      setTestMessengerStatus({ success: false, msg: 'การเชื่อมต่อฝั่งเซิร์ฟเวอร์ล้มเหลว' });
    } finally {
      setIsTestingMessenger(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Simulation mode Card */}
      <div className="card" style={{ 
        borderLeft: `5px solid ${simulationMode ? 'var(--accent-blue)' : 'var(--accent-green)'}`,
        background: 'linear-gradient(135deg, var(--bg-card) 0%, rgba(20, 30, 50, 0.4) 100%)'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <ShieldCheck size={36} style={{ color: simulationMode ? 'var(--accent-blue)' : 'var(--accent-green)' }} />
            <div>
              <h3 style={{ fontSize: '1.15rem', fontWeight: '600' }}>
                โหมดการทำจำลองแจ้งเตือน (Simulation Toggle)
              </h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginTop: '0.2rem' }}>
                เมื่อเปิดใช้งาน ระบบหลังบ้านจะไม่ทำการเชื่อมโยงไปที่ API จริงภายนอก แต่จะบันทึกผลการยิงเวลางานลงหน้า Log ของแอปทันที
              </p>
            </div>
          </div>
          <div>
            <label className="switch" style={{ width: '60px', height: '30px' }}>
              <input 
                type="checkbox" 
                checked={simulationMode}
                onChange={handleToggleSimulation}
              />
              <span className="slider" style={{
                borderRadius: '34px',
              }}></span>
            </label>
          </div>
        </div>
      </div>

      <form onSubmit={handleSaveAll} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        {/* Line Notify section */}
        <div className="card">
          <div className="channel-setting-card" style={{ border: 'none', background: 'transparent', padding: 0, margin: 0 }}>
            <div className="channel-header">
              <div className="channel-name line">
                <img 
                  src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' width='24' height='24' fill='%252306C755'%3E%3Cpath d='M12 2C6.48 2 2 5.58 2 10.02c0 2.2 1.09 4.19 2.87 5.58-.16.59-.58 2.15-.66 2.49-.1.38.12.38.26.29.17-.11 2.76-1.87 3.86-2.62a11.13 11.13 0 0 0 3.67.62c5.52 0 10-3.58 10-8.02S17.52 2 12 2z'/%3E%3C/svg%3E" 
                  alt="LINE Logo" 
                  style={{ width: '22px', height: '22px' }}
                />
                <span>LINE Notify Integration (แนะนำสำหรับกลุ่มร้านอาหาร ฟรี!)</span>
              </div>
              <button 
                type="button" 
                className="btn btn-secondary"
                disabled={isTestingLineNotify || simulationMode}
                onClick={testLineNotify}
                style={{ fontSize: '0.8rem', padding: '0.4rem 0.8rem' }}
              >
                {isTestingLineNotify ? 'กำลังส่งทดสอบ...' : 'ส่งข้อความทดสอบ'}
                <Send size={12} style={{ marginLeft: '0.4rem' }} />
              </button>
            </div>

            <div className="form-group" style={{ marginTop: '0.5rem' }}>
              <label>LINE Notify Access Token</label>
              <input 
                type="password" 
                className="form-control"
                value={lineNotifyToken}
                onChange={(e) => setLineNotifyToken(e.target.value)}
                placeholder="กรอก Access Token ของห้องแชท หรือ กลุ่มเป้าหมาย"
                disabled={simulationMode}
              />
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                วิธีการรับ: ไปที่ LINE Notify Bot Developer Page ออกโทเค็น (Token) และเชิญบอท LINE Notify เข้ากลุ่มร้านอาหารของคุณ
              </span>
            </div>

            {testLineNotifyStatus && (
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                fontSize: '0.85rem',
                padding: '0.65rem 1rem',
                borderRadius: '8px',
                backgroundColor: testLineNotifyStatus.success ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                color: testLineNotifyStatus.success ? 'var(--accent-green)' : 'var(--accent-danger)',
                border: '1px solid',
                borderColor: testLineNotifyStatus.success ? 'rgba(16, 185, 129, 0.2)' : 'rgba(239, 68, 68, 0.2)'
              }}>
                {testLineNotifyStatus.success ? <CheckCircle size={16} /> : <XCircle size={16} />}
                <span>{testLineNotifyStatus.msg}</span>
              </div>
            )}
          </div>
        </div>

        {/* LINE Messaging API Section */}
        <div className="card">
          <div className="channel-setting-card" style={{ border: 'none', background: 'transparent', padding: 0, margin: 0 }}>
            <div className="channel-header">
              <div className="channel-name line">
                <img 
                  src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' width='24' height='24' fill='%252306C755'%3E%3Cpath d='M12 2C6.48 2 2 5.58 2 10.02c0 2.2 1.09 4.19 2.87 5.58-.16.59-.58 2.15-.66 2.49-.1.38.12.38.26.29.17-.11 2.76-1.87 3.86-2.62a11.13 11.13 0 0 0 3.67.62c5.52 0 10-3.58 10-8.02S17.52 2 12 2z'/%3E%3C/svg%3E" 
                  alt="LINE Logo" 
                  style={{ width: '22px', height: '22px' }}
                />
                <span>LINE Messaging API (แชทบอทแบบ Push Message & Webhook ตอบรับข้อความ)</span>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem', marginTop: '0.5rem' }}>
              <div className="form-group">
                <label>Channel Access Token</label>
                <input 
                  type="password" 
                  className="form-control"
                  value={lineChannelAccessToken}
                  onChange={(e) => setLineChannelAccessToken(e.target.value)}
                  placeholder="Channel Access Token (Long-Lived)"
                  disabled={simulationMode}
                />
              </div>

              <div className="form-group">
                <label>Target User/Group ID</label>
                <input 
                  type="text" 
                  className="form-control"
                  value={lineUserId}
                  onChange={(e) => setLineUserId(e.target.value)}
                  placeholder="ID ของผู้ใช้ หรือกลุ่มเริ่มต้น (เช่น U12345...)"
                  disabled={simulationMode}
                />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '1.25rem', marginTop: '0.5rem' }}>
              <div className="form-group">
                <label>Channel Secret</label>
                <input 
                  type="password" 
                  className="form-control"
                  value={lineChannelSecret}
                  onChange={(e) => setLineChannelSecret(e.target.value)}
                  placeholder="Channel Secret จาก LINE Developers Console"
                  disabled={simulationMode}
                />
              </div>
            </div>

            <div className="form-group" style={{ marginTop: '0.5rem' }}>
              <label>LINE Webhook URL (นำลิงก์นี้ไปใส่ที่หน้า LINE Developers Console เพื่อเปิดรับคำสั่ง 'คลัง' / 'สรุปยอด')</label>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <input 
                  type="text" 
                  className="form-control" 
                  value={typeof window !== 'undefined' ? `${window.location.origin}/api/line/webhook` : '/api/line/webhook'} 
                  readOnly 
                  style={{ backgroundColor: 'rgba(255,255,255,0.03)', color: 'var(--text-secondary)', fontSize: '0.85rem' }}
                />
                <button 
                  type="button" 
                  className="btn btn-secondary"
                  onClick={() => {
                    const url = typeof window !== 'undefined' ? `${window.location.origin}/api/line/webhook` : '';
                    navigator.clipboard.writeText(url);
                    alert('คัดลอก Webhook URL เรียบร้อยแล้ว!');
                  }}
                  style={{ whiteSpace: 'nowrap', fontSize: '0.85rem' }}
                >
                  คัดลอกลิงก์ Webhook
                </button>
              </div>
            </div>

            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '-0.25rem', display: 'block' }}>
              ใช้สำหรับรับเหตุการณ์แชทหาพนักงานรายตัวหรือเข้ากรุ๊ป เพื่อรายงานยอดวัตถุดิบคงเหลือและของเสียเปรียบเทียบ POS
            </span>
          </div>
        </div>

        {/* Google Sheets Integration Section */}
        <div className="card">
          <div className="channel-setting-card" style={{ border: 'none', background: 'transparent', padding: 0, margin: 0 }}>
            <div className="channel-header">
              <div className="channel-name" style={{ color: 'var(--accent-green)', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <img 
                  src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' width='24' height='24' fill='%2523107C41'%3E%3Cpath d='M14 2H6c-1.1 0-1.99.9-1.99 2L4 20c0 1.1.89 2 1.99 2H18c1.1 0 2-.9 2-2V8l-6-6zm2 16H8v-2h8v2zm0-4H8v-2h8v2zm-3-5V3.5L18.5 9H13z'/%3E%3C/svg%3E" 
                  alt="Google Sheets Logo" 
                  style={{ width: '22px', height: '22px' }}
                />
                <span>Google Sheets Integration (บันทึกคลังวัตถุดิบลงตารางสะสม)</span>
              </div>
              <button 
                type="button" 
                className="btn btn-secondary"
                disabled={isTestingGoogleSheet}
                onClick={testGoogleSheet}
                style={{ fontSize: '0.8rem', padding: '0.4rem 0.8rem' }}
              >
                {isTestingGoogleSheet ? 'กำลังส่งทดสอบ...' : 'ส่งข้อมูลทดสอบ'}
                <Send size={12} style={{ marginLeft: '0.4rem' }} />
              </button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem', marginTop: '0.5rem' }}>
              <div className="form-group">
                <label>Google Sheets Web App URL (Apps Script Webhook URL)</label>
                <input 
                  type="text" 
                  className="form-control"
                  value={googleSheetWebhookUrl}
                  onChange={(e) => setGoogleSheetWebhookUrl(e.target.value)}
                  placeholder="https://script.google.com/macros/s/xxxx/exec"
                />
              </div>

              <div className="form-group">
                <label>Google Drive Folder ID (ไอดีโฟลเดอร์สำหรับเก็บภาพบิล)</label>
                <input 
                  type="text" 
                  className="form-control"
                  value={driveFolderId}
                  onChange={(e) => setDriveFolderId(e.target.value)}
                  placeholder="ปล่อยว่างได้เพื่อสร้างโฟลเดอร์อัตโนมัติ"
                />
              </div>
            </div>

            {testGoogleSheetStatus && (
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                fontSize: '0.85rem',
                padding: '0.65rem 1rem',
                borderRadius: '8px',
                backgroundColor: testGoogleSheetStatus.success ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                color: testGoogleSheetStatus.success ? 'var(--accent-green)' : 'var(--accent-danger)',
                border: '1px solid',
                borderColor: testGoogleSheetStatus.success ? 'rgba(16, 185, 129, 0.2)' : 'rgba(239, 68, 68, 0.2)',
                marginBottom: '1rem'
              }}>
                {testGoogleSheetStatus.success ? <CheckCircle size={16} /> : <XCircle size={16} />}
                <span>{testGoogleSheetStatus.msg}</span>
              </div>
            )}

            <div style={{ padding: '1rem', backgroundColor: 'rgba(255, 255, 255, 0.015)', borderRadius: '12px', border: '1px solid var(--border-card)' }}>
              <h4 style={{ fontSize: '0.85rem', fontWeight: '600', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <HelpCircle size={14} style={{ color: 'var(--accent-green)' }} />
                <span>ขั้นตอนการติดตั้งสคริปต์ใน Google Sheets:</span>
              </h4>
              <ol style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', paddingLeft: '1.2rem', marginBottom: '0.75rem', lineHeight: '1.4' }}>
                <li>เปิด Google Sheets ที่ต้องการใช้งาน &rarr; ไปที่เมนู <strong>ส่วนขยาย (Extensions)</strong> &rarr; <strong>Apps Script</strong></li>
                <li>ลบโค้ดเริ่มต้นออก ทั้งหมด แล้วคัดลอกโค้ดด้านล่างไปวางแทนที่</li>
                <li>กดปุ่ม <strong>ทำให้ใช้งานได้ (Deploy)</strong> &rarr; <strong>การจัดการทำให้ใช้งานได้ใหม่ (New deployment)</strong></li>
                <li>เลือกประเภทเป็น <strong>เว็บแอป (Web app)</strong> &rarr; ตั้งค่าผู้มีสิทธิ์เข้าถึงเป็น <strong>ทุกคน (Anyone)</strong></li>
                <li>กด Deploy และก๊อปปี้ <strong>URL ของเว็บแอป</strong> นำมาวางลงในช่องป้อนข้อมูลด้านบน</li>
              </ol>
              <label style={{ fontSize: '0.75rem', fontWeight: '500', color: 'var(--text-muted)', display: 'block', marginBottom: '0.25rem' }}>โค้ดสำหรับนำไปวางใน Apps Script (คลิกเพื่อคัดลอก):</label>
              <textarea
                className="form-control"
                readOnly
                style={{ fontFamily: 'monospace', fontSize: '0.75rem', height: '140px', backgroundColor: 'rgba(0,0,0,0.25)', border: '1px solid var(--border-card)', color: 'var(--text-secondary)' }}
                value={`function doPost(e) {
  try {
    var data = JSON.parse(e.postData.contents);
    
    // ตั้งค่าเริ่มต้นของรูปภาพเป็นไม่มีข้อมูล
    var driveFileUrl = '-';
    
    // ตรวจสอบและแปลงรูปภาพเพื่อบันทึกเข้า Google Drive
    if (data.imageBase64 && data.imageBase64.indexOf('data:image/') === 0) {
      try {
        var matches = data.imageBase64.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
        if (matches && matches.length === 3) {
          var mimeType = matches[1];
          var base64Data = matches[2];
          var decodedBytes = Utilities.base64Decode(base64Data);
          
          var filename = 'bill-' + (data.name || 'item') + '-' + Date.now() + '.' + (mimeType.split('/')[1] || 'jpeg');
          var blob = Utilities.newBlob(decodedBytes, mimeType, filename);
          
          // ค้นหาโฟลเดอร์ตามไอดีที่กำหนด หากไม่พบข้อผิดพลาดหรือไม่ได้ระบุ จะค้นหาหรือสร้างชื่อ Restaurant Bills แทน
          var folder;
          if (data.driveFolderId) {
            try {
              folder = DriveApp.getFolderById(data.driveFolderId);
            } catch (folderErr) {
              var folders = DriveApp.getFoldersByName('Restaurant Bills');
              if (folders.hasNext()) {
                folder = folders.next();
              } else {
                folder = DriveApp.createFolder('Restaurant Bills');
              }
            }
          } else {
            var folders = DriveApp.getFoldersByName('Restaurant Bills');
            if (folders.hasNext()) {
              folder = folders.next();
            } else {
              folder = DriveApp.createFolder('Restaurant Bills');
            }
          }
          
          // สร้างไฟล์และตั้งสิทธิ์ให้ทุกคนเข้าถึงรูปภาพได้
          var file = folder.createFile(blob);
          file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
          driveFileUrl = file.getUrl();
        }
      } catch (imageErr) {
        driveFileUrl = 'Error saving image: ' + imageErr.toString();
      }
    }
    
    // บันทึกแถวข้อมูลลงใน Google Sheet
    var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
    sheet.appendRow([
      new Date(data.date || new Date()),
      data.name,
      data.category,
      data.quantity,
      data.unit,
      data.cost,
      data.billNumber || '-',
      data.portionSize,
      data.portionUnit,
      data.associatedPosItem || data.name,
      driveFileUrl
    ]);
    
    return ContentService.createTextOutput(JSON.stringify({
      success: true, 
      imageUrl: driveFileUrl
    })).setMimeType(ContentService.MimeType.JSON);
    
  } catch(err) {
    return ContentService.createTextOutput(JSON.stringify({
      success: false, 
      error: err.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  }
}`}
                onClick={(e) => {
                  e.target.select();
                  navigator.clipboard.writeText(e.target.value);
                  alert('คัดลอกโค้ดสคริปต์สำหรับวางใน Google Sheets เรียบร้อยแล้ว!');
                }}
                title="คลิกเพื่อคัดลอกโค้ดทั้งหมด"
              />
            </div>
          </div>
        </div>

        {/* Facebook Messenger Section */}
        <div className="card">
          <div className="channel-setting-card" style={{ border: 'none', background: 'transparent', padding: 0, margin: 0 }}>
            <div className="channel-header">
              <div className="channel-name messenger">
                <img 
                  src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' width='24' height='24' fill='%25230084FF'%3E%3Cpath d='M12 2.04C6.5 2.04 2 6.18 2 11.28c0 2.91 1.45 5.51 3.71 7.15.19.14.31.37.31.61v2.18c0 .35.39.57.69.4l2.45-1.4a.78.78 0 0 1 .46-.08c.76.12 1.56.19 2.38.19 5.5 0 10-4.14 10-9.24s-4.5-9.24-10-9.24zm1.14 11.83l-2.07-2.21-4.04 2.21 4.44-4.72 2.11 2.21 4-2.21-4.44 4.72z'/%3E%3C/svg%3E" 
                  alt="Messenger Logo" 
                  style={{ width: '22px', height: '22px' }}
                />
                <span>Facebook Messenger Integration (Meta Pages API)</span>
              </div>
              <button 
                type="button" 
                className="btn btn-secondary"
                disabled={isTestingMessenger || simulationMode}
                onClick={testMessenger}
                style={{ fontSize: '0.8rem', padding: '0.4rem 0.8rem' }}
              >
                {isTestingMessenger ? 'กำลังส่งทดสอบ...' : 'ส่งข้อความทดสอบ'}
                <Send size={12} style={{ marginLeft: '0.4rem' }} />
              </button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem', marginTop: '0.5rem' }}>
              <div className="form-group">
                <label>Page Access Token</label>
                <input 
                  type="password" 
                  className="form-control"
                  value={messengerPageAccessToken}
                  onChange={(e) => setMessengerPageAccessToken(e.target.value)}
                  placeholder="กรอก Token ของ Facebook Page ที่สร้างบอท"
                  disabled={simulationMode}
                />
              </div>

              <div className="form-group">
                <label>Recipient User PSID</label>
                <input 
                  type="text" 
                  className="form-control"
                  value={messengerRecipientId}
                  onChange={(e) => setMessengerRecipientId(e.target.value)}
                  placeholder="กรอก Page-Scoped User ID ของพนักงาน"
                  disabled={simulationMode}
                />
              </div>
            </div>

            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '-0.5rem', display: 'block' }}>
              ต้องการแอปของ Facebook Developers ที่เชื่อมโยงเข้าเพจและเปิดการทำงานของบอทเพื่อส่งข้อความ Push (Messenger Send API)
            </span>

            {testMessengerStatus && (
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                fontSize: '0.85rem',
                padding: '0.65rem 1rem',
                borderRadius: '8px',
                backgroundColor: testMessengerStatus.success ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                color: testMessengerStatus.success ? 'var(--accent-green)' : 'var(--accent-danger)',
                border: '1px solid',
                borderColor: testMessengerStatus.success ? 'rgba(16, 185, 129, 0.2)' : 'rgba(239, 68, 68, 0.2)'
              }}>
                {testMessengerStatus.success ? <CheckCircle size={16} /> : <XCircle size={16} />}
                <span>{testMessengerStatus.msg}</span>
              </div>
            )}
          </div>
        </div>

        {/* Buttons bottom */}
        <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', marginTop: '1rem' }}>
          <button type="submit" className="btn btn-primary" style={{ padding: '0.75rem 2rem', fontSize: '0.95rem' }}>
            บันทึกการเชื่อมต่อทั้งหมด
          </button>
        </div>
      </form>
    </div>
  );
}
