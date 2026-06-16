const express = require('express');
const onvif = require('node-onvif');
const path = require('path');
const Stream = require('node-rtsp-stream');
const { createProxyMiddleware } = require('http-proxy-middleware');

const app = express();
const port = 3000;

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// --- 1. การตั้งค่า PTZ ---
let device = new onvif.OnvifDevice({
  xaddr: 'http://192.168.1.64:80/onvif/device_service',
  user: 'admin',
  pass: 'devphuenpa2546'
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

// --- 2. การตั้งค่าสตรีมมิ่ง (Live View & Playback) ---
const rtspBaseUrl = 'rtsp://admin:phuenpa2546@192.168.1.64:554';

// ตั้งค่า FFmpeg ให้รันแบบ Headless (ไม่ใช้หน้าจอ) เพื่อรองรับ PM2
const ffmpegOptions = {
    '-rtsp_transport': 'tcp',
    '-stats': '', 
    '-r': 20, 
    '-q:v': 3,
    '-nostdin': '',    // ป้องกัน FFmpeg แฮงค์เมื่อรันบน PM2
    '-loglevel': 'error' // ลดขยะใน Log
};

let liveStream = new Stream({
  name: 'HikvisionStream',
  streamUrl: `${rtspBaseUrl}/Streaming/Channels/102`,
  wsPort: 9999, 
  ffmpegOptions: ffmpegOptions
});

let playbackStream = null;

// --- 3. API สำหรับค้นหาและดึงลิงก์วิดีโอย้อนหลัง ---
app.post('/api/playback', (req, res) => {
  const { startTime, endTime, speed } = req.body; 
  const playbackSpeed = speed || 1;

  if (!startTime || !endTime) return res.status(400).json({ error: 'กรุณาส่งข้อมูลเวลา' });

  try {
    const hikStart = startTime.split('.')[0].replace(/[-:]/g, '') + 'Z';
    const hikEnd = endTime.split('.')[0].replace(/[-:]/g, '') + 'Z';
    const playbackRtspUrl = `${rtspBaseUrl}/Streaming/tracks/102?starttime=${hikStart}&endtime=${hikEnd}&scale=${playbackSpeed}`;

    if (playbackStream) {
      playbackStream.stop();
      playbackStream = null;
    }

    playbackStream = new Stream({
      name: 'HikvisionPlayback',
      streamUrl: playbackRtspUrl,
      wsPort: 9998, 
      ffmpegOptions: {
        '-rtsp_transport': 'tcp',
        '-stats': '', 
        '-r': 20, 
        '-q:v': 3,
        '-nostdin': '',
        '-loglevel': 'error',
        //'-vf': 'vflip' // 👈 เพิ่มบรรทัดนี้เพื่อกลับหัวภาพในแนวตั้ง
      }
    });

    return res.json({ success: true, wsPort: 9998 });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- 4. ระบบ Proxy สำหรับมัดรวมสัญญาณ (ลิงก์เดียวจบ) ---
const liveProxy = createProxyMiddleware({ target: 'http://127.0.0.1:9999', ws: true, changeOrigin: true });
const playbackProxy = createProxyMiddleware({ target: 'http://127.0.0.1:9998', ws: true, changeOrigin: true });

app.use('/ws-live', liveProxy);
app.use('/ws-playback', playbackProxy);

const server = app.listen(port, () => {
    console.log(`CCTV Web Server running on port ${port}`);
});

server.on('upgrade', (req, socket, head) => {
    if (req.url.startsWith('/ws-live')) liveProxy.upgrade(req, socket, head);
    else if (req.url.startsWith('/ws-playback')) playbackProxy.upgrade(req, socket, head);
});