// =============================================================
// Paste this case into your existing doPost() switch statement
// in your Google Apps Script web app.
//
// Your doPost() must already parse e.postData.contents as JSON
// and dispatch on data.action. Add this case alongside the
// others (e.g. track_signup, send_welcome_email, etc.).
// =============================================================

// Inside your switch (data.action) { ... } block, add:

case 'backup_db': {
  var sharedSecret = PropertiesService.getScriptProperties().getProperty('SHARED_SECRET');
  if (data._secret !== sharedSecret) {
    return ContentService
      .createTextOutput(JSON.stringify({ error: 'Unauthorized' }))
      .setMimeType(ContentService.MimeType.JSON);
  }

  // Find or create the backup folder
  var folderName = 'NexGuild DB Backups';
  var folderIter = DriveApp.getFoldersByName(folderName);
  var folder = folderIter.hasNext() ? folderIter.next() : DriveApp.createFolder(folderName);

  // Decode base64 content and save file
  var bytes = Utilities.base64Decode(data.content);
  var blob = Utilities.newBlob(bytes, 'application/gzip', data.filename);
  folder.createFile(blob);

  // Delete backups older than 7 days
  var cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - 7);
  var files = folder.getFiles();
  while (files.hasNext()) {
    var file = files.next();
    if (file.getDateCreated() < cutoff) {
      file.setTrashed(true);
    }
  }

  return ContentService
    .createTextOutput(JSON.stringify({ ok: true, filename: data.filename }))
    .setMimeType(ContentService.MimeType.JSON);
}
