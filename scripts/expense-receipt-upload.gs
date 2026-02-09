/**
 * Google Apps Script: Expense Receipt Upload Handler
 * 
 * Features:
 * - Upload expense receipt images to Google Drive
 * - Auto-create monthly folders (YYYY-MM format)
 * - Return webViewLink and fileId
 * - Support image compression
 * 
 * Deployment:
 * 1. Create this script in Google Apps Script
 * 2. Set EXPENSE_RECEIPTS_FOLDER_ID in script properties
 * 3. Deploy as Web App (Anyone with link can access)
 * 4. Copy the web app URL to NEXT_PUBLIC_EXPENSE_RECEIPT_SCRIPT_URL in .env
 */

function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents);
    
    // Get parameters
    const { fileName, fileData, mimeType, expenseId, uploadDate } = data;
    
    if (!fileName || !fileData) {
      return ContentService.createTextOutput(JSON.stringify({
        success: false,
        error: 'Missing fileName or fileData'
      })).setMimeType(ContentService.MimeType.JSON);
    }
    
    // Get Expense Receipts folder ID from Script Properties
    const props = PropertiesService.getScriptProperties();
    const ROOT_FOLDER_ID = props.getProperty('EXPENSE_RECEIPTS_FOLDER_ID');
    
    if (!ROOT_FOLDER_ID) {
      return ContentService.createTextOutput(JSON.stringify({
        success: false,
        error: 'EXPENSE_RECEIPTS_FOLDER_ID not configured'
      })).setMimeType(ContentService.MimeType.JSON);
    }
    
    // Get or create monthly folder
    const monthFolder = getOrCreateMonthlyFolder(ROOT_FOLDER_ID, uploadDate || new Date().toISOString());
    
    // Generate unique filename
    const timestamp = new Date().getTime();
    const uniqueFileName = `EXPENSE_${expenseId || timestamp}_${fileName}`;
    
    // Decode base64 and create file
    const blob = Utilities.newBlob(
      Utilities.base64Decode(fileData),
      mimeType || 'image/jpeg',
      uniqueFileName
    );
    
    const file = monthFolder.createFile(blob);
    
    // Set file to be viewable by anyone with link
    file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
    
    return ContentService.createTextOutput(JSON.stringify({
      success: true,
      webViewLink: file.getUrl(),
      fileId: file.getId(),
      fileName: file.getName()
    })).setMimeType(ContentService.MimeType.JSON);
    
  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({
      success: false,
      error: error.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

/**
 * Get or create monthly folder
 * Structure: Expense Receipts / 2026-02 / files...
 */
function getOrCreateMonthlyFolder(rootFolderId, dateString) {
  const rootFolder = DriveApp.getFolderById(rootFolderId);
  
  // Extract year-month from date string
  const date = new Date(dateString);
  const yearMonth = Utilities.formatDate(date, Session.getScriptTimeZone(), 'yyyy-MM');
  
  // Check if folder exists
  const folders = rootFolder.getFoldersByName(yearMonth);
  
  if (folders.hasNext()) {
    return folders.next();
  } else {
    // Create new monthly folder
    return rootFolder.createFolder(yearMonth);
  }
}

/**
 * Delete file by ID
 */
function deleteFile(e) {
  try {
    const data = JSON.parse(e.postData.contents);
    const { fileId } = data;
    
    if (!fileId) {
      return ContentService.createTextOutput(JSON.stringify({
        success: false,
        error: 'Missing fileId'
      })).setMimeType(ContentService.MimeType.JSON);
    }
    
    const file = DriveApp.getFileById(fileId);
    file.setTrashed(true);
    
    return ContentService.createTextOutput(JSON.stringify({
      success: true,
      message: 'File deleted successfully'
    })).setMimeType(ContentService.MimeType.JSON);
    
  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({
      success: false,
      error: error.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

/**
 * Test function - call this to verify setup
 */
function testSetup() {
  const props = PropertiesService.getScriptProperties();
  const FOLDER_ID = props.getProperty('EXPENSE_RECEIPTS_FOLDER_ID');
  
  if (!FOLDER_ID) {
    Logger.log('❌ EXPENSE_RECEIPTS_FOLDER_ID not set');
    Logger.log('Please add it in Project Settings > Script Properties');
    return;
  }
  
  try {
    const folder = DriveApp.getFolderById(FOLDER_ID);
    Logger.log('✅ Folder found: ' + folder.getName());
    Logger.log('✅ Folder URL: ' + folder.getUrl());
    
    // Test monthly folder creation
    const testFolder = getOrCreateMonthlyFolder(FOLDER_ID, new Date().toISOString());
    Logger.log('✅ Monthly folder: ' + testFolder.getName());
    
  } catch (error) {
    Logger.log('❌ Error: ' + error.toString());
  }
}
