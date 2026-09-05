/**
 * Google Apps Script — Form Response Handler
 * 
 * Deploy this as a Web App (Deploy > New deployment > Web app)
 * Set "Who has access" to "Anyone" so the form can submit from any page.
 * Copy the deployed URL and provide it in the next step.
 */

function doGet(e) {
  return handleResponse(e);
}

function doPost(e) {
  return handleResponse(e);
}

function handleResponse(e) {
  try {
    var name = '';
    var email = '';
    var phone = '';

    if (e && e.parameter) {
      name = e.parameter.name || '';
      email = e.parameter.email || '';
      phone = e.parameter.phone || '';
    }

    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sheetName = 'Responses';
    var sheet = ss.getSheetByName(sheetName);

    // Auto-create the sheet with bold headers if it doesn't exist
    if (!sheet) {
      sheet = ss.insertSheet(sheetName);
      sheet.appendRow(['Timestamp', 'Name', 'Email', 'Phone']);
      var headerRange = sheet.getRange(1, 1, 1, 4);
      headerRange.setFontWeight('bold');
      sheet.setFrozenRows(1);
    }

    // Append the response
    var timestamp = new Date();
    sheet.appendRow([timestamp, name, email, phone]);

    return ContentService
      .createTextOutput(JSON.stringify({ success: true }))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (error) {
    return ContentService
      .createTextOutput(JSON.stringify({ success: false, error: error.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}
