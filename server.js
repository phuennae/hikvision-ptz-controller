const express = require('express');
const onvif = require('node-onvif');
const path = require('path');
const Stream = require('node-rtsp-stream');
const { createProxyMiddleware } = require('http-proxy-middleware');

const app = express();
const port = 3000;

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// --- 1. PTZ Setup ---
let device = new onvif.OnvifDevice({ 
    xaddr: 'http://192.168.110.64:80/onvif/device_service', 
    user: 'admin', 
    pass: 'devphuenpa2546' 
});

function connectPTZ() {
    device.init().then(() => console.log('✅ PTZ Connected')).catch(() => setTimeout(connectPTZ, 10000));
}
connectPTZ();

app.post('/api/ptz', async (req, res) => {
    try {
        const { command } = req.body;
        if (command === 'stop') await device.ptzStop();
        else {
            const speed = { x: command === 'right' ? 0.5 : command === 'left' ? -0.5 : 0, y: command === 'up' ? 0.5 : command === 'down' ? -0.5 : 0, z: 0 };
            await device.ptzMove({ speed });
        }
        res.json({ status: 'ok' });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

// --- 2. Live Stream (พอร์ต 9999) ---
// 🌟 เปลี่ยนเลขท้ายจาก 102 เป็น 101 เพื่อดึงภาพท่อใหญ่ (Main Stream)
const rtspUrl = 'rtsp://admin:phuenpa2546@192.168.110.64:554/Streaming/Channels/101';

new Stream({ 
    name: 'Live', 
    streamUrl: rtspUrl, 
    wsPort: 9999, 
    ffmpegOptions: { 
        '-rtsp_transport': 'tcp', 
        '-err_detect': 'ignore_err', 
        '-fflags': '+genpts+discardcorrupt',
        '-f': 'mpegts', 
        '-codec:v': 'mpeg1video', 
        // 🌟 ปรับ Bitrate เป็น 1.5 Mbps (จากเดิม 512k)
        '-b:v': '1500k', 
        '-r': '20', 
        // 🌟 ปรับความละเอียดเป็น HD 720p (จากเดิม 640x360)
        '-s': '1280x720', 
        '-bf': '0', 
        '-nostdin': '' 
    } 
});

// --- 3. Playback API (พอร์ต 9998) ---
let playbackStream = null;

app.post('/api/playback', (req, res) => {
    const { startTime, endTime } = req.body;
    
    // แปลงเวลาให้เป็นฟอร์แมต (YYYYMMDDTHHMMSSZ)
    const formatTime = (iso) => iso.replace(/[-:]/g, '').substring(0, 15) + 'Z';
    
    // 🌟 แก้ไข: เขียน URL แบบระบุเส้นทางตรงๆ ไม่พึ่งพิงการแทนที่คำ
    // ใช้ tracks/101 สำหรับดึงไฟล์วิดีโอความละเอียดสูงจาก SD Card
    const playbackUrl = `rtsp://admin:phuenpa2546@192.168.110.64:554/Streaming/tracks/101?starttime=${formatTime(startTime)}&endtime=${formatTime(endTime)}`;

    if (playbackStream) {
        playbackStream.stop();
        playbackStream = null;
    }

    playbackStream = new Stream({
        name: 'Playback',
        streamUrl: playbackUrl,
        wsPort: 9998,
        ffmpegOptions: { 
            '-rtsp_transport': 'tcp', 
            '-err_detect': 'ignore_err', 
            '-fflags': '+genpts+discardcorrupt',
            '-f': 'mpegts', 
            '-codec:v': 'mpeg1video', 
            '-b:v': '1500k', 
            '-s': '1280x720', 
            '-r': '20', 
            '-bf': '0', 
            '-nostdin': '' 
        }
    });

    res.json({ success: true, url: playbackUrl });
});

// ยิงมาเพื่อปิดการดึงภาพย้อนหลัง คืน CPU ให้ Server
app.post('/api/stop-playback', (req, res) => {
    if (playbackStream) {
        playbackStream.stop();
        playbackStream = null;
    }
    res.json({ success: true });
});

// --- 4. Proxy (แยกช่องจราจร WebSocket) ---
const liveProxy = createProxyMiddleware({ target: 'http://127.0.0.1:9999', ws: true });
const playbackProxy = createProxyMiddleware({ target: 'http://127.0.0.1:9998', ws: true }); // เพิ่มตัวนี้

app.use('/ws-live', liveProxy);
app.use('/ws-playback', playbackProxy); // เพิ่มตัวนี้

const server = app.listen(port, () => console.log(`🚀 Smart Pole CCTV Server is running on port ${port}`));

// ตัวคัดแยกการเชื่อมต่อ
server.on('upgrade', (req, socket, head) => {
    if (req.url.startsWith('/ws-live')) {
        liveProxy.upgrade(req, socket, head);
    } else if (req.url.startsWith('/ws-playback')) {
        playbackProxy.upgrade(req, socket, head);
    } else {
        socket.destroy();
    }
});