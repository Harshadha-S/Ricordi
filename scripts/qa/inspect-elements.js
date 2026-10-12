const http = require('http');
const { spawn } = require('child_process');

// Simple WebSocket client implementation without extra npm dependencies
// Or we can use Node's built-in fetch / WebSocket if available (Node 22+)
const CHROME_PATH = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
const PORT = 9222;

async function run() {
  const chromeProc = spawn(CHROME_PATH, [
    `--remote-debugging-port=${PORT}`,
    '--headless=new',
    '--disable-gpu',
    '--no-sandbox',
    '--user-data-dir=C:\\Users\\harsh\\AppData\\Local\\Temp\\chrome-debug-profile',
    'http://localhost:8080'
  ]);

  await new Promise(r => setTimeout(r, 2000));

  const listRes = await fetch(`http://localhost:${PORT}/json/list`).then(r => r.json());
  const page = listRes.find(t => t.url.includes('8080'));
  if (!page) {
    console.error("Page target not found in", listRes);
    chromeProc.kill();
    return;
  }

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
    } else {
      if (msg.method === "Runtime.consoleAPICalled") {
        console.log("[BROWSER CONSOLE]", msg.params.type, msg.params.args.map(a => a.value || a.description).join(' '));
      } else if (msg.method === "Runtime.exceptionThrown") {
        console.error("[BROWSER EXCEPTION]", msg.params.exceptionDetails);
      } else if (msg.method === "Network.responseReceived") {
        if (msg.params.response.status >= 400) {
          console.error("[NETWORK ERROR]", msg.params.response.status, msg.params.response.url);
        }
      }
    }
  };

  ws.onopen = async () => {
    console.log("Connected to Chrome DevTools Protocol");
    await send("Runtime.enable");
    await send("Page.enable");
    await send("Network.enable");

    // Wait 2 seconds for initial page scripts and fetches
    await new Promise(r => setTimeout(r, 2000));

    // 1. Open Album
    console.log("--- Executing RicordiAlbum.open() ---");
    const openRes = await send("Runtime.evaluate", {
      expression: `
        (function() {
          const btn = document.getElementById("ricordiToggleBtn");
          if (btn) btn.click();
          return {
            isOpen: document.getElementById("ricordi-album-master")?.classList.contains("is-open"),
            buttonText: btn?.innerText
          };
        })()
      `,
      returnByValue: true
    });
    console.log("Album open result:", openRes.result.value);

    // Wait 1 second for transition
    await new Promise(r => setTimeout(r, 1200));

    // 2. Element From Point check at center of textarea and center of upload area
    console.log("--- Testing elementFromPoint ---");
    const efpRes = await send("Runtime.evaluate", {
      expression: `
        (function() {
          const ta = document.getElementById("ricordiAnswerTextarea");
          let taInfo = null;
          if (ta) {
            const r = ta.getBoundingClientRect();
            const cx = r.left + r.width / 2;
            const cy = r.top + r.height / 2;
            const topEl = document.elementFromPoint(cx, cy);
            taInfo = {
              rect: { left: r.left, top: r.top, width: r.width, height: r.height },
              center: { x: cx, y: cy },
              topElementTag: topEl ? topEl.tagName : null,
              topElementId: topEl ? topEl.id : null,
              topElementClass: topEl ? topEl.className : null,
              topElementOuterHTML: topEl ? topEl.outerHTML.substring(0, 150) : null,
              isDirectMatch: (topEl === ta)
            };
          }

          const fileInput = document.getElementById("ricordiFilePondInput");
          const uploadWrap = document.getElementById("ricordiUploadArea");
          let uploadInfo = null;
          if (uploadWrap) {
            const r = uploadWrap.getBoundingClientRect();
            const cx = r.left + r.width / 2;
            const cy = r.top + r.height / 2;
            const topEl = document.elementFromPoint(cx, cy);
            uploadInfo = {
              rect: { left: r.left, top: r.top, width: r.width, height: r.height },
              center: { x: cx, y: cy },
              topElementTag: topEl ? topEl.tagName : null,
              topElementId: topEl ? topEl.id : null,
              topElementClass: topEl ? topEl.className : null,
              topElementOuterHTML: topEl ? topEl.outerHTML.substring(0, 150) : null
            };
          }

          // Check all elements with highest z-indexes or overlapping spread
          const spread = document.getElementById("ricordiSpread");
          const spreadRect = spread ? spread.getBoundingClientRect() : null;

          return { taInfo, uploadInfo, spreadRect };
        })()
      `,
      returnByValue: true
    });
    console.log("elementFromPoint report:", JSON.stringify(efpRes.result.value, null, 2));

    // 3. Check stray paper strip / turning leaf / cover assembly
    console.log("--- Checking overlay elements ---");
    const overlayRes = await send("Runtime.evaluate", {
      expression: `
        (function() {
          const frontAssembly = document.getElementById("ricordiFrontAssembly");
          const backFace = document.querySelector(".ricordi-album-front-backface");
          const turningLeaf = document.getElementById("ricordiTurningLeaf");
          const seam = document.querySelector(".ricordi-spread-spine-seam");

          function getStyles(el) {
            if (!el) return null;
            const cs = window.getComputedStyle(el);
            const r = el.getBoundingClientRect();
            return {
              display: cs.display,
              visibility: cs.visibility,
              pointerEvents: cs.pointerEvents,
              zIndex: cs.zIndex,
              transform: cs.transform,
              rect: { left: r.left, top: r.top, width: r.width, height: r.height }
            };
          }

          return {
            frontAssembly: getStyles(frontAssembly),
            backFace: getStyles(backFace),
            turningLeaf: getStyles(turningLeaf),
            seam: getStyles(seam)
          };
        })()
      `,
      returnByValue: true
    });
    console.log("Overlay styles report:", JSON.stringify(overlayRes.result.value, null, 2));

    ws.close();
    chromeProc.kill();
  };
}

run().catch(err => console.error("Script error:", err));
