Hikvision PTZ Controller Web App
โปรเจกต์เว็บแอปพลิเคชันสำหรับควบคุมกล้องวงจรปิด Hikvision และดูภาพสด/ย้อนหลังผ่านเว็บเบราว์เซอร์ พร้อมระบบ Proxy สำหรับสตรีมมิ่งที่เสถียร

🚀 Features
PTZ Control: ควบคุมการหมุนกล้อง (ขึ้น/ลง/ซ้าย/ขวา) ผ่านหน้าเว็บ

Live View: สตรีมภาพสดผ่าน WebSocket

Playback: ดูภาพย้อนหลังจาก SD Card ของกล้อง พร้อมปรับความเร็วในการเล่นได้

Headless Ready: รองรับการรันบน Server/Background Process ด้วย PM2

Ngrok Integration: ทะลุเน็ตบริษัท/เน็ตบ้านเพื่อดูผ่าน 5G ได้จากทุกที่

🛠️ Prerequisites
Node.js (แนะนำ v18+)

FFmpeg (ต้องติดตั้งในเครื่องและ Add to PATH)

PM2 (สำหรับจัดการ Process: npm install -g pm2)

⚙️ Installation & Setup
Clone project & Install dependencies:

Bash
git clone [your-repo-url]
cd hikvision-ptz-controller
npm install
Run Server:
ใช้ PM2 เพื่อให้เซิร์ฟเวอร์ทำงานตลอดเวลา:

Bash
pm2 start server.js --name hikvision-web
Expose to Public (Using Ngrok):
เพื่อให้เข้าถึงได้จากภายนอก:

Bash
# ทำครั้งแรกเพื่อลงทะเบียน Authtoken
.\ngrok.exe config add-authtoken <YOUR_NGROK_TOKEN>

# สั่งเปิดท่อ
.\ngrok.exe http 3000
📝 Configuration
แก้ไข IP กล้อง, Username และ Password ได้ในไฟล์ server.js (จุดที่ระบุไว้ในโค้ด)

หากภาพกลับหัว สามารถเพิ่ม '-vf': 'vflip' ใน ffmpegOptions ของไฟล์ server.js

⚠️ Important Note
เครื่อง Server ต้องเปิดไว้ตลอดเวลา (ห้ามปิดเครื่อง)

ทุกครั้งที่รัน Ngrok ใหม่ ลิงก์ Forwarding จะเปลี่ยนเสมอ ต้องใช้ลิงก์ใหม่ที่แสดงใน Terminal เท่านั้น
