# คู่มือการตั้งค่า LINE Rich Menu (แบบ 6 ปุ่ม - Large)

เมนูนี้จะครอบคลุมฟังก์ชันเพิ่มขึ้น ดูเป็นมืออาชีพและใช้งานสะดวก

## 1. เตรียมรูปภาพ (Assets)
ผมได้จัดเตรียมรูปภาพขนาด **2500px x 1686px** (Large) ไว้ให้แล้วครับ:
`e:\StaySync\assets\staysync_rich_menu_large_6grid.png`

*(ปุ่ม Wi-Fi มีป้าย "Coming Soon" และเปลี่ยนปุ่มพัสดุเป็น "Emergency" ให้แล้วครับ)*

## 2. เข้าไปที่ LINE Official Account Manager
1. ไปที่ [manager.line.biz](https://manager.line.biz/)
2. สร้าง Rich Menu ใหม่

## 3. ตั้งค่า Template
- เลือก Template แบบ **Large - 6 items** (6 ช่องเท่ากัน)

## 4. กำหนด Action (เรียงตาม Grid ซ้ายไปขวา, บนลงล่าง)

### แถวบน
1. **แจ้งซ่อม (Repair)**
   - Type: Link -> `https://<YOUR_WEBSITE>/report`
2. **บิลของฉัน (My Bill)**
   - Type: Text -> คำว่า `MyID` (หรือ Link เช็คบิล)
3. **ติดต่อ (Contact)**
   - Type: Text -> คำว่า `Admin`

### แถวล่าง
4. **Wi-Fi** (กำลังปรับปรุง)
   - Type: Text -> คำว่า `Wifi` 
   - *หมายเหตุ*: คุณสามารถตั้งค่า Auto-reply ให้ตอบกลับว่า "ระบบกำลังปรับปรุง" ได้
5. **กฎระเบียบ (Rules)**
   - Type: Text -> คำว่า `Rules` (ไว้ส่งรูปกฎระเบียบ Auto-reply)
6. **ฉุกเฉิน (Emergency)**
   - Type: Link -> `tel:191` หรือเบอร์เจ้าหน้าที่ฉุกเฉิน

เสร็จเรียบร้อย! กด Save และ Apply to all users ได้เลยครับ
