/**
 * What To Wear Fashion Show — check-in backend (Google Apps Script).
 *
 * SETUP
 * 1. Open your guest Google Sheet → Extensions → Apps Script.
 * 2. Delete any sample code, paste this whole file.
 * 3. Set TOKEN below to a long random secret (must match EVENT_SHEET_TOKEN in Vercel).
 * 4. Set SHEET_NAME to your tab name (default "Guests").
 * 5. Deploy → New deployment → type "Web app" →
 *      Execute as: Me   |   Who has access: Anyone
 *    → Deploy → copy the Web app URL.
 * 6. In Vercel add env vars: EVENT_SHEET_WEBHOOK_URL = that URL,
 *    EVENT_SHEET_TOKEN = the same token. Redeploy.
 *
 * The token keeps the sheet private — only your server (which holds the token)
 * can read/write. The token is never sent to the browser.
 */
const TOKEN = 'CHANGE_ME_TO_A_LONG_RANDOM_SECRET';
const SHEET_NAME = 'Guests';

function doGet(e) { return handle(e); }
function doPost(e) { return handle(e); }

function handle(e) {
  try {
    var params = (e && e.parameter) || {};
    var body = {};
    if (e && e.postData && e.postData.contents) {
      try { body = JSON.parse(e.postData.contents); } catch (x) {}
    }
    var p = Object.assign({}, params, body);
    if (String(p.token || '') !== TOKEN) return json({ ok: false, error: 'unauthorized' });

    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sheet = ss.getSheetByName(SHEET_NAME) || ss.getSheets()[0];
    var values = sheet.getDataRange().getValues();
    var header = values[0].map(function (h) { return String(h).trim().toLowerCase(); });
    var col = {};
    header.forEach(function (h, i) { col[h] = i; });

    var idx = {
      name: findCol(col, ['full name', 'name']),
      phone: findCol(col, ['phone number', 'phone']),
      category: findCol(col, ['category']),
      company: findCol(col, ['company / brand (if applicable)', 'company / brand', 'company', 'brand']),
      rsvp: findCol(col, ['rsvp status', 'rsvp']),
      seatRow: findCol(col, ['seat row', 'row']),
      seatNo: findCol(col, ['seat number', 'seat no', 'seat']),
      entrance: findCol(col, ['entrance']),
      checkedIn: findCol(col, ['checked in', 'checkedin']),
      checkInTime: findCol(col, ['check in time', 'checkin time']),
      remarks: findCol(col, ['remarks', 'remark'])
    };

    function rowObj(r, rowNumber) {
      return {
        row: rowNumber,
        name: get(r, idx.name),
        phone: digits(get(r, idx.phone)),
        category: get(r, idx.category),
        company: get(r, idx.company),
        rsvp: get(r, idx.rsvp),
        seatRow: get(r, idx.seatRow),
        seatNumber: get(r, idx.seatNo),
        entrance: get(r, idx.entrance),
        checkedIn: /^(yes|true|y|1)$/i.test(get(r, idx.checkedIn)),
        checkInTime: get(r, idx.checkInTime),
        remarks: get(r, idx.remarks)
      };
    }

    var action = String(p.action || '');

    if (action === 'list') {
      var guests = [];
      for (var i = 1; i < values.length; i++) {
        if (values[i].join('').trim() === '') continue;
        guests.push(rowObj(values[i], i + 1));
      }
      return json({ ok: true, guests: guests });
    }

    if (action === 'checkin') {
      var target = digits(p.phone);
      if (!target) return json({ ok: false, error: 'no_phone' });
      for (var j = 1; j < values.length; j++) {
        if (digits(values[j][idx.phone]) === target) {
          var rowNumber = j + 1;
          var already = /^(yes|true|y|1)$/i.test(String(values[j][idx.checkedIn]).trim());
          if (!already) {
            if (idx.checkedIn >= 0) sheet.getRange(rowNumber, idx.checkedIn + 1).setValue('Yes');
            if (idx.checkInTime >= 0) { sheet.getRange(rowNumber, idx.checkInTime + 1).setValue(now()); values[j][idx.checkInTime] = now(); }
            values[j][idx.checkedIn] = 'Yes';
          }
          return json({ ok: true, found: true, alreadyCheckedIn: already, guest: rowObj(values[j], rowNumber) });
        }
      }
      return json({ ok: true, found: false });
    }

    if (action === 'update') {
      var rowNumber2 = parseInt(p.row, 10);
      if (!rowNumber2 || rowNumber2 < 2) return json({ ok: false, error: 'bad_row' });
      var fields = p.fields || {};
      var map = { seatRow: idx.seatRow, seatNumber: idx.seatNo, entrance: idx.entrance, remarks: idx.remarks, checkedIn: idx.checkedIn };
      Object.keys(fields).forEach(function (k) {
        if (map[k] == null || map[k] < 0) return;
        if (k === 'checkedIn') {
          var on = fields[k] === true || /^(yes|true|y|1)$/i.test(String(fields[k]));
          sheet.getRange(rowNumber2, map[k] + 1).setValue(on ? 'Yes' : 'No');
          if (on && idx.checkInTime >= 0 && !String(sheet.getRange(rowNumber2, idx.checkInTime + 1).getValue()).trim()) {
            sheet.getRange(rowNumber2, idx.checkInTime + 1).setValue(now());
          }
        } else {
          sheet.getRange(rowNumber2, map[k] + 1).setValue(fields[k]);
        }
      });
      var fresh = sheet.getRange(rowNumber2, 1, 1, header.length).getValues()[0];
      return json({ ok: true, guest: rowObj(fresh, rowNumber2) });
    }

    return json({ ok: false, error: 'unknown_action' });
  } catch (err) {
    return json({ ok: false, error: String(err) });
  }
}

function findCol(col, names) { for (var i = 0; i < names.length; i++) { if (col[names[i]] != null) return col[names[i]]; } return -1; }
function get(r, i) { return i >= 0 ? String(r[i] == null ? '' : r[i]).trim() : ''; }
function digits(v) { return String(v == null ? '' : v).replace(/[^0-9]/g, ''); }
function now() { return Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'yyyy-MM-dd HH:mm:ss'); }
function json(obj) { return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON); }
