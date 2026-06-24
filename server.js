const express = require('express');
const onvif = require('node-onvif');
const path = require('path');
const Stream = require('node-rtsp-stream');
const { createProxyMiddleware } = require('http-proxy-middleware');
const { spawn } = require('child_process');
const WebSocket = require('ws');

const app = express();
const port = 3000;

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Configuration
const cameraIP = '192.168.110.64'; 
const password = 'phuenpa2546';

// --- 1. PTZ Setup ---
let device = null;
let isPTZReady = false;

async function connectPTZ() {
    device = new onvif.OnvifDevice({
        xaddr: `http://${cameraIP}:80/onvif/device_service`,
        user: 'admin',
        pass: password,
        timeout: 20000 
    });

    try {
        await device.init();
        isPTZReady = true;
        console.log('✅ PTZ Connected Successfully');
    } catch (err) {
        console.error('❌ PTZ Init Error:', err.message);
        setTimeout(connectPTZ, 10000); 
    }
}
connectPTZ();

app.post('/api/ptz', async (req, res) => {
    if (!isPTZReady) return res.status(503).json({ error: "PTZ not ready" });
    try {
        const { command } = req.body;
        const speed = { 
            x: command === 'right' ? 0.5 : command === 'left' ? -0.5 : 0, 
            y: command === 'up' ? 0.5 : command === 'down' ? -0.5 : 0, 
            z: 0 
        };
        if (command === 'stop') await device.ptzStop();
        else await device.ptzMove({ speed });
        res.json({ status: 'ok' });
    } catch (err) {
        res.status(500).json({ error: err.message }); 
    }
});

// --- 2. Live Stream (WebSocket Port 9999) ---
const wss = new WebSocket.Server({ port: 9999 });
wss.on('connection', (ws) => {
    const ffmpeg = spawn('ffmpeg', [
        '-rtsp_transport', 'tcp',
        '-i', `rtsp://admin:${password}@${cameraIP}:554/Streaming/Channels/102`,
        '-f', 'mpegts', '-codec:v', 'mpeg1video', '-an',
        '-vf', 'scale=640:360', '-b:v', '1000k', '-r', '20', '-bf', '0', '-'
    ]);
    ffmpeg.stdout.on('data', (data) => { if (ws.readyState === WebSocket.OPEN) ws.send(data); });
    ws.on('close', () => { ffmpeg.kill(); });
});

// --- 3. Playback API (Port 9998) ---
let playbackStream = null;

app.post('/api/playback', (req, res) => {
    const { startTime, endTime } = req.body;
    // แปลงเวลาให้เป็น Format Hikvision: YYYYMMDDTHHMMSSZ
    const formatTime = (iso) => iso.replace(/[-:]/g, '').split('.')[0] + 'Z';
    const playbackUrl = `rtsp://admin:${password}@${cameraIP}:554/Streaming/tracks/101?starttime=${formatTime(startTime)}&endtime=${formatTime(endTime)}`;

    if (playbackStream) {
        playbackStream.stop();
        playbackStream = null;
    }

    try {
        playbackStream = new Stream({
            name: 'Playback',
            streamUrl: playbackUrl,
            wsPort: 9998,
            ffmpegOptions: { 
                '-rtsp_transport': 'tcp',
                '-codec:v': 'mpeg1video',
                '-b:v': '1000k',
                '-r': '20',
                '-an': '' 
            }
        });
        res.json({ success: true, url: playbackUrl });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.post('/api/stop-playback', (req, res) => {
    if (playbackStream) {
        playbackStream.stop();
        playbackStream = null;
    }
    res.json({ success: true });
});

// --- 4. Proxy & Server Start ---
const liveProxy = createProxyMiddleware({ target: 'http://127.0.0.1:9999', ws: true });
const playbackProxy = createProxyMiddleware({ target: 'http://127.0.0.1:9998', ws: true });

app.use('/ws-live', liveProxy);
app.use('/ws-playback', playbackProxy);

const server = app.listen(port, () => console.log(`🚀 Server running on port ${port}`));
server.on('upgrade', (req, socket, head) => {
    if (req.url.startsWith('/ws-live')) liveProxy.upgrade(req, socket, head);
    else if (req.url.startsWith('/ws-playback')) playbackProxy.upgrade(req, socket, head);
    else socket.destroy();
});