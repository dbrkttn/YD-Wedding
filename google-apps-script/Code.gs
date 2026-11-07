/**
 * Backend for the wedding invitation: guest list, RSVPs and wishes.
 * Paste into Extensions > Apps Script in the Google Sheet. See README.md.
 *
 * Tabs:
 *   Invitation  Your guest list. Columns "Nama" and "Session" are required.
 *               The Undangan menu adds "Kode" and "Link" columns next to them.
 *   RSVP        Responses, created automatically. Untick "Tampilkan" on a row
 *               to hide that wish from the page.
 */
const TAB = 'RSVP';
const TAB_TAMU = 'Invitation';
const KOLOM = ['Waktu', 'Nama', 'Kehadiran', 'Jumlah Tamu', 'Ucapan', 'Tampilkan', 'Sesi'];
const KOLOM_TAMPILKAN = KOLOM.indexOf('Tampilkan') + 1;
const BATAS_KIRIM_PER_MENIT = 30;
const BATAS_UCAPAN_DITAMPILKAN = 300;
const KUNCI_CACHE = 'ucapan';
const HURUF_KODE = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';   // no 0/O, 1/I/L
const PANJANG_KODE = 6;

/* ---------- Helpers ---------- */

function ambilTab_() {
  const buku = SpreadsheetApp.getActiveSpreadsheet();
  let tab = buku.getSheetByName(TAB);
  if (!tab) {
    tab = buku.insertSheet(TAB);
    tab.appendRow(KOLOM);
    tab.getRange(1, 1, 1, KOLOM.length).setFontWeight('bold');
    tab.setFrozenRows(1);
  }
  // Older RSVP tabs were created before the "Sesi" column existed.
  const judul = tab.getRange(1, 1, 1, KOLOM.length);
  const ada = judul.getValues()[0];
  if (ada.some((isi, i) => isi === '' && KOLOM[i])) {
    judul.setValues([KOLOM]).setFontWeight('bold');
  }
  return tab;
}

function json_(isi) {
  return ContentService.createTextOutput(JSON.stringify(isi))
    .setMimeType(ContentService.MimeType.JSON);
}

/** Cleans text and stops the sheet treating guest input as a formula. */
function bersihkan_(nilai, panjang) {
  const teks = String(nilai == null ? '' : nilai)
    .replace(/[\u0000-\u0009\u000B-\u001F\u007F]/g, '')
    .trim()
    .slice(0, panjang);
  return /^[=+\-@]/.test(teks) ? "'" + teks : teks;
}

function rapikanKode_(nilai) {
  const kode = String(nilai == null ? '' : nilai).trim().toUpperCase();
  return /^[A-Z0-9]{4,12}$/.test(kode) ? kode : '';
}

/** Reads the guest list and finds its columns by their header names. */
function bacaDaftarTamu_() {
  const tab = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(TAB_TAMU);
  if (!tab) {
    return null;
  }
  const isi = tab.getDataRange().getValues();
  const judul = (isi[0] || []).map((j) => String(j).trim().toLowerCase());
  return {
    tab: tab,
    isi: isi,
    kolomNama: judul.indexOf('nama'),
    kolomSesi: judul.findIndex((j) => j === 'session' || j === 'sesi'),
    kolomKode: judul.indexOf('kode'),
    kolomLink: judul.indexOf('link'),
  };
}

/** Returns only the one guest whose code matches, never the whole list. */
function cariTamu_(kode) {
  if (!kode) {
    return null;
  }
  const daftar = bacaDaftarTamu_();
  if (!daftar || daftar.kolomNama < 0 || daftar.kolomKode < 0) {
    return null;
  }
  for (let i = 1; i < daftar.isi.length; i++) {
    const baris = daftar.isi[i];
    if (rapikanKode_(baris[daftar.kolomKode]) === kode) {
      const sesi = daftar.kolomSesi >= 0 ? parseInt(baris[daftar.kolomSesi], 10) : NaN;
      return {
        nama: String(baris[daftar.kolomNama]).trim(),
        sesi: sesi > 0 ? sesi : null,
      };
    }
  }
  return null;
}

/* ---------- Web app ---------- */

/**
 * ?k=KODE  returns that guest's name and session.
 * no ?k    returns the visible wishes, newest first, without attendance details.
 */
function doGet(e) {
  if (e && e.parameter && e.parameter.k !== undefined) {
    return json_({ ok: true, tamu: cariTamu_(rapikanKode_(e.parameter.k)) });
  }

  const cache = CacheService.getScriptCache();
  const tersimpan = cache.get(KUNCI_CACHE);
  if (tersimpan) {
    return ContentService.createTextOutput(tersimpan)
      .setMimeType(ContentService.MimeType.JSON);
  }

  const tab = ambilTab_();
  const jumlahBaris = tab.getLastRow() - 1;
  const baris = jumlahBaris > 0
    ? tab.getRange(2, 1, jumlahBaris, KOLOM.length).getValues()
    : [];

  const ucapan = baris
    .filter((b) => b[4] !== '' && b[5] === true)
    .reverse()
    .slice(0, BATAS_UCAPAN_DITAMPILKAN)
    .map((b) => ({
      nama: String(b[1]),
      ucapan: String(b[4]),
      waktu: b[0] instanceof Date ? b[0].toISOString() : '',
    }));

  const hasil = JSON.stringify({ ok: true, ucapan: ucapan });
  // CacheService stores at most 100 KB per key; a larger list is simply read fresh.
  if (hasil.length < 95000) {
    cache.put(KUNCI_CACHE, hasil, 60);
  }
  return ContentService.createTextOutput(hasil)
    .setMimeType(ContentService.MimeType.JSON);
}

/** Saves one RSVP sent by the page. */
function doPost(e) {
  let data;
  try {
    data = JSON.parse(e.postData.contents);
  } catch (err) {
    return json_({ ok: false, pesan: 'Data tidak valid.' });
  }

  // Bots fill the hidden field. Report success so they do not retry.
  if (data.situs) {
    return json_({ ok: true });
  }

  const nama = bersihkan_(data.nama, 60);
  const ucapan = bersihkan_(data.ucapan, 500);
  const kehadiran = data.kehadiran === 'Hadir' || data.kehadiran === 'Tidak Hadir' ? data.kehadiran : '';
  const jumlah = kehadiran === 'Hadir' ? Math.min(Math.max(parseInt(data.jumlah, 10) || 1, 1), 5) : 0;

  if (!nama || !kehadiran) {
    return json_({ ok: false, pesan: 'Nama dan kehadiran wajib diisi.' });
  }

  const cache = CacheService.getScriptCache();
  const kunciMenit = 'kirim-' + Math.floor(Date.now() / 60000);
  const kiriman = parseInt(cache.get(kunciMenit) || '0', 10);
  if (kiriman >= BATAS_KIRIM_PER_MENIT) {
    return json_({ ok: false, pesan: 'Terlalu banyak kiriman. Coba lagi sebentar.' });
  }
  cache.put(kunciMenit, String(kiriman + 1), 120);

  // The session comes from your guest list, not from the browser.
  const tamu = cariTamu_(rapikanKode_(data.kode));
  const sesi = tamu && tamu.sesi ? tamu.sesi : '';

  const kunci = LockService.getScriptLock();
  try {
    kunci.waitLock(10000);
  } catch (err) {
    return json_({ ok: false, pesan: 'Server sedang sibuk. Coba lagi.' });
  }

  try {
    const tab = ambilTab_();
    tab.appendRow([new Date(), nama, kehadiran, jumlah, ucapan, true, sesi]);
    tab.getRange(tab.getLastRow(), KOLOM_TAMPILKAN).insertCheckboxes().check();
    cache.remove(KUNCI_CACHE);
  } finally {
    kunci.releaseLock();
  }

  return json_({ ok: true });
}

/* ---------- Sheet menu ---------- */

function onOpen() {
  SpreadsheetApp.getUi()
    .createMenu('Undangan')
    .addItem('Buat kode & link tamu', 'buatLinkTamu')
    .addItem('Ubah alamat situs', 'ubahAlamatSitus')
    .addToUi();
}

function alamatSitus_() {
  return PropertiesService.getScriptProperties().getProperty('ALAMAT_SITUS') || '';
}

function mintaAlamatSitus_() {
  const ui = SpreadsheetApp.getUi();
  const jawab = ui.prompt(
    'Alamat situs undangan',
    'Tempel alamat situs, misalnya https://undangan-anda.netlify.app\n' +
    'Kosongkan jika belum dipublikasikan: kode tetap dibuat, link menyusul.',
    ui.ButtonSet.OK_CANCEL);
  if (jawab.getSelectedButton() !== ui.Button.OK) {
    return null;
  }
  const alamat = jawab.getResponseText().trim().replace(/\/+$/, '');
  if (alamat && !/^https?:\/\//i.test(alamat)) {
    ui.alert('Alamat harus diawali https://');
    return null;
  }
  PropertiesService.getScriptProperties().setProperty('ALAMAT_SITUS', alamat);
  return alamat;
}

function ubahAlamatSitus() {
  if (mintaAlamatSitus_() !== null) {
    buatLinkTamu();
  }
}

/** Gives every named guest a unique code, and a link once the site address is known. */
function buatLinkTamu() {
  const ui = SpreadsheetApp.getUi();
  let daftar = bacaDaftarTamu_();
  if (!daftar) {
    ui.alert('Tab "' + TAB_TAMU + '" tidak ditemukan.');
    return;
  }
  if (daftar.kolomNama < 0 || daftar.kolomSesi < 0) {
    ui.alert('Tab "' + TAB_TAMU + '" perlu kolom "Nama" dan "Session" di baris pertama.');
    return;
  }

  // Add the Kode and Link columns after the last used column if they are missing.
  const tab = daftar.tab;
  ['Kode', 'Link'].forEach((judul) => {
    const sudah = tab.getRange(1, 1, 1, Math.max(tab.getLastColumn(), 1)).getValues()[0]
      .some((j) => String(j).trim().toLowerCase() === judul.toLowerCase());
    if (!sudah) {
      tab.getRange(1, tab.getLastColumn() + 1).setValue(judul).setFontWeight('bold');
    }
  });
  daftar = bacaDaftarTamu_();

  let alamat = alamatSitus_();
  if (!alamat && !PropertiesService.getScriptProperties().getProperty('ALAMAT_DITANYA')) {
    PropertiesService.getScriptProperties().setProperty('ALAMAT_DITANYA', '1');
    const dijawab = mintaAlamatSitus_();
    alamat = dijawab || '';
  }

  const terpakai = new Set();
  daftar.isi.slice(1).forEach((b) => {
    const k = rapikanKode_(b[daftar.kolomKode]);
    if (k) {
      terpakai.add(k);
    }
  });

  const kodeBaru = () => {
    let kode;
    do {
      kode = '';
      for (let i = 0; i < PANJANG_KODE; i++) {
        kode += HURUF_KODE.charAt(Math.floor(Math.random() * HURUF_KODE.length));
      }
    } while (terpakai.has(kode));
    terpakai.add(kode);
    return kode;
  };

  let dibuat = 0;
  let tanpaSesi = 0;
  const kolomKode = [];
  const kolomLink = [];
  daftar.isi.slice(1).forEach((b) => {
    const nama = String(b[daftar.kolomNama]).trim();
    let kode = rapikanKode_(b[daftar.kolomKode]);
    if (nama && !kode) {
      kode = kodeBaru();
      dibuat++;
    }
    if (nama && !(parseInt(b[daftar.kolomSesi], 10) > 0)) {
      tanpaSesi++;
    }
    kolomKode.push([kode]);
    // The name in the link lets the cover show it instantly; the session still comes from the sheet.
    kolomLink.push([nama && alamat ? alamat + '/?k=' + kode + '&to=' + encodeURIComponent(nama) : '']);
  });

  if (kolomKode.length) {
    tab.getRange(2, daftar.kolomKode + 1, kolomKode.length, 1).setValues(kolomKode);
    tab.getRange(2, daftar.kolomLink + 1, kolomLink.length, 1).setValues(kolomLink);
  }

  ui.alert(
    'Selesai. ' + dibuat + ' kode baru dibuat.' +
    (alamat ? '' : '\nLink belum dibuat karena alamat situs kosong. Pakai menu Undangan > Ubah alamat situs setelah dipublikasikan.') +
    (tanpaSesi ? '\n' + tanpaSesi + ' tamu belum punya Session: mereka akan melihat kedua sesi.' : ''));
}
