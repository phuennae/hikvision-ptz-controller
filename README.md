# Hikvision Smart Pole Controller 📷

Web-based application สำหรับควบคุมกล้องวงจรปิด Hikvision (PTZ) และดูภาพสตรีมมิ่งสด (Live View) รวมถึงดึงภาพย้อนหลัง (Playback) จาก MicroSD Card ผ่านหน้าเว็บโดยตรง

## 🛠️ สิ่งที่ต้องติดตั้งในเครื่อง (Prerequisites)
ก่อนที่จะรันโปรเจกต์นี้ เครื่องคอมพิวเตอร์ / Server ต้องติดตั้งโปรแกรมพื้นฐานดังต่อไปนี้:
1. **Node.js** (เวอร์ชัน 14 ขึ้นไป) - สำหรับรันเซิร์ฟเวอร์
2. **Git** - สำหรับ Clone โค้ด
3. **FFmpeg** - **(สำคัญมาก!)** ต้องติดตั้งและเซ็ตค่า `Environment Variables (Path)` ให้เรียบร้อย เพราะระบบต้องใช้ FFmpeg ในการแปลงสัญญาณ RTSP เป็น WebSocket

## 📦 วิธีการติดตั้ง (Installation)

1. Clone โปรเจกต์ลงมาที่เครื่อง
```bash
git clone [https://github.com/phuennae/hikvision-ptz-controller.git](https://github.com/phuennae/hikvision-ptz-controller.git)
cd hikvision-ptz-controller

2. ติดตั้ง Dependencies (Library ที่จำเป็น)
npm install

node server.js

⚙️ การตั้งค่าเพิ่มเติม (Configuration)
หากมีการเปลี่ยนตัวกล้อง IP Camera หรือเปลี่ยนรหัสผ่าน ให้เข้าไปแก้ไขค่าในไฟล์ server.js:

rtspUrl สำหรับ Live View

playbackRtspUrl สำหรับ Playback

รหัสผ่านในส่วนของ onvif.OnvifDevice

พอวางเสร็จ ให้กด Save จากนั้นทำการ **Commit และ Push โค้ดทั้งหมดขึ้น GitHub** ให้เรียบร้อยด้วยคำสั่ง:
```bash
git add .
git commit -m "docs: update README for server deployment instructions"
git push origin main