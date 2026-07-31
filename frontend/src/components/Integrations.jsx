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
                <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.25rem', display: 'block' }}>
                  💡 สามารถป้อนเฉพาะไอดี หรือวางลิงก์ยาวของโฟลเดอร์ตรง ๆ ก็ได้ (ระบบจะดึงไอดีออกมาใช้งานให้อัตโนมัติ)
                </span>
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
                value={`function doGet(e) {
  try {
    var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
    setupSheetTemplate(sheet);
    return ContentService.createTextOutput("สร้างตารางรายการคอลัมน์บัญชีร้านสำเร็จเรียบร้อยแล้ว! สามารถเปิดดูใน Google Sheet ของคุณได้เลยครับ").setMimeType(ContentService.MimeType.TEXT);
  } catch (err) {
    return ContentService.createTextOutput("เกิดข้อผิดพลาด: " + err.toString()).setMimeType(ContentService.MimeType.TEXT);
  }
}

function doPost(e) {
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
          
          var file = folder.createFile(blob);
          file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
          driveFileUrl = file.getUrl();
        }
      } catch (imageErr) {
        driveFileUrl = 'Error saving image: ' + imageErr.toString();
      }
    }
    
    var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
    
    var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
    
    // ตรวจสอบว่าแผ่นงานมีหัวตารางคอลัมน์แล้วหรือยัง หากแผ่นงานว่างเปล่าจริงๆ ให้สร้างอัตโนมัติ
    if (sheet.getLastColumn() === 0 || (sheet.getLastRow() === 1 && (sheet.getRange(1, 1).getValue() === "" || sheet.getRange(1, 1).getValue() === null))) {
      setupSheetTemplate(sheet);
    }
    
    var lastCol = sheet.getLastColumn();
    var headersRow1 = sheet.getRange(1, 1, 1, lastCol).getValues()[0];
    var headersRow2 = sheet.getRange(2, 1, 1, lastCol).getValues()[0];
    var headersRow3 = sheet.getRange(3, 1, 1, lastCol).getValues()[0];
    
    // สร้างอาร์เรย์สรุปชื่อรายการของแต่ละคอลัมน์
    var columns = [];
    for (var i = 0; i < lastCol; i++) {
      var itemVal = (headersRow3[i] || '').toString().trim();
      var catVal = (headersRow2[i] || '').toString().trim();
      var r1Val = (headersRow1[i] || '').toString().trim();
      columns.push(itemVal !== '' ? itemVal : (catVal !== '' ? catVal : r1Val));
    }
    
    // ค้นหาคอลัมน์คีย์ระบบแบบไดนามิก
    var piecesColIndex = -1;
    var discountColIndex = -1;
    var netPriceColIndex = -1;
    var receivedColIndex = -1;
    var checkColIndex = -1;
    var imageColIndex = -1;
    
    for (var i = 0; i < columns.length; i++) {
      var colName = (columns[i] || '').toString().trim();
      if (colName === 'จำนวนชิ้น') piecesColIndex = i + 1;
      else if (colName === 'ส่วนลด') discountColIndex = i + 1;
      else if (colName === 'ราคาสุทธิ') netPriceColIndex = i + 1;
      else if (colName === 'รับเงินแล้ว') receivedColIndex = i + 1;
      else if (colName === 'ตรวจสอบ') checkColIndex = i + 1;
      else if (colName === 'รูปภาพบิล') imageColIndex = i + 1;
    }
    
    // ค้นหาคอลัมน์ที่ตรงกับชื่อสินค้า (ข้ามหัวตารางระบบ)
    var systemHeaders = ['วันที่สั่งซื้อ', 'ยอดรวมบิล', 'จำนวน', 'จำนวนชิ้น', 'ส่วนลด', 'ราคาสุทธิ', 'รับเงินแล้ว', 'ตรวจสอบ', 'รูปภาพบิล'];
    var colIndex = -1;
    var itemNameLower = (data.name || '').trim().toLowerCase();
    
    // 1. ค้นหาแบบตรงตัวก่อน (Exact Match)
    for (var i = 0; i < columns.length; i++) {
      var h = (columns[i] || '').toString().trim();
      if (systemHeaders.indexOf(h) !== -1) continue;
      if (h.toLowerCase() === itemNameLower) {
        colIndex = i + 1;
        break;
      }
    }
    
    // 2. ค้นหาแบบใกล้เคียงหากไม่เจอตรงตัว (Partial Match)
    if (colIndex === -1 && itemNameLower) {
      for (var i = 0; i < columns.length; i++) {
        var h = (columns[i] || '').toString().trim();
        if (systemHeaders.indexOf(h) !== -1) continue;
        var hLower = h.toLowerCase();
        if (itemNameLower.indexOf(hLower) !== -1 || hLower.indexOf(itemNameLower) !== -1) {
          colIndex = i + 1;
          break;
        }
      }
    }
    
    // 3. หากยังไม่พบอีก ให้หาช่อง 'อื่นๆ'
    if (colIndex === -1) {
      for (var i = 0; i < columns.length; i++) {
        if ((columns[i] || '').toString().trim() === 'อื่นๆ') {
          colIndex = i + 1;
          break;
        }
      }
    }
    
    // 🔍 ตรวจสอบสิทธิ์และตัดสินใจว่าจะเขียนแถวเดิมหรือแถวใหม่ หรือเริ่มเดือนใหม่
    var lastRow = getLastDataRow(sheet);
    var incomingDate = new Date(data.date || new Date());
    var writeToSameRow = false;
    var isNewMonth = false;
    
    if (lastRow >= 4) {
      // ค้นหาแถวที่มีวันที่ล่าสุดในตารางเพื่อเทียบเดือน
      var lastDateVal = null;
      for (var r = lastRow; r >= 4; r--) {
        var cellVal = sheet.getRange(r, 1).getValue();
        if (cellVal && !isNaN(new Date(cellVal).getTime())) {
          lastDateVal = new Date(cellVal);
          break;
        }
      }
      
      if (lastDateVal) {
        var lastYear = lastDateVal.getFullYear();
        var lastMonth = lastDateVal.getMonth();
        var inYear = incomingDate.getFullYear();
        var inMonth = incomingDate.getMonth();
        
        if (inYear > lastYear || (inYear === lastYear && inMonth > lastMonth)) {
          isNewMonth = true;
        } else if (lastYear === inYear && lastMonth === inMonth) {
          // หากเป็นวันเดียวกัน ตรวจสอบว่าช่องราคาสินค้านี้ในแถวนี้ว่างหรือไม่
          var date1 = lastDateVal;
          var date2 = incomingDate;
          if (date1.getFullYear() === date2.getFullYear() &&
              date1.getMonth() === date2.getMonth() &&
              date1.getDate() === date2.getDate()) {
            if (colIndex !== -1 && colIndex <= lastCol) {
              var targetVal = sheet.getRange(lastRow, colIndex).getValue();
              if (targetVal === "" || targetVal === null || targetVal === undefined || targetVal === 0 || targetVal.toString().trim() === "") {
                writeToSameRow = true;
              }
            }
          }
        }
      }
    }
    
    if (writeToSameRow && !isNewMonth) {
      // 1. ใส่ราคาในช่องคอลัมน์สินค้าที่ถูกต้อง
      if (colIndex !== -1 && colIndex <= lastCol) {
        sheet.getRange(lastRow, colIndex).setValue(data.cost || 0);
      }
      
      // 2. บวกยอดรวมบิลเพิ่ม
      var currentCost = parseFloat(sheet.getRange(lastRow, 2).getValue()) || 0;
      sheet.getRange(lastRow, 2).setValue(currentCost + (data.cost || 0));
      
      // 3. บวกจำนวนสินค้าเพิ่ม
      var currentQty = parseFloat(sheet.getRange(lastRow, 3).getValue()) || 0;
      sheet.getRange(lastRow, 3).setValue(currentQty + (data.quantity || 0));
      
      // 3.1 บวกจำนวนชิ้นเพิ่ม (หากมีคอลัมน์จำนวนชิ้น)
      if (piecesColIndex !== -1) {
        var currentPieces = parseFloat(sheet.getRange(lastRow, piecesColIndex).getValue()) || 0;
        sheet.getRange(lastRow, piecesColIndex).setValue(currentPieces + (data.pieces || 0));
      }
      
      // 4. บวกส่วนลดเพิ่ม (หากมี)
      if (discountColIndex !== -1) {
        var currentDiscount = parseFloat(sheet.getRange(lastRow, discountColIndex).getValue()) || 0;
        sheet.getRange(lastRow, discountColIndex).setValue(currentDiscount + (data.discount || 0));
      }
      
      // 5. บวกรับเงินแล้วเพิ่ม (หากมี)
      if (receivedColIndex !== -1) {
        var currentReceived = parseFloat(sheet.getRange(lastRow, receivedColIndex).getValue()) || 0;
        var newReceivedItem = data.received !== undefined ? data.received : (data.cost || 0) - (data.discount || 0);
        sheet.getRange(lastRow, receivedColIndex).setValue(currentReceived + newReceivedItem);
      }
      
      // 6. บันทึกรูปภาพ (หากมี)
      if (driveFileUrl !== '-' && imageColIndex !== -1) {
        var currentImg = sheet.getRange(lastRow, imageColIndex).getValue();
        if (currentImg === "" || currentImg === null || currentImg === undefined || currentImg === "-" || currentImg === 0 || currentImg.toString().trim() === "") {
          sheet.getRange(lastRow, imageColIndex).setValue(driveFileUrl);
        } else {
          sheet.getRange(lastRow, imageColIndex).setValue(currentImg + ", " + driveFileUrl);
        }
      }
    } else {
      // หากเป็นเดือนใหม่: เว้น 3 แถวว่าง และสร้างหัวตารางเดือนใหม่ก่อน
      var nextRow = lastRow + 1;
      if (isNewMonth) {
        var newHeaderStartRow = lastRow + 4; // เว้น 3 แถวว่าง (lastRow+1, lastRow+2, lastRow+3)
        var monthStr = getThaiMonthYearFromDate(incomingDate);
        createMonthlyHeaderBlock(sheet, newHeaderStartRow, monthStr);
        nextRow = newHeaderStartRow + 3; // แถวข้อมูลใหม่ถัดจากหัวตารางเดือนใหม่
      } else {
        if (nextRow < 4) {
          nextRow = 4;
        }
      }
      
      var dataColsLength = (checkColIndex !== -1) ? checkColIndex : (colIndex !== -1 ? colIndex + 3 : lastCol);
      var newRow = [];
      for (var i = 0; i < dataColsLength; i++) {
        newRow.push('');
      }
      
      var maxRows = sheet.getMaxRows();
      if (nextRow > maxRows) {
        sheet.insertRowsAfter(maxRows, nextRow - maxRows + 1);
      }
      
      newRow[0] = new Date(data.date || new Date());
      newRow[1] = data.cost || 0;
      newRow[2] = data.quantity || 0;
      if (piecesColIndex !== -1) {
        newRow[piecesColIndex - 1] = data.pieces || 0;
      }
      
      // ใส่ราคาวัตถุดิบลงในคอลัมน์สินค้าที่ถูกต้อง
      if (colIndex !== -1 && colIndex <= lastCol) {
        newRow[colIndex - 1] = data.cost || 0;
      }
      
      // ใส่ลิงก์รูปภาพในคอลัมน์รูปภาพบิล
      if (imageColIndex !== -1) {
        newRow[imageColIndex - 1] = driveFileUrl;
      }
      
      // ใส่ค่าและสูตรสำหรับ ส่วนลด, ราคาสุทธิ, รับเงินแล้ว, ตรวจสอบ
      if (discountColIndex !== -1) {
        newRow[discountColIndex - 1] = data.discount || 0;
      }
      if (netPriceColIndex !== -1) {
        var discountLetter = getColumnLetter(discountColIndex);
        newRow[netPriceColIndex - 1] = "=B" + nextRow + "-" + discountLetter + nextRow;
      }
      if (receivedColIndex !== -1) {
        newRow[receivedColIndex - 1] = data.received !== undefined ? data.received : (data.cost || 0) - (data.discount || 0);
      }
      if (checkColIndex !== -1) {
        var netLetter = getColumnLetter(netPriceColIndex);
        var receivedLetter = getColumnLetter(receivedColIndex);
        newRow[checkColIndex - 1] = "=" + receivedLetter + nextRow + "=" + netLetter + nextRow;
      }
      
      sheet.getRange(nextRow, 1, 1, newRow.length).setValues([newRow]);
    }
    
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
}

function getLastDataRow(sheet) {
  var values = sheet.getRange("A1:A").getValues();
  for (var i = values.length - 1; i >= 0; i--) {
    if (values[i][0] !== "" && values[i][0] !== null && values[i][0] !== undefined) {
      return i + 1;
    }
  }
  return 3;
}

function getColumnLetter(colIndex) {
  var temp, letter = "";
  while (colIndex > 0) {
    temp = (colIndex - 1) % 26;
    letter = String.fromCharCode(65 + temp) + letter;
    colIndex = (colIndex - temp - 1) / 26;
  }
  return letter;
}

function getThaiMonthYearFromDate(d) {
  var months = ["ม.ค.", "ก.พ.", "มี.ค.", "เม.ย.", "พ.ค.", "มิ.ย.", "ก.ค.", "ส.ค.", "ก.ย.", "ต.ค.", "พ.ย.", "ธ.ค."];
  var month = months[d.getMonth()];
  var year = d.getFullYear() + 543;
  return month + " " + year;
}

function getThaiMonthYear() {
  return getThaiMonthYearFromDate(new Date());
}

function createMonthlyHeaderBlock(sheet, startRow, monthStr) {
  var row1 = ['วันที่สั่งซื้อ (' + monthStr + ')', 'ยอดรวมบิล', 'จำนวน', 'จำนวนชิ้น'];
  var row2 = ['', '', '', ''];
  var row3 = ['', '', '', ''];
  
  var schema = [
    { category: 'เครื่องครัว/ของแห้ง', color: '#d9e1f2', items: ['น้ำตาลปี๊บ', 'น้ำตาลทราย', 'งาขาว', 'ชูรส', 'น้ำปลา', 'น้ำส้มสายชู', 'น้ำปลาร้า', 'น้ำมัน', 'น้ำมันงา', 'ซอสมะเขือ', 'ซอสพริก', 'มายองเนส', 'น้ำจิ้มบ๊วย', 'ซอสสูตร5', 'ซอสหอยนางรม', 'ซีอิ๊วฉลากแดง', 'ซีอิ๊วขาว สูตร1', 'ซอสฝาเขียว', 'เบกกิ้งโซดา', 'ไวไว', 'มาม่า', 'หมี่หยก', 'วุ้นเส้น', 'ข้าวสาร', 'ข้าวคั่ว', 'ผงมะนาว', 'กระเทียมดอง', 'น้ำมะขาม', 'พริกป่น', 'โชยุ', 'วาซาบิ', 'เกลือ', 'น้ำยาล้างจาน', 'ผงซักฟอก', 'ถุงขยะ 18*20', 'ถุงหิ้ว 12*26', 'ถุงร้อน 8*12', 'ถุงหิ้ว 8*16', 'ไข่ไก่', 'เต้าหู้ไข่'] },
    { category: 'ผัก', color: '#00ffff', items: ['กะหล่ำ', 'เห็ดเข็ม', 'แครอท', 'ผักบุ้ง', 'ข้าวโพด', 'ต้นหอม', 'ผักชี', 'ตั้งโอ๋', 'กระเทียม', 'กระเทียมเจียว', 'พริกไทย', 'พริกเขียว', 'พริกแดง', 'กุ้งแห้ง', 'มะละกอ', 'มะนาว', 'หอมใหญ่', 'หอมแดง', 'มะเขือเทศ', 'ถั่วฝักยาว', 'ถั่วตำไทย', 'ใบกะเพรา', 'ข่า', 'ตะไคร้', 'ใบมะกรูด', 'ผักชีใบเลื่อย', 'โหระพา', 'ใบเตย', 'เม็ดมะม่วง'] },
    { category: 'เนื้อหมู / ไก่', color: '#00ff00', items: ['เนื้อหมู', 'สามชั้น', 'สันคอ', 'หมูสับ', 'ตับ', 'เบคอน', 'เอ็นไก่', 'ปีกไก่', 'มันหมูเจียว', 'กระดูกหมู', 'สะโพกหมู', 'มันก้อน'] },
    { category: 'เนื้อวัว', color: '#b4c6e7', items: ['สันคอ', 'เสือ', 'สันใน', 'เนื้อออส', 'ผ้าขี้ริ้ว', 'สามชั้น', 'สันนอก'] },
    { category: 'ทะเล', color: '#c6e0b4', items: ['หมึกสด', 'หมึกหมูกะทะ', 'หมึกกรอบ', 'กุ้ง', 'กุ้ง หมูกะทะ', 'ปูอัด', 'เต้าหู้ปลา', 'กะพรุน'] },
    { category: 'ของทอด', color: '#f8cbad', items: ['เกี๊ยวซ่า', 'เฟรนฟราย', 'นักเก็ต', 'ไก่กรอบ', 'แป้งทอดกรอบ', 'เอโร่ อิบิโรลไส้กุ้งแช่แข็ง', 'เต้าหู้ชีส'] },
    { category: 'น้ำจิ้ม', color: '#b4a7d6', items: ['วดี', 'BBQ'] },
    { category: 'เครื่องดื่ม', color: '#ffff00', items: ['น้ำอัดลม', 'โซดา', 'น้ำเปล่า', 'หลอดน้ำงอ', 'เบียร์ช้าง', 'เบียร์ลีโอ', 'เบียร์สิงห์', 'รีแบน', 'รีกลม', 'ขนมหวาน', 'ไอติม'] },
    { category: 'Asset', color: '#ffffff', items: ['แปรงขัดกระทะ', 'สเปรย์กำจัดแมลง', 'กาวดักแมลงวัน', 'น้ำยาถูพื้น', 'น้ำยาล้างจาน', 'ล้างห้องน้ำ', 'สบู่ล้างมือ', 'น้ำยาเช็ดโต๊ะ', 'ทิชชู่', 'หลอดงอ', 'ตะเกียบไม้', 'กระดาษความร้อน', 'อื่นๆ'] },
    { category: 'เงินเดือนพนักงาน + ค่าเช่าร้าน + กับข้าวพนักงาน', color: '#ffffff', items: ['เงินเดือนพนักงาน + ค่าเช่าร้าน + กับข้าวพนักงาน'] },
    { category: 'ค่าส่งของ', color: '#ffffff', items: ['ค่าส่งของ'] },
    { category: 'น้ำแข็ง', color: '#ffffff', items: ['หลอด', 'บด'] },
    { category: 'แก๊ส', color: '#ffffff', items: ['แก๊ส'] },
    { category: 'ถ่าน', color: '#ffffff', items: ['ถ่าน'] },
    { category: 'ค่าน้ำ + ค่าไฟ + เน็ต', color: '#ffffff', items: ['ค่าน้ำ + ค่าไฟ + เน็ต'] },
    { category: 'การตลาด/ปรับปรุงร้าน', color: '#ffffff', items: ['การตลาด/ปรับปรุงร้าน'] },
    { category: 'ค่าบริการ', color: '#ffffff', items: ['ค่าบริการ'] },
    { category: 'ภาพถ่ายบิล', color: '#ffffff', items: ['รูปภาพบิล'] }
  ];
  
  var colIndex = 5;
  var mergeRangesRow2 = [];
  var verticalMergeCols = [];
  
  var cogsEndCol = 4;
  for (var i = 0; i <= 8; i++) {
    cogsEndCol += schema[i].items.length;
  }
  
  for (var i = 0; i < schema.length; i++) {
    var cat = schema[i];
    var numItems = cat.items.length;
    var row1Value = (i >= 9) ? 'ค่าบริการ' : '';
    for (var j = 0; j < numItems; j++) {
      row1.push(row1Value);
    }
    row2.push(cat.category);
    for (var j = 1; j < numItems; j++) {
      row2.push('');
    }
    if (numItems > 1) {
      for (var k = 0; k < numItems; k++) {
        row3.push(cat.items[k]);
      }
      mergeRangesRow2.push({
        startCol: colIndex,
        endCol: colIndex + numItems - 1,
        color: cat.color
      });
    } else {
      row3.push('');
      verticalMergeCols.push({
        col: colIndex,
        color: cat.color
      });
    }
    colIndex += numItems;
  }
  
  row1.push('ส่วนลด', 'ราคาสุทธิ', 'รับเงินแล้ว', 'ตรวจสอบ');
  row2.push('', '', '', '');
  row3.push('', '', '', '');
  
  var totalCols = row1.length;
  var maxRows = sheet.getMaxRows();
  if (startRow + 3 > maxRows) {
    sheet.insertRowsAfter(maxRows, (startRow + 3) - maxRows + 1);
  }
  
  sheet.getRange(startRow, 1, 1, totalCols).setValues([row1]);
  sheet.getRange(startRow + 1, 1, 1, totalCols).setValues([row2]);
  sheet.getRange(startRow + 2, 1, 1, totalCols).setValues([row3]);
  
  for (var c = 1; c <= 4; c++) {
    sheet.getRange(startRow, c, 3, 1).merge();
  }
  
  for (var c = colIndex; c < colIndex + 4; c++) {
    sheet.getRange(startRow, c, 3, 1).merge();
  }
  
  var cogsRange = sheet.getRange(startRow, 5, 1, cogsEndCol - 5 + 1);
  cogsRange.merge();
  cogsRange.setBackground('#00ff00');
  
  var serviceRange = sheet.getRange(startRow, cogsEndCol + 1, 1, colIndex - 1 - cogsEndCol);
  serviceRange.merge();
  serviceRange.setBackground('#00ffff');
  
  for (var m = 0; m < mergeRangesRow2.length; m++) {
    var r = mergeRangesRow2[m];
    var range = sheet.getRange(startRow + 1, r.startCol, 1, r.endCol - r.startCol + 1);
    range.merge();
    range.setBackground(r.color);
  }
  
  for (var v = 0; v < verticalMergeCols.length; v++) {
    var colInfo = verticalMergeCols[v];
    var range = sheet.getRange(startRow + 1, colInfo.col, 2, 1);
    range.merge();
    range.setBackground(colInfo.color);
  }
  
  var headerRange = sheet.getRange(startRow, 1, 3, totalCols);
  headerRange.setFontColor('#000000');
  headerRange.setFontWeight('bold');
  headerRange.setHorizontalAlignment('center');
  headerRange.setVerticalAlignment('middle');
  headerRange.setBorder(true, true, true, true, true, true);
  
  sheet.getRange(startRow, colIndex, 3, 1).setBackground("#f2f2f2");
  sheet.getRange(startRow, colIndex + 1, 3, 1).setBackground("#00ffff");
  sheet.getRange(startRow, colIndex + 2, 3, 1).setBackground("#f2f2f2");
  sheet.getRange(startRow, colIndex + 3, 3, 1).setBackground("#f2f2f2");
  
  sheet.setRowHeight(startRow, 30);
  sheet.setRowHeight(startRow + 1, 35);
  sheet.setRowHeight(startRow + 2, 35);

  // ตั้งค่ากลุ่มคอลัมน์ (Grouping) เพื่อให้ยุบได้แบบในภาพ
  for (var m = 0; m < mergeRangesRow2.length; m++) {
    var r = mergeRangesRow2[m];
    if (r.startCol < r.endCol) {
      try {
        sheet.getRange(startRow, r.startCol + 1, 1, r.endCol - r.startCol).shiftColumnGroupDepth(1);
      } catch (e) {
        // ข้ามหากติดปัญหา
      }
    }
  }
  
  try {
    sheet.collapseAllColumnGroups();
  } catch (e) {
    // ข้ามหากไม่สามารถยุบได้
  }

  // --- การสร้างตารางสรุปด้านข้างสีเขียว (สรุปรายจ่ายประจำเดือน) ---
  var summaryStartCol = colIndex + 4;
  
  function getRangeFormula(startIdx, endIdx) {
    var sCol = 5;
    for (var i = 0; i < startIdx; i++) {
      sCol += schema[i].items.length;
    }
    var eCol = sCol;
    for (var i = startIdx; i <= endIdx; i++) {
      eCol += schema[i].items.length;
    }
    eCol = eCol - 1;
    
    var startLetter = getColumnLetter(sCol);
    var endLetter = getColumnLetter(eCol);
    return "=SUM(" + startLetter + ":" + endLetter + ")";
  }
  
  var discountLetter = getColumnLetter(colIndex);
  var netLetter = getColumnLetter(colIndex + 1);
  var receivedLetter = getColumnLetter(colIndex + 2);
  var checkLetter = getColumnLetter(colIndex + 3);
  
  // กำหนดจัดฟอร์แมตข้อมูลอัตโนมัติสำหรับทั้งคอลัมน์
  try {
    sheet.getRange("B4:B").setNumberFormat("#,##0.00");
    sheet.getRange(discountLetter + "4:" + discountLetter).setNumberFormat("#,##0.00");
    sheet.getRange(netLetter + "4:" + netLetter).setNumberFormat("#,##0.00");
    sheet.getRange(receivedLetter + "4:" + receivedLetter).setNumberFormat("#,##0.00");
    sheet.getRange(checkLetter + "4:" + checkLetter).setHorizontalAlignment("center");
  } catch (e) {}

  var summaryRows = [
    ["เครื่องครัว/ของแห้ง", getRangeFormula(0, 0)],
    ["ผัก", getRangeFormula(1, 1)],
    ["เนื้อหมู / ไก่", getRangeFormula(2, 2)],
    ["เนื้อวัว", getRangeFormula(3, 3)],
    ["ทะเล", getRangeFormula(4, 4)],
    ["ของทอด", getRangeFormula(5, 5)],
    ["น้ำจิ้ม", getRangeFormula(6, 6)],
    ["เครื่องดื่ม", getRangeFormula(7, 7)],
    ["Asset", getRangeFormula(8, 8)],
    ["เงินเดือน", getRangeFormula(9, 9)],
    ["ค่าส่งของ", getRangeFormula(10, 10)],
    ["น้ำแข็ง", getRangeFormula(11, 11)],
    ["แก๊ส / ถ่าน", getRangeFormula(12, 13)],
    ["ค่าน้ำ + ค่าไฟ + เน็ต", getRangeFormula(14, 14)],
    ["การตลาด/ปรับปรุงร้าน", getRangeFormula(15, 15)],
    ["ส่วนลด", "=SUM(" + discountLetter + ":" + discountLetter + ")"]
  ];
  
  var summaryStartRow = startRow + 3;
  
  // 1. หัวตารางสรุป
  sheet.getRange(summaryStartRow, summaryStartCol, 1, 2).merge().setValue("สรุปรายจ่าย " + monthStr);
  sheet.getRange(summaryStartRow, summaryStartCol + 2).setValue("% ของรายจ่าย");
  
  var totalRowNum = summaryStartRow + 1 + summaryRows.length;
  var valColLetter = getColumnLetter(summaryStartCol + 1);
  var pctColLetter = getColumnLetter(summaryStartCol + 2);
  var totalCellRef = "$" + valColLetter + "$" + totalRowNum;
  
  // 2. เติมข้อมูลแถวในตารางสรุป
  for (var idx = 0; idx < summaryRows.length; idx++) {
    var rNum = summaryStartRow + 1 + idx;
    sheet.getRange(rNum, summaryStartCol).setValue(summaryRows[idx][0]);
    sheet.getRange(rNum, summaryStartCol + 1).setFormula(summaryRows[idx][1]);
    sheet.getRange(rNum, summaryStartCol + 2).setFormula("=" + valColLetter + rNum + "/" + totalCellRef);
  }
  
  // 3. แถว Total สรุปผลลัพธ์
  var firstValRow = summaryStartRow + 1;
  var lastValRow = summaryStartRow + summaryRows.length;
  sheet.getRange(totalRowNum, summaryStartCol).setValue("Total");
  sheet.getRange(totalRowNum, summaryStartCol + 1).setFormula("=SUM(" + valColLetter + firstValRow + ":" + valColLetter + lastValRow + ")");
  sheet.getRange(totalRowNum, summaryStartCol + 2).setFormula("=SUM(" + pctColLetter + firstValRow + ":" + pctColLetter + lastValRow + ")");
  
  // 4. สไตล์ตารางสรุป (สีพื้นหลังเขียวสดใส, สไตล์ตัวอักษร, เส้นขอบ)
  var summaryTableRange = sheet.getRange(summaryStartRow, summaryStartCol, summaryRows.length + 2, 3);
  summaryTableRange.setBackground("#00ff00");
  summaryTableRange.setFontColor("#000000");
  summaryTableRange.setBorder(true, true, true, true, true, true);
  
  var summaryHeaderRange = sheet.getRange(summaryStartRow, summaryStartCol, 1, 3);
  summaryHeaderRange.setFontWeight("bold");
  summaryHeaderRange.setHorizontalAlignment("center");
  
  var summaryTotalRange = sheet.getRange(totalRowNum, summaryStartCol, 1, 3);
  summaryTotalRange.setFontWeight("bold");
  
  // จัดประเภทตัวเลขในตารางสรุป
  sheet.getRange(firstValRow, summaryStartCol + 1, summaryRows.length + 1, 1).setNumberFormat("#,##0.00");
  sheet.getRange(firstValRow, summaryStartCol + 2, summaryRows.length + 1, 1).setNumberFormat("0.00%");
  
  // ปรับความกว้างคอลัมน์สรุป
  sheet.autoResizeColumn(summaryStartCol);
  sheet.autoResizeColumn(summaryStartCol + 1);
  sheet.autoResizeColumn(summaryStartCol + 2);
}

function setupSheetTemplate(sheet) {
  // ป้องกันการล้างข้อมูลเดิมในกรณีที่มีแถวข้อมูลสินค้าแล้ว (ตั้งแต่แถวที่ 4 เป็นต้นไป)
  if (sheet.getLastRow() >= 4) {
    var checkCell = sheet.getRange(4, 1).getValue();
    if (checkCell !== "" && checkCell !== null && checkCell !== undefined) {
      return; // ป้องกันการล้างข้อมูลเดิมของลูกค้าโดยเด็ดขาด
    }
  }
  
  sheet.clear();
  createMonthlyHeaderBlock(sheet, 1, getThaiMonthYear());
  sheet.setFrozenRows(3);
  sheet.setFrozenColumns(3);
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
