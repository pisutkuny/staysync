// Google Apps Script to receive and store backups in Google Drive
// Deploy this as a Web App and copy the URL to GOOGLE_BACKUP_SCRIPT_URL

function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents);
    const fileName = data.fileName || 'backup-' + new Date().toISOString() + '.json';
    const jsonContent = data.content;
    
    Logger.log('📦 Received backup request: ' + fileName);
    
    // Get or create backup folder
    const folders = DriveApp.getFoldersByName('StaySync Backups');
    const folder = folders.hasNext() ? folders.next() : DriveApp.createFolder('StaySync Backups');
    
    Logger.log('📁 Folder: ' + folder.getName());
    
    // Save JSON file
    const file = folder.createFile(fileName, jsonContent, 'application/json');
    Logger.log('✅ File created: ' + file.getUrl());
    
    // Delete old backups (keep 30 days)
    const files = folder.getFiles();
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    let deletedCount = 0;
    while (files.hasNext()) {
      const f = files.next();
      if (f.getDateCreated() < thirtyDaysAgo) {
        f.setTrashed(true);
        deletedCount++;
      }
    }
    
    Logger.log('🗑️  Deleted ' + deletedCount + ' old backups');
    
    return ContentService.createTextOutput(JSON.stringify({
      success: true,
      fileId: file.getId(),
      fileName: fileName,
      url: file.getUrl(),
      deletedOldBackups: deletedCount
    })).setMimeType(ContentService.MimeType.JSON);
    
  } catch (error) {
    Logger.log('❌ Error: ' + error.toString());
    return ContentService.createTextOutput(JSON.stringify({
      success: false,
      error: error.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

// Test function (optional)
function testBackup() {
  const testData = {
    fileName: 'test-backup-' + new Date().toISOString() + '.json',
    content: JSON.stringify({
      metadata: { version: '1.0', exportDate: new Date().toISOString() },
      data: { test: 'This is a test backup' }
    })
  };
  
  const e = {
    postData: {
      contents: JSON.stringify(testData)
    }
  };
  
  const result = doPost(e);
  Logger.log('Test result: ' + result.getContent());
}
