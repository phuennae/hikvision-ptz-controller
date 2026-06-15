const onvif = require('node-onvif');

// ตั้งค่าข้อมูลกล้องของคุณ
let device = new onvif.OnvifDevice({
  xaddr: 'http://192.168.1.64:80/onvif/device_service', // IP ของกล้องคุณ
  user: 'admin', // Username ที่เพิ่งสร้างในหน้า ONVIF
  pass: 'devphuenpa2546' // เปลี่ยนเป็นรหัสผ่านที่คุณตั้งไว้
});

console.log('กำลังพยายามเชื่อมต่อกล้อง...');

// เริ่มการเชื่อมต่อ
device.init().then(() => {
  console.log('✅ เชื่อมต่อกล้องสำเร็จ!');

  // ดึงข้อมูลพื้นฐานของกล้องมาดู
  let info = device.getInformation();
  console.log('--- ข้อมูลกล้อง ---');
  console.log(`ผู้ผลิต: ${info.Manufacturer}`);
  console.log(`รุ่น: ${info.Model}`);
  console.log(`Firmware: ${info.FirmwareVersion}`);

}).catch((error) => {
  console.error('❌ เชื่อมต่อไม่สำเร็จ ลองเช็ค IP, User, Password หรือการตั้งค่าเครือข่ายดูนะครับ');
  console.error(error);
});