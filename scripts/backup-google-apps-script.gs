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
    
    // Note: Files are kept permanently - manual deletion only
    Logger.log('📦 Files are stored permanently in Google Drive');
    
    return ContentService.createTextOutput(JSON.stringify({
      success: true,
      fileId: file.getId(),
      fileName: fileName,
      url: file.getUrl()
    })).setMimeType(ContentService.MimeType.JSON);
    
  } catch (error) {
    Logger.log('❌ Error: ' + error.toString());
    return ContentService.createTextOutput(JSON.stringify({
      success: false,
      error: error.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

// Test function - call this to verify the script works
function testBackup() {
  // Create a simple test backup
  const testData = {
    metadata: { version: '1.0', exportDate: new Date().toISOString() },
    data: { test: 'This is a test backup' }
  };
  
  const fileName = 'test-backup-' + new Date().toISOString().slice(0,19).replace(/:/g,'-') + '.json';
  
  Logger.log('🧪 Testing backup creation...');
  Logger.log('📦 File name: ' + fileName);
  
  // Get or create backup folder
  const folders = DriveApp.getFoldersByName('StaySync Backups');
  const folder = folders.hasNext() ? folders.next() : DriveApp.createFolder('StaySync Backups');
  
  // Save test file
  const file = folder.createFile(fileName, JSON.stringify(testData, null, 2), 'application/json');
  
  Logger.log('✅ Test backup created successfully!');
  Logger.log('📁 Folder: ' + folder.getName());
  Logger.log('📄 File: ' + fileName);
  Logger.log('🔗 URL: ' + file.getUrl());
  Logger.log('');
  Logger.log('✨ Go check your Google Drive folder: "StaySync Backups"');
}
