import React, { useState, useEffect } from 'react';
import { Send, CheckCircle, XCircle, AlertTriangle, ShieldCheck, HelpCircle } from 'lucide-react';

export default function Integrations({ settings, onSaveSettings }) {
  const [simulationMode, setSimulationMode] = useState(settings.simulationMode ?? true);
  
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

  // Supabase / PostgreSQL Database States
  const [supabaseDbUrl, setSupabaseDbUrl] = useState(settings.supabaseDbUrl || '');
  const [supabaseApiKey, setSupabaseApiKey] = useState(settings.supabaseApiKey || '');
  const [testDbStatus, setTestDbStatus] = useState(null);
  const [isTestingDb, setIsTestingDb] = useState(false);

  // Synchronize state when settings prop changes (e.g. after fetch backend response)
  useEffect(() => {
    if (settings) {
      if (settings.simulationMode !== undefined) setSimulationMode(settings.simulationMode);
      if (settings.lineNotifyToken !== undefined) setLineNotifyToken(settings.lineNotifyToken || '');
      if (settings.lineChannelAccessToken !== undefined) setLineChannelAccessToken(settings.lineChannelAccessToken || '');
      if (settings.lineUserId !== undefined) setLineUserId(settings.lineUserId || '');
      if (settings.lineChannelSecret !== undefined) setLineChannelSecret(settings.lineChannelSecret || '');
      if (settings.googleSheetWebhookUrl !== undefined) setGoogleSheetWebhookUrl(settings.googleSheetWebhookUrl || '');
      if (settings.driveFolderId !== undefined) setDriveFolderId(settings.driveFolderId || '');
      if (settings.messengerPageAccessToken !== undefined) setMessengerPageAccessToken(settings.messengerPageAccessToken || '');
      if (settings.messengerRecipientId !== undefined) setMessengerRecipientId(settings.messengerRecipientId || '');
      if (settings.supabaseDbUrl !== undefined) setSupabaseDbUrl(settings.supabaseDbUrl || '');
      if (settings.supabaseApiKey !== undefined) setSupabaseApiKey(settings.supabaseApiKey || '');
    }
  }, [settings]);

  const testAndConnectDb = async () => {
    if (!supabaseDbUrl) {
      alert('กรุณากรอก Connection String หรือ Supabase Project URL ก่อนทดสอบ');
      return;
    }
    setIsTestingDb(true);
    setTestDbStatus(null);
    try {
      const response = await fetch('/api/db/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          connectionString: supabaseDbUrl,
          apiKey: supabaseApiKey
        })
      });
      const data = await response.json();
      setTestDbStatus({ success: data.success, msg: data.message });
      if (data.success) {
        onSaveSettings({
          simulationMode,
          lineNotifyToken,
          lineChannelAccessToken,
          lineUserId,
          lineChannelSecret,
          googleSheetWebhookUrl,
          driveFolderId,
          messengerPageAccessToken,
          messengerRecipientId,
          supabaseDbUrl,
          supabaseApiKey
        }, true);
      }
    } catch (err) {
      setTestDbStatus({ success: false, msg: 'ไม่สามารถทดสอบการเชื่อมต่อได้' });
    } finally {
      setIsTestingDb(false);
    }
  };

  const handleSaveAll = (e) => {
    if (e) e.preventDefault();
    onSaveSettings({
      simulationMode,
      lineNotifyToken,
      lineChannelAccessToken,
      lineUserId,
      lineChannelSecret,
      googleSheetWebhookUrl,
      driveFolderId,
      messengerPageAccessToken,
      messengerRecipientId,
      supabaseDbUrl,
      supabaseApiKey
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
      messengerRecipientId,
      supabaseDbUrl,
      supabaseApiKey
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
                value={`// ============================================================
// MASTER RESTAURANT PROCUREMENT SYSTEM - FULL APPS SCRIPT (150+ COLUMNS)
// Copy and paste this complete code into Extensions > Apps Script in your Google Sheet
// ============================================================

function doGet(e) {
  try {
    var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
    setupSheetTemplate(sheet);
    repairAllMonthlyHeaders(sheet);
    recalculateAllMonthlySummaries(sheet);
    
    if (e && e.parameter && e.parameter.action === 'export') {
      var values = sheet.getDataRange().getValues();
      return ContentService.createTextOutput(JSON.stringify(values)).setMimeType(ContentService.MimeType.JSON);
    }
    
    return ContentService.createTextOutput("ระบบร้านอาหาร: บันทึกข้อมูลและจัดโครงสร้างชีต 150+ คอลัมน์สำเร็จเรียบร้อยแล้ว!").setMimeType(ContentService.MimeType.TEXT);
  } catch (err) {
    return ContentService.createTextOutput("เกิดข้อผิดพลาด: " + err.toString()).setMimeType(ContentService.MimeType.TEXT);
  }
}

function doPost(e) {
  try {
    var data = JSON.parse(e.postData.contents);
    var driveFileUrl = '-';
    
    // อัปโหลดรูปภาพบิลเข้า Google Drive
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
            try { folder = DriveApp.getFolderById(data.driveFolderId); } catch (fErr) {}
          }
          if (!folder) {
            var folders = DriveApp.getFoldersByName('Restaurant Bills');
            folder = folders.hasNext() ? folders.next() : DriveApp.createFolder('Restaurant Bills');
          }
          var file = folder.createFile(blob);
          file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
          driveFileUrl = file.getUrl();
        }
      } catch (imageErr) {
        driveFileUrl = 'Error: ' + imageErr.toString();
      }
    }
    
    var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
    if (sheet.getLastColumn() === 0 || sheet.getLastRow() <= 3) {
      setupSheetTemplate(sheet);
    }
    
    var incomingDate = new Date(data.date || new Date());
    var formattedDate = Utilities.formatDate(incomingDate, Session.getScriptTimeZone(), "dd/MM/yyyy");
    
    // ค้นหาคอลัมน์ของสินค้าแบบ Dynamic 150+ คอลัมน์
    var lastCol = sheet.getLastColumn();
    var headersRow3 = sheet.getRange(3, 1, 1, lastCol).getValues()[0];
    var colIndex = -1;
    var targetName = (data.name || '').trim().toLowerCase();
    
    for (var i = 0; i < headersRow3.length; i++) {
      var hName = (headersRow3[i] || '').toString().trim().toLowerCase();
      if (hName && targetName.indexOf(hName) !== -1) {
        colIndex = i + 1;
        break;
      }
    }
    
    var newRow = new Array(lastCol).fill('');
    newRow[0] = formattedDate;
    newRow[1] = data.billNumber || ('GS-' + Date.now());
    newRow[2] = data.cost || 0;
    newRow[3] = data.name || 'ซื้อวัตถุดิบ';
    newRow[4] = data.quantity || 1;
    
    if (colIndex > 0) {
      newRow[colIndex - 1] = data.cost || 0;
    }
    
    sheet.appendRow(newRow);
    
    return ContentService.createTextOutput(JSON.stringify({
      success: true,
      message: "บันทึกข้อมูลและอัปโหลดรูปภาพลง Google Sheet เรียบร้อยแล้ว",
      imageUrl: driveFileUrl
    })).setMimeType(ContentService.MimeType.JSON);
  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({
      success: false,
      message: error.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

function setupSheetTemplate(sheet) {
  sheet.clear();
  var row1 = ["วันที่สั่งซื้อ","เลขสินค้า คำสั่งซื้อ","ยอดรวมบิล","รายการ","จำนวน","22","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","ค่าบริการ","","","","","","","","ส่วนลด","ราคาสุทธิ","รับเงินเเล้ว","ตั้งเบิก","รับเงินเเล้ว","ค้างจ่าย",""];
  var row2 = ["","","","","","เครืองครัว/ของแห้ง","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","ผัก","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","เนื้อหมูู / ไก่","","","","","","","","","","","","","เนื้อวัว","","","","","","","ทะเล","","","","","","","","ของทอด","","","","","","","","น้ำจิ่ม","","เครืองดื่ม","","","","","","","","","","","Asset","","","","","","","","","","","","","เงินเดือนพนักงาน + ค่าเช่าร้าน + กับข้าวพนักงาน","ค่าส่งของ","น้ำเเข็ง","","แก๊ส","ถ่าน","ค่าน้ำ + ต่าไฟ + เน็ต","การตลาด/ปรับปรุงร้าน","","","","","","",""];
  var row3 = ["","","","","","น้ำตาลปีป","น้ำตาลทราย","น้ำตาลลทรายแดง","งาขาว","ชูรส","น้ำปลา","น้ำส้มสายชู","น้ำปลาร้า","น้ำมัน","น้ำมันงา","ซอทมะเขือ","ซอทพริก","มายองเนส","น้ำจิ้มบ๋วย","น้ำจิ้มไก่","ซอสเคลือบไก่","ซอสเคลือบไก่ กระเทียม","ซอทสูตร5","ซอทหอยนางรม","ซีอิ้วฉลากเเดง","ซีอิ่วขาว สูตร1","ซอทฝาเขียว","เบคกิ่งโซดา","ไวไว","มาม่า","หมี่หยก","วุ้นเส้น","ข้าวสาร","ข้าวคั่ว","ผงมะนาว","กระเทียมดอง","น้ำมะขาม","พริงป่น","โชยุ","วาซาบิ","เกลือ","ผงหม่าล่า","น้ำยาล้างจาน","ผงซักฟอก","ถุงขยะ  18*20","ถุงหิ้ว     12*26","ถุงร้อน  8*12","ถุงร้อน4/2*7","ถุงร้อน6*9","ถุงหิ้ว     8*16","ไข่ไก่","เต้าหู้ไข่","ของอะไรไมรู้","กระหล่ำ","เห็ดเข็ม","แครอท","ผักบุ้ง","ข้าวโพด","ต้นหอม","ผักชี","ตั้งโอ๋","กระเทียมไทย","กระเทียมจีน","กระเทียมเจียว","พริกไท","พริกเขียว","พริกเเดง","กุ้งแห้ง","มะละกอ","หัวปลี","มะนาว","หอมใหญ่","หอมเเดง","มะเขีอเทศ","แตงกวาลูกเล็ก","ถัวฝักยาว","ถัวตำไทย","ใบกะเพรา","ข่า","ตะใคร้","ใบบะกรูด","ผักชีใบเลื่อย","โหระพา","ใบเตย","พริกขี้หนู","แตงกวา","เม็ดมะม่วง","เนื้อหมู","สามชั้น","สันคอ","หมูสับ","ตับ","เบคอน","เศษเอ็นไก่","เอ็นไก่","ปีกไก่","มันหมูเจียว","กระดูกหมู","สะโพกหมู","มันก้อน","สันคอ","เสือ","สันใน","เนื้อออส","ผ้าคีริ้ว","สามชั้น","สันนอก","หมึกสด","หมึกหมูกะทะ","หมึกกรอบ","กุ้ง","กุ้ง หมูกะทะ","ปูอัด","เต้าหู้ปลา","กะพรุน","เกี๋ยวซ่า","เฟรนฟราย","นักเก็ต","ไก่กรอบ","แป้งทอดกรอบ","เอโร่ อิบิโรลไส้กุ้งแช่แข็ง","เต้าหู้ชีท","","วดี","BBQ","น้ำอัดลม","โซดา","น้ำเปล่า","หลอดน้ำงอ","เบียร์ช้าง","เบียร์ลีโอ","เบียร์สิงห์","รีเเบน","รีกลม","ขนมหวาน","ไอติม","แปลงขัดกระทะ","สเปรย์กำจัดแมลง","กาวดักแมงวัล","น้ำยาถูพื้น","น้ำยาล้างจาน","ล้างห้องน้ำ","สบูล้างมือ","น้ำยาเช็ดโต๊ะ","ทิชชู่","หลอดงอ","ตะเกียบไม้","กระดาษความร้อน","อื่นๆ","","","หลอด","บด","","","","","","","","2","223","114.25","2","222","874.25","240.00",""];

  sheet.appendRow(row1);
  sheet.appendRow(row2);
  sheet.appendRow(row3);

  var lastCol = row3.length;
  sheet.getRange(1, 1, 1, lastCol).setFontWeight("bold").setBackground("#10b981").setFontColor("#ffffff");
  sheet.getRange(2, 1, 1, lastCol).setFontWeight("bold").setBackground("#3b82f6").setFontColor("#ffffff");
  sheet.getRange(3, 1, 1, lastCol).setFontWeight("bold").setBackground("#f3f4f6").setFontColor("#1f2937");
}
`}
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

        {/* Supabase / PostgreSQL Section */}
        <div className="card">
          <div className="channel-setting-card" style={{ border: 'none', background: 'transparent', padding: 0, margin: 0 }}>
            <div className="channel-header">
              <div className="channel-name" style={{ color: 'var(--accent-green)', fontWeight: '700' }}>
                <ShieldCheck size={22} style={{ color: 'var(--accent-green)' }} />
                <span>Supabase / PostgreSQL Cloud Database Integration</span>
              </div>
              <button 
                type="button" 
                className="btn btn-secondary"
                disabled={isTestingDb}
                onClick={testAndConnectDb}
                style={{ fontSize: '0.8rem', padding: '0.4rem 0.8rem' }}
              >
                {isTestingDb ? 'กำลังทดสอบ...' : 'ทดสอบ & เชื่อมต่อ DB'}
                <Send size={12} style={{ marginLeft: '0.4rem' }} />
              </button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem', marginTop: '0.75rem' }}>
              <div className="form-group">
                <label>PostgreSQL URI หรือ Supabase Project URL</label>
                <input 
                  type="text" 
                  name="supabase_url_field"
                  autoComplete="off"
                  data-lpignore="true"
                  className="form-control"
                  value={supabaseDbUrl}
                  onChange={(e) => setSupabaseDbUrl(e.target.value)}
                  placeholder="postgresql://... หรือ https://xxxx.supabase.co"
                />
              </div>

              <div className="form-group">
                <label>Supabase API Key (Publishable / Service Key)</label>
                <input 
                  type="password" 
                  name="supabase_key_field"
                  autoComplete="new-password"
                  data-lpignore="true"
                  className="form-control"
                  value={supabaseApiKey}
                  onChange={(e) => setSupabaseApiKey(e.target.value)}
                  placeholder="เช่น sb_publishable_... หรือ eyJhbGci..."
                />
              </div>
            </div>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '-0.25rem', display: 'block' }}>
              สามารถใช้ PostgreSQL Connection String (จากปุ่ม Connect บนสุด) หรือใส่ Supabase Project URL คู่กับ Publishable Key (จากหน้า Settings &gt; API Keys) ก็ได้ครับ
            </span>

            {testDbStatus && (
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                fontSize: '0.85rem',
                padding: '0.65rem 1rem',
                borderRadius: '8px',
                backgroundColor: testDbStatus.success ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                color: testDbStatus.success ? 'var(--accent-green)' : 'var(--accent-danger)',
                border: '1px solid',
                borderColor: testDbStatus.success ? 'rgba(16, 185, 129, 0.2)' : 'rgba(239, 68, 68, 0.2)',
                marginTop: '0.5rem'
              }}>
                {testDbStatus.success ? <CheckCircle size={16} /> : <XCircle size={16} />}
                <span>{testDbStatus.msg}</span>
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
