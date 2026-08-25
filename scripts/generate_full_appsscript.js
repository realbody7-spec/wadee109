import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function generateFullAppsScript() {
  const sheetId = '1xXGso8fl_EgQsfcKmtfjdG2Aileq0FaEG8khQHZUZUw';
  const csvUrl = `https://docs.google.com/spreadsheets/d/${sheetId}/export?format=csv`;

  console.log('Fetching CSV template...');
  const res = await fetch(csvUrl, { redirect: 'follow' });
  const csvText = await res.text();
  const lines = csvText.split('\n');

  const r1 = lines[0].split(',').map(c => c.replace(/^"|"$/g, '').trim());
  const r2 = lines[1].split(',').map(c => c.replace(/^"|"$/g, '').trim());
  const r3 = lines[2].split(',').map(c => c.replace(/^"|"$/g, '').trim());

  console.log(`Extracted total ${r3.length} columns!`);

  const code = `// ============================================================
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
        var matches = data.imageBase64.match(/^data:([A-Za-z-+\\/]+);base64,(.+)$/);
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
  var row1 = ${JSON.stringify(r1)};
  var row2 = ${JSON.stringify(r2)};
  var row3 = ${JSON.stringify(r3)};

  sheet.appendRow(row1);
  sheet.appendRow(row2);
  sheet.appendRow(row3);

  var lastCol = row3.length;
  sheet.getRange(1, 1, 1, lastCol).setFontWeight("bold").setBackground("#10b981").setFontColor("#ffffff");
  sheet.getRange(2, 1, 1, lastCol).setFontWeight("bold").setBackground("#3b82f6").setFontColor("#ffffff");
  sheet.getRange(3, 1, 1, lastCol).setFontWeight("bold").setBackground("#f3f4f6").setFontColor("#1f2937");
}
`;

  const outputPath = path.join(__dirname, '..', 'backend', 'data', 'Master_AppsScript.js');
  fs.writeFileSync(outputPath, code, 'utf8');
  console.log('✅ Generated Master_AppsScript.js successfully!');
}

generateFullAppsScript();
