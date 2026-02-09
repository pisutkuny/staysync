# Expense Receipt Upload - Google Apps Script Setup Guide

## 📋 Setup Instructions

### Step 1: Create Expense Receipts Folder in Google Drive
1. Go to your Google Drive
2. Navigate to your main "StaySync" or "Receipts" folder
3. Create a new folder named **"Expense Receipts"**
4. Copy the Folder ID from the URL:
   ```
   https://drive.google.com/drive/folders/FOLDER_ID_HERE
   ```

### Step 2: Create Google Apps Script
1. Go to [script.google.com](https://script.google.com)
2. Click **"New Project"**
3. Name it: **"StaySync - Expense Receipt Upload"**
4. Delete the default code
5. Copy the entire code from `scripts/expense-receipt-upload.gs`
6. Paste into the script editor

### Step 3: Configure Script Properties
1. In the script editor, click ⚙️ **Project Settings** (left sidebar)
2. Scroll to **"Script Properties"**
3. Click **"Add script property"**
4. Add:
   - **Property**: `EXPENSE_RECEIPTS_FOLDER_ID`
   - **Value**: Your Folder ID from Step 1

### Step 4: Test the Setup
1. Click the **`testSetup`** function in the dropdown at the top
2. Click **Run** (▶️)
3. Authorize the script (first time only)
4. Check **Execution log** - should show:
   ```
   ✅ Folder found: Expense Receipts
   ✅ Folder URL: ...
   ✅ Monthly folder: 2026-02
   ```

### Step 5: Deploy as Web App
1. Click **Deploy** → **New deployment**
2. Click ⚙️ (gear icon) → Select **"Web app"**
3. Configure:
   - Description: "Expense Receipt Upload API"
   - Execute as: **Me (your email)**
   - Who has access: **Anyone**
4. Click **Deploy**
5. **Copy the Web App URL** (looks like):
   ```
   https://script.google.com/macros/s/ABC123.../exec
   ```

### Step 6: Add to Environment Variables
1. Open `e:/StaySync/.env`
2. Add:
   ```env
   NEXT_PUBLIC_EXPENSE_RECEIPT_SCRIPT_URL="https://script.google.com/macros/s/YOUR_WEB_APP_URL/exec"
   ```
3. Save the file

### Step 7: Add to Vercel (Production)
1. Go to Vercel Dashboard → Your Project → Settings → Environment Variables
2. Add new variable:
   - Key: `NEXT_PUBLIC_EXPENSE_RECEIPT_SCRIPT_URL`
   - Value: Your Web App URL
   - Environment: Production, Preview, Development
3. Click **Save**
4. **Redeploy** your app

---

## 🧪 Testing

After setup, you can test the upload:

### Test Upload (using curl or Postman):
```bash
curl -X POST YOUR_WEB_APP_URL \
  -H "Content-Type: application/json" \
  -d '{
    "fileName": "test-receipt.jpg",
    "fileData": "BASE64_ENCODED_IMAGE_DATA",
    "mimeType": "image/jpeg",
    "expenseId": 123,
    "uploadDate": "2026-02-09"
  }'
```

**Expected Response:**
```json
{
  "success": true,
  "webViewLink": "https://drive.google.com/file/d/...",
  "fileId": "abc123...",
  "fileName": "EXPENSE_123_test-receipt.jpg"
}
```

---

## 📁 Folder Structure

Your Drive will look like:
```
📁 Expense Receipts/
  📁 2026-01/
    📄 EXPENSE_45_receipt1.jpg
    📄 EXPENSE_47_receipt2.jpg
  📁 2026-02/
    📄 EXPENSE_52_receipt3.jpg
    📄 EXPENSE_55_receipt4.jpg
```

---

## ✅ Checklist

- [ ] Created "Expense Receipts" folder in Drive
- [ ] Copied Folder ID
- [ ] Created Apps Script project
- [ ] Pasted code
- [ ] Added EXPENSE_RECEIPTS_FOLDER_ID to Script Properties
- [ ] Ran testSetup() successfully
- [ ] Deployed as Web App
- [ ] Copied Web App URL
- [ ] Added to .env file
- [ ] Added to Vercel Environment Variables
- [ ] Tested upload

---

## 🔧 Troubleshooting

**Error: "EXPENSE_RECEIPTS_FOLDER_ID not configured"**
→ Make sure you added the folder ID to Script Properties

**Error: "Drive operation failed"**
→ Re-authorize the script (Run → Review permissions)

**Error: "Invalid folder ID"**
→ Check the folder ID is correct and folder exists

**Files not uploading**
→ Check Execution log for errors
→ Verify web app is deployed with "Anyone" access
