// ═══════════════════════════════════════════════════════════════════
// Google Apps Script — Portal Bunayya Islamic School (UPDATED)
// Menerima: form POST (e.parameter.data) + raw POST + JSONP GET
// Cara pakai:
// 1. Buka script.google.com → New Project
// 2. Paste seluruh kode ini
// 3. Deploy → New Deployment → Web App
//    - Execute as: Me
//    - Who has access: Anyone
// 4. Copy URL deployment → paste ke SCRIPT_URL di index.html
// ═══════════════════════════════════════════════════════════════════

const SPREADSHEET_ID = ""; // Kosongkan = buat otomatis, atau isi ID spreadsheet Anda

function getSpreadsheet() {
  if (SPREADSHEET_ID) {
    return SpreadsheetApp.openById(SPREADSHEET_ID);
  }
  // Cari spreadsheet bernama "Portal Bunayya"
  const files = DriveApp.getFilesByName("Portal Bunayya");
  if (files.hasNext()) {
    return SpreadsheetApp.open(files.next());
  }
  // Buat baru jika belum ada
  const ss = SpreadsheetApp.create("Portal Bunayya");
  return ss;
}

function getOrCreateSheet(ss, name) {
  let sheet = ss.getSheetByName(name);
  if (!sheet) {
    sheet = ss.insertSheet(name);
  }
  return sheet;
}

// Header untuk setiap sheet
const HEADERS = {
  absensiSiswa: ["ID", "Student ID", "Nama Siswa", "Tanggal", "Kelas", "Status"],
  absensiGuru:  ["ID", "Teacher ID", "Nama Guru", "Tanggal", "Kelas", "Status"],
  jurnal:       ["ID", "Teacher ID", "Nama Guru", "Tanggal", "Kelas", "Mata Pelajaran", "Topik", "Kegiatan", "Catatan"],
  harian:       ["ID", "Student ID", "Nama Siswa", "Tanggal", "Kelas", "Bahasan", "Halaman", "Hasil", "Catatan"],
  nilai:        ["ID", "Student ID", "Nama Siswa", "Tanggal", "Kelas", "Mata Pelajaran", "Jenis Nilai", "Skor"],
  kegiatan:     ["ID", "Student ID", "Nama Siswa", "Tanggal", "Kelas", "Kategori", "Mata Pelajaran", "Penilaian", "Deskripsi"],
  target:       ["ID", "Student ID", "Nama Siswa", "Tanggal", "Kelas", "Mata Pelajaran", "Progress Saat Ini", "Progress Total", "Satuan", "Hasil", "Catatan"],
  ziyadah:      ["ID", "Student ID", "Nama Siswa", "Tanggal", "Kelas", "Juz", "Surat", "Progress", "Hasil", "Catatan"],
  guru:         ["ID", "NIP", "Nama", "Email", "HP", "Kelas", "Status", "Alamat"],
  siswa:        ["ID", "NIS", "Nama", "Kelas"],
};

// Konversi record ke row sesuai sheet
function recordToRow(sheetName, rec) {
  switch(sheetName) {
    case "absensiSiswa": return [rec.id, rec.studentId, rec.student?.nama || "", rec.tanggal, rec.kelas, rec.status];
    case "absensiGuru":  return [rec.id, rec.teacherId, rec.teacher?.nama || "", rec.tanggal, rec.kelas, rec.status];
    case "jurnal":       return [rec.id, rec.teacherId, rec.teacher?.nama || "", rec.tanggal, rec.kelas, rec.mataPelajaran, rec.topik, rec.kegiatan, rec.catatan];
    case "harian":       return [rec.id, rec.studentId, rec.student?.nama || "", rec.tanggal, rec.kelas, rec.bahasan, rec.halaman, rec.hasil, rec.catatan];
    case "nilai":        return [rec.id, rec.studentId, rec.student?.nama || "", rec.tanggal, rec.kelas, rec.mataPelajaran, rec.jenisNilai, rec.skor];
    case "kegiatan":     return [rec.id, rec.studentId, rec.student?.nama || "", rec.tanggal, rec.kelas, rec.kategori, rec.mataPelajaran, rec.penilaian, rec.deskripsi];
    case "target":       return [rec.id, rec.studentId, rec.student?.nama || "", rec.tanggal, rec.kelas, rec.mataPelajaran, rec.progressSaatIni, rec.progressTotal, rec.satuan, rec.hasil, rec.catatan];
    case "ziyadah":      return [rec.id, rec.studentId, rec.student?.nama || "", rec.tanggal, rec.kelas, rec.juz, rec.surat, rec.progress, rec.hasil, rec.catatan];
    case "guru":         return [rec.id, rec.nip, rec.nama, rec.email, rec.hp, rec.kelas, rec.status, rec.alamat];
    case "siswa":        return [rec.id, rec.nis, rec.nama, rec.class_name];
    default:             return [rec.id, JSON.stringify(rec)];
  }
}

function ensureHeader(sheet, sheetName) {
  if (sheet.getLastRow() === 0) {
    const headers = HEADERS[sheetName] || ["ID", "Data"];
    sheet.appendRow(headers);
    sheet.getRange(1, 1, 1, headers.length).setFontWeight("bold").setBackground("#4CAF50").setFontColor("white");
    sheet.setFrozenRows(1);
  }
}

// ── CORS Headers ──────────────────────────────────────────────────
function setCorsHeaders(output) {
  return output
    .setMimeType(ContentService.MimeType.JSON)
    .addHeader("Access-Control-Allow-Origin", "*")
    .addHeader("Access-Control-Allow-Methods", "POST, GET, OPTIONS")
    .addHeader("Access-Control-Allow-Headers", "Content-Type");
}

// ── Main Handler ──────────────────────────────────────────────────
function doPost(e) {
  try {
    const raw = e.postData ? e.postData.contents : (e.parameter.data || "{}");
    const payload = JSON.parse(raw);
    const ss = getSpreadsheet();
    let result = { status: "ok", synced: {} };

    if (payload.action === "syncAll") {
      // Sync semua data sekaligus
      const allData = payload.allData;
      for (const [sheetName, records] of Object.entries(allData)) {
        if (!Array.isArray(records) || records.length === 0) continue;
        const sheet = getOrCreateSheet(ss, sheetName);
        ensureHeader(sheet, sheetName);
        // Clear existing data (keep header)
        if (sheet.getLastRow() > 1) {
          sheet.deleteRows(2, sheet.getLastRow() - 1);
        }
        // Write all records
        const rows = records.map(r => recordToRow(sheetName, r));
        if (rows.length > 0) {
          sheet.getRange(2, 1, rows.length, rows[0].length).setValues(rows);
        }
        result.synced[sheetName] = records.length;
      }
    } else if (payload.action === "insert") {
      // Insert individual records
      const sheetName = payload.sheet;
      const records = Array.isArray(payload.data) ? payload.data : [payload.data];
      const sheet = getOrCreateSheet(ss, sheetName);
      ensureHeader(sheet, sheetName);
      for (const rec of records) {
        sheet.appendRow(recordToRow(sheetName, rec));
      }
      result.synced[sheetName] = records.length;
    } else if (payload.action === "delete") {
      // Delete by ID
      const sheetName = payload.sheet;
      const id = payload.id;
      const sheet = ss.getSheetByName(sheetName);
      if (sheet) {
        const data = sheet.getDataRange().getValues();
        for (let i = data.length - 1; i >= 1; i--) {
          if (data[i][0] === id) {
            sheet.deleteRow(i + 1);
            break;
          }
        }
      }
      result.deleted = id;
    }

    return setCorsHeaders(ContentService.createTextOutput(JSON.stringify(result)));
  } catch (err) {
    return setCorsHeaders(ContentService.createTextOutput(JSON.stringify({
      status: "error",
      message: err.toString()
    })));
  }
}

function doGet(e) {
  const action = e.parameter.action || "";

  // action=load → kembalikan semua data dari spreadsheet (JSONP supported)
  if (action === "load") {
    try {
      const ss = getSpreadsheet();
      const sheetNames = ["absensiSiswa","absensiGuru","jurnal","harian","nilai","kegiatan","target","ziyadah"];
      const result = {};
      sheetNames.forEach(function(name) {
        const sheet = ss.getSheetByName(name);
        if (!sheet || sheet.getLastRow() < 2) { result[name] = []; return; }
        const rows = sheet.getDataRange().getValues();
        const headers = rows[0];
        result[name] = rows.slice(1).map(function(row) {
          const obj = {};
          headers.forEach(function(h, i) { obj[h] = row[i]; });
          return obj;
        });
      });
      const jsonStr = JSON.stringify({ status: "ok", data: result });
      const callback = e.parameter.callback;
      if (callback) {
        // JSONP response - bypasses CORS
        return ContentService.createTextOutput(callback + "(" + jsonStr + ")")
          .setMimeType(ContentService.MimeType.JAVASCRIPT);
      }
      return setCorsHeaders(ContentService.createTextOutput(jsonStr)
        .setMimeType(ContentService.MimeType.JSON));
    } catch(err) {
      const errStr = JSON.stringify({ status: "error", message: err.toString() });
      const callback = e.parameter.callback;
      if (callback) {
        return ContentService.createTextOutput(callback + "(" + errStr + ")")
          .setMimeType(ContentService.MimeType.JAVASCRIPT);
      }
      return setCorsHeaders(ContentService.createTextOutput(errStr)
        .setMimeType(ContentService.MimeType.JSON));
    }
  }

  // Fallback: handle GET with data param (legacy)
  const data = e.parameter.data;
  if (data) {
    const fakeEvent = { postData: { contents: decodeURIComponent(data) }, parameter: {} };
    return doPost(fakeEvent);
  }
  return setCorsHeaders(ContentService.createTextOutput(JSON.stringify({
    status: "ok", message: "Portal Bunayya Apps Script aktif — gunakan action=load untuk memuat data"
  })).setMimeType(ContentService.MimeType.JSON));
}
