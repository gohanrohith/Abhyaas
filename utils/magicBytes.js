const fs = require('fs');

function isValidImage(filePath) {
  const buf = Buffer.alloc(12);
  let fd;
  try {
    fd = fs.openSync(filePath, 'r');
    fs.readSync(fd, buf, 0, 12, 0);
  } catch { return false; }
  finally { if (fd !== undefined) try { fs.closeSync(fd); } catch {} }

  const jpg  = buf[0] === 0xFF && buf[1] === 0xD8 && buf[2] === 0xFF;
  const png  = buf[0] === 0x89 && buf[1] === 0x50 && buf[2] === 0x4E && buf[3] === 0x47;
  const gif  = buf[0] === 0x47 && buf[1] === 0x49 && buf[2] === 0x46;
  const webp = buf[8] === 0x57 && buf[9] === 0x45 && buf[10] === 0x42 && buf[11] === 0x50;
  return jpg || png || gif || webp;
}

function isValidDocument(filePath) {
  const buf = Buffer.alloc(8);
  let fd;
  try {
    fd = fs.openSync(filePath, 'r');
    fs.readSync(fd, buf, 0, 8, 0);
  } catch { return false; }
  finally { if (fd !== undefined) try { fs.closeSync(fd); } catch {} }

  const pdf  = buf[0] === 0x25 && buf[1] === 0x50 && buf[2] === 0x44 && buf[3] === 0x46;
  const doc  = buf[0] === 0xD0 && buf[1] === 0xCF;
  const docx = buf[0] === 0x50 && buf[1] === 0x4B;
  return pdf || doc || docx;
}

module.exports = { isValidImage, isValidDocument };
