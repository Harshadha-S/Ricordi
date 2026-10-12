const { spawn } = require('child_process');

const CHROME_PATH = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
const PORT = 9222;

async function run() {
  const chromeProc = spawn(CHROME_PATH, [
    `--remote-debugging-port=${PORT}`,
    '--headless=new',
    '--disable-gpu',
    '--no-sandbox',
    '--window-size=1280,900',
    '--user-data-dir=C:\\Users\\harsh\\AppData\\Local\\Temp\\chrome-debug-profile-4',
    'http://localhost:8080'
  ]);

  await new Promise(r => setTimeout(r, 2000));

  const listRes = await fetch(`http://localhost:${PORT}/json/list`).then(r => r.json());
  const page = listRes.find(t => t.url.includes('8080'));
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

  ws.onopen = async () => {
    await send("Runtime.enable");
    await send("Page.enable");

    // Open album
    await send("Runtime.evaluate", {
      expression: `
        document.getElementById("ricordiToggleBtn").click();
      `
    });

    await new Promise(r => setTimeout(r, 1500));

    // Test why ricordi-album was returned
    const res = await send("Runtime.evaluate", {
      expression: `
        (function() {
          const album = document.getElementById("ricordi-album-master");
          const stack = document.querySelector(".ricordi-album-pages-stack");
          const spread = document.getElementById("ricordiSpread");
          const leftPage = document.getElementById("ricordiPageLeft");
          const ta = document.getElementById("ricordiAnswerTextarea");

          const r = ta.getBoundingClientRect();
          const cx = Math.floor(r.left + r.width / 2);
          const cy = Math.floor(r.top + r.height / 2);
          const topElAtTa = document.elementFromPoint(cx, cy);

          const fp = document.querySelector(".filepond--root") || document.getElementById("ricordiFilePondInput");
          const fpr = fp ? fp.getBoundingClientRect() : null;
          const fpcx = fpr ? Math.floor(fpr.left + fpr.width / 2) : 0;
          const fpcy = fpr ? Math.floor(fpr.top + fpr.height / 2) : 0;
          const topElAtFp = document.elementFromPoint(fpcx, fpcy);

          return {
            topElAtTa: topElAtTa ? { tag: topElAtTa.tagName, id: topElAtTa.id, cls: topElAtTa.className } : null,
            topElAtFp: topElAtFp ? { tag: topElAtFp.tagName, id: topElAtFp.id, cls: topElAtFp.className } : null,
            stackZ: window.getComputedStyle(stack).transform,
            albumTransform: window.getComputedStyle(album).transform
          };
        })()
      `,
      returnByValue: true
    });

    console.log("elementsFromPoint:\n", JSON.stringify(res.result.value, null, 2));

    ws.close();
    chromeProc.kill();
  };
}

run().catch(console.error);
