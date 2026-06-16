# 📷 Hikvision PTZ Controller Web App

เว็บแอปพลิเคชันสำหรับควบคุมกล้องวงจรปิด Hikvision ผ่านเว็บเบราว์เซอร์ พร้อมฟีเจอร์สตรีมมิ่งสดและดูภาพย้อนหลัง โดยเน้นความเสถียรและการรันบนเซิร์ฟเวอร์แบบ 24/7

---

## ✨ Features
* **PTZ Control:** ควบคุมทิศทางกล้อง (ขึ้น/ลง/ซ้าย/ขวา) แบบ Real-time
* **Live Stream:** สตรีมมิ่งภาพสดผ่าน WebSocket (Latency ต่ำ)
* **Smart Playback:** ดึงข้อมูลวิดีโอย้อนหลังจาก SD Card ของกล้อง พร้อมรองรับการเร่งความเร็ว
* **Proxy System:** รวมสัญญาณสตรีมมิ่งและหน้าเว็บเข้าพอร์ตเดียว สะดวกต่อการ Deploy
* **Tunneling Ready:** รองรับการทำ Public URL ผ่าน Ngrok/Cloudflare สำหรับดูผ่านอินเทอร์เน็ตภายนอก

---

## 🚀 Quick Start

### 1. ติดตั้ง Dependencies
```bash
npm install

### 2. รันระบบผ่าน PM2
```bash
pm2 start server.js --name hikvision-web
pm2 save

### 3. เปิดช่องทางเข้าถึงจากภายนอก (Ngrok)
```bash
.\ngrok.exe http 3000

### Requirements
Node.js: v18 หรือสูงกว่า

FFmpeg: ต้องติดตั้งและตั้งค่า Environment Variable ให้เรียบร้อย

Network: กล้องและ Server ต้องอยู่ในวงแลนเดียวกัน

พัฒนาโดย: Phuenpa Champasri
