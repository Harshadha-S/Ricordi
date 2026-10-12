const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

const CHROME_PATH = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
const PORT = 9222;

async function run() {
  const chromeProc = spawn(CHROME_PATH, [
    `--remote-debugging-port=${PORT}`,
    '--headless=new',
    '--disable-gpu',
    '--no-sandbox',
    '--window-size=1200,900',
    '--user-data-dir=C:\\Users\\harsh\\AppData\\Local\\Temp\\chrome-debug-shot-' + Date.now(),
    'http://localhost:8080'
  ]);

  await new Promise(r => setTimeout(r, 2000));
  const list = await fetch(`http://localhost:${PORT}/json/list`).then(r => r.json());
  const page = list.find(t => t.url.includes('8080'));
  const ws = new WebSocket(page.webSocketDebuggerUrl);

  let idCounter = 1;
  const callbacks = new Map();
  function send(method, params = {}) {
    return new Promise((resolve, reject) => {
      const id = idCounter++;
      callbacks.set(id, { resolve, reject });
      ws.send(JSON.stringify({ id, method, params }));
    });
  }
  ws.onmessage = (event) => {
    const msg = JSON.parse(event.data);
    if (msg.id && callbacks.has(msg.id)) {
      const cb = callbacks.get(msg.id);
      callbacks.delete(msg.id);
      if (msg.error) cb.reject(msg.error);
      else cb.resolve(msg.result);
    }
  };

  await new Promise(r => ws.onopen = r);
  await send("Page.enable");

  // Navigate to scratch/view-favicon.html
  const fileUrl = "file:///" + path.resolve("scratch/view-favicon.html").replace(/\\/g, '/');
  await send("Page.navigate", { url: fileUrl });
  await new Promise(r => setTimeout(r, 1500));

  const shot = await send("Page.captureScreenshot", { format: "png" });
  const outPath = path.resolve("scratch/favicon-preview.png");
  fs.writeFileSync(outPath, Buffer.from(shot.data, 'base64'));
  console.log("Screenshot written to:", outPath);

  ws.close();
  chromeProc.kill();
}
run().catch(console.error);
