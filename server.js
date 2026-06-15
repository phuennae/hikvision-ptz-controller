const express = require('express');
const onvif = require('node-onvif');
const path = require('path');
const Stream = require('node-rtsp-stream'); // นำเข้าไลบรารีสตรีมมิ่ง

const app = express();
const port = 3000;

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// --- 1. การตั้งค่า PTZ ---
let device = new onvif.OnvifDevice({
  xaddr: 'http://192.168.1.64:80/onvif/device_service',
  user: 'admin',
  pass: 'devphuenpa2546' // <--- เปลี่ยนรหัสผ่านตรงนี้ (จุดที่ 1)
});

device.init().then(() => {
  console.log('✅ Camera PTZ Connected!');
}).catch(err => console.error('❌ PTZ Connection Failed:', err.message));

app.post('/api/ptz', (req, res) => {
  const { command } = req.body;
  if (!device.services.ptz) return res.status(500).json({ error: 'PTZ Not Supported' });

  let ptzParams = { speed: { x: 0, y: 0, z: 0 } };
  switch (command) {
    case 'left': ptzParams.speed.x = -0.5; break;
    case 'right': ptzParams.speed.x = 0.5; break;
    case 'up': ptzParams.speed.y = 0.5; break;
    case 'down': ptzParams.speed.y = -0.5; break;
    case 'stop': 
      device.ptzStop().then(() => res.json({ status: 'หยุด' })).catch(err => res.status(500).json({ error: err.message }));
      return;
    default: return res.status(400).json({ error: 'คำสั่งไม่ถูกต้อง' });
  }

  device.ptzMove(ptzParams).then(() => res.json({ status: `กำลังหมุน ${command}` })).catch(err => res.status(500).json({ error: err.message }));
});

// --- 2. การตั้งค่าสตรีมมิ่ง (Live View) ---
// ใช้ Sub-Stream (Channels/102) ของกล้อง เพื่อให้ได้ความละเอียด 640x480/640x360 ซึ่งลื่นไหลและเหมาะกับเว็บ 
const rtspUrl = 'rtsp://admin:phuenpa2546@192.168.1.64:554/Streaming/Channels/102'; // <--- เปลี่ยนรหัสผ่านตรงนี้ (จุดที่ 2)

stream = new Stream({
  name: 'HikvisionStream',
  streamUrl: rtspUrl,
  wsPort: 9999, 
  ffmpegOptions: {
    '-rtsp_transport': 'tcp', // 👈 เพิ่มบรรทัดนี้! บังคับใช้ TCP เพื่อความเสถียร
    '-stats': '', 
    '-r': 20, // 👈 ปรับให้ตรงกับ Video Frame Rate ในหน้าตั้งค่ากล้อง (20 fps)
    '-q:v': 3 
  }
});

app.listen(port, () => {
  console.log(`🌐 Server is running at http://localhost:${port}`);
});