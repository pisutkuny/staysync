function doPost(e) {
  try {
    const params = JSON.parse(e.postData.contents);
    const { image, roomNumber, billId, month } = params;

    if (!image || !roomNumber || !billId || !month) {
      return ContentService.createTextOutput(JSON.stringify({
        success: false,
        error: "Missing required parameters: image, roomNumber, billId, month"
      })).setMimeType(ContentService.MimeType.JSON);
    }

    // Get or create folder structure
    const folder = getPaymentSlipFolder(roomNumber, month);

    // Decode base64 image
    const imageBlob = Utilities.newBlob(
      Utilities.base64Decode(image.split(',')[1]),
      'image/jpeg',
      `slip_${billId}_${Date.now()}.jpg`
    );

    // Upload to Drive
    const file = folder.createFile(imageBlob);
    file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);

    // Get links
    const fileId = file.getId();
    const webViewLink = file.getUrl();
    const thumbnailLink = `https://lh3.googleusercontent.com/d/${fileId}=s400`;

    return ContentService.createTextOutput(JSON.stringify({
      success: true,
      fileId: fileId,
      webViewLink: webViewLink,
      thumbnailLink: thumbnailLink
    })).setMimeType(ContentService.MimeType.JSON);

  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({
      success: false,
      error: error.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

/**
 * Get or create folder for payment slips
 * Structure: Payment Slips/{roomNumber}/{YYYY-MM}/
 */
function getPaymentSlipFolder(roomNumber, month) {
  const rootFolderId = PropertiesService.getScriptProperties().getProperty('PAYMENT_SLIPS_FOLDER_ID');
  
  if (!rootFolderId) {
    throw new Error('PAYMENT_SLIPS_FOLDER_ID not configured in Script Properties');
  }

  const rootFolder = DriveApp.getFolderById(rootFolderId);
  const roomFolder = getOrCreateFolder(rootFolder, `Room-${roomNumber}`);
  const monthFolder = getOrCreateFolder(roomFolder, month);
  
  return monthFolder;
}

/**
 * Get or create a subfolder
 */
function getOrCreateFolder(parentFolder, folderName) {
  const folders = parentFolder.getFoldersByName(folderName);
  
  if (folders.hasNext()) {
    return folders.next();
  }
  
  return parentFolder.createFolder(folderName);
}

/**
 * Test function to verify folder creation
 */
function testFolderCreation() {
  const testFolder = getPaymentSlipFolder("101", "2024-02");
  Logger.log("Created folder: " + testFolder.getName());
  Logger.log("Folder URL: " + testFolder.getUrl());
}
