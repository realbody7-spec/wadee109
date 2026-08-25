// ============================================================
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
