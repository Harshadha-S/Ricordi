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
    '--window-size=1280,900',
    '--user-data-dir=C:\\Users\\harsh\\AppData\\Local\\Temp\\chrome-debug-app-' + Date.now(),
    'http://localhost:8080'
  ]);

  await new Promise(r => setTimeout(r, 2500));
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
  await send("Runtime.enable");

  // Screenshot 1: Closed album with header logo
  await new Promise(r => setTimeout(r, 1500));
  const shot1 = await send("Page.captureScreenshot", { format: "png" });
  fs.writeFileSync(path.resolve("scratch/app-closed.png"), Buffer.from(shot1.data, 'base64'));
  console.log("Saved scratch/app-closed.png");

  // Open album
  await send("Runtime.evaluate", {
    expression: `document.getElementById("ricordiToggleBtn").click();`
  });
  await new Promise(r => setTimeout(r, 1500));

  // Screenshot 2: Open spread
  const shot2 = await send("Page.captureScreenshot", { format: "png" });
  fs.writeFileSync(path.resolve("scratch/app-open.png"), Buffer.from(shot2.data, 'base64'));
  console.log("Saved scratch/app-open.png");

  ws.close();
  chromeProc.kill();
}
run().catch(console.error);
