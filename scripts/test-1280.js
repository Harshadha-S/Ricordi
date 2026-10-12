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
    '--user-data-dir=C:\\Users\\harsh\\AppData\\Local\\Temp\\chrome-debug-profile-3',
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

    // Test injecting style adjustments
    const testResult = await send("Runtime.evaluate", {
      expression: `
        (function() {
          const style = document.createElement('style');
          style.id = 'test-fix-style';
          style.textContent = '.ricordi-album.is-open { pointer-events: none !important; } .ricordi-album.is-open .ricordi-album-pages-stack, .ricordi-album.is-open .ricordi-spread, .ricordi-album.is-open .ricordi-page-left, .ricordi-album.is-open .ricordi-page-right, .ricordi-album.is-open .ricordi-journal-editor-wrap, .ricordi-album.is-open #ricordiAnswerTextarea, .ricordi-album.is-open .ricordi-upload-area, .ricordi-album.is-open .filepond--root, .ricordi-album.is-open .filepond--drop-label { pointer-events: auto !important; }';
          document.head.appendChild(style);

          const ta = document.getElementById("ricordiAnswerTextarea");
          const r = ta ? ta.getBoundingClientRect() : null;
          const cx = r ? Math.floor(r.left + r.width / 2) : 0;
          const cy = r ? Math.floor(r.top + r.height / 2) : 0;
          const topEl = document.elementFromPoint(cx, cy);

          const fp = document.querySelector(".filepond--root") || document.getElementById("ricordiFilePondInput");
          const fpr = fp ? fp.getBoundingClientRect() : null;
          const fpcx = fpr ? Math.floor(fpr.left + fpr.width / 2) : 0;
          const fpcy = fpr ? Math.floor(fpr.top + fpr.height / 2) : 0;
          const fpTopEl = document.elementFromPoint(fpcx, fpcy);

          return {
            taTopEl: topEl ? { tag: topEl.tagName, id: topEl.id, cls: topEl.className } : null,
            fpTopEl: fpTopEl ? { tag: fpTopEl.tagName, id: fpTopEl.id, cls: fpTopEl.className } : null
          };
        })()
      `,
      returnByValue: true
    });
    console.log("With translateZ(2px):", JSON.stringify(testResult.result.value, null, 2));

    const res = await send("Runtime.evaluate", {
      expression: `
        (function() {
          const ta = document.getElementById("ricordiAnswerTextarea");
          const r = ta ? ta.getBoundingClientRect() : null;
          const cx = r ? Math.floor(r.left + r.width / 2) : 0;
          const cy = r ? Math.floor(r.top + r.height / 2) : 0;
          const topEl = document.elementFromPoint(cx, cy);

          const fp = document.querySelector(".filepond--root") || document.getElementById("ricordiFilePondInput");
          const fpr = fp ? fp.getBoundingClientRect() : null;
          const fpcx = fpr ? Math.floor(fpr.left + fpr.width / 2) : 0;
          const fpcy = fpr ? Math.floor(fpr.top + fpr.height / 2) : 0;
          const fpTopEl = document.elementFromPoint(fpcx, fpcy);

          return {
            windowSize: { w: window.innerWidth, h: window.innerHeight },
            taRect: r,
            taCenter: { cx, cy },
            taTopEl: topEl ? { tag: topEl.tagName, id: topEl.id, cls: topEl.className } : null,
            fpRect: fpr,
            fpCenter: { fpcx, fpcy },
            fpTopEl: fpTopEl ? { tag: fpTopEl.tagName, id: fpTopEl.id, cls: fpTopEl.className } : null
          };
        })()
      `,
      returnByValue: true
    });

    console.log("Window 1280x900 test result:\n", JSON.stringify(res.result.value, null, 2));

    ws.close();
    chromeProc.kill();
  };
}

run().catch(console.error);
