/**
 * Interview form -> Google Sheet
 *
 * Setup:
 * 1. Open your Google Sheet > Extensions > Apps Script, paste this file.
 * 2. Change SECRET below (same value as GOOGLE_SCRIPT_SECRET in .env.local).
 * 3. Deploy > New deployment > type "Web app"
 *      Execute as: Me
 *      Who has access: Anyone
 * 4. Copy the Web app URL into GOOGLE_SCRIPT_URL in .env.local.
 * After editing this script, use Deploy > Manage deployments > Edit > New version,
 * otherwise the old code keeps running.
 */

const SECRET = '9aab5243ea75ca862635ca5f34db9fad';
// The ID from your sheet link: docs.google.com/spreadsheets/d/<THIS PART>/edit
const SPREADSHEET_ID = '1PYwfkeaRYEOXx3FP5GO3EiaCzXikeNIDA6Hcc-HYl4k';
const SHEET_NAME = 'Applications';

// [header shown in the sheet, key sent by the Next.js app]
const COLUMNS = [
  ['Submitted At', 'submittedAt'],
  ['Application ID', 'id'],
  ['Position', 'position'],
  ['Applying Date', 'applyingDate'],
  ['Full Name', 'fullName'],
  ['Contact Number', 'contactNumber'],
  ['Email', 'email'],
  ['Current Address', 'currentAddress'],
  ['Why Join Us', 'whyJoin'],
  ['About Job Role', 'knowAboutRole'],
  ['Why Change Job', 'whyChange'],
  ['Why Hire You', 'whyHire'],
  ['Current / Last Employer', 'currentEmployer'],
  ['Salary Expectation', 'salaryExpectation'],
  ['Night Shifts', 'nightShift'],
  ['Ideal Work Environment', 'idealEnvironment'],
  ['Reference', 'reference'],
  ['Medical Issues', 'medicalIssues'],
  ['Skills', 'skills'],
  ['Joining Date', 'joiningDate'],
  ['Resume (PDF)', 'resumeUrl'],
];

function doPost(e) {
  const lock = LockService.getScriptLock();
  try {
    const body = JSON.parse(e.postData.contents || '{}');
    if (body.secret !== SECRET) return json_({ ok: false, error: 'Unauthorized' });

    lock.waitLock(20000);
    const sheet = getSheet_();
    const row = COLUMNS.map(function (c) {
      const v = body[c[1]];
      // Prefix with ' so values like "+91..." or "=..." are stored as plain text
      return v === undefined || v === null ? '' : "'" + String(v);
    });
    sheet.appendRow(row);
    return json_({ ok: true });
  } catch (err) {
    return json_({ ok: false, error: String(err) });
  } finally {
    try { lock.releaseLock(); } catch (_) {}
  }
}

// Visiting the web app URL in a browser shows this; handy to check the deployment.
function doGet() {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  return json_({
    ok: true,
    message: 'Interview form endpoint is live',
    spreadsheet: ss.getName(),
    tab: SHEET_NAME,
    url: ss.getUrl(),
  });
}

function getSheet_() {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  let sheet = ss.getSheetByName(SHEET_NAME);
  if (!sheet) sheet = ss.insertSheet(SHEET_NAME);
  if (sheet.getLastRow() === 0) {
    sheet.appendRow(COLUMNS.map(function (c) { return c[0]; }));
    sheet.getRange(1, 1, 1, COLUMNS.length).setFontWeight('bold').setBackground('#1e3a8a').setFontColor('#ffffff');
    sheet.setFrozenRows(1);
  }
  return sheet;
}

function json_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}
