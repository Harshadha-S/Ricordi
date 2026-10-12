const http = require('http');
const { spawn } = require('child_process');

const CHROME_PATH = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
const PORT = 9222;

async function run() {
  const chromeProc = spawn(CHROME_PATH, [
    `--remote-debugging-port=${PORT}`,
    '--headless=new',
    '--disable-gpu',
    '--no-sandbox',
    '--user-data-dir=C:\\Users\\harsh\\AppData\\Local\\Temp\\chrome-debug-profile-2',
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

    await new Promise(r => setTimeout(r, 1200));

    const checkRes = await send("Runtime.evaluate", {
      expression: `
        (function() {
          const ta = document.getElementById("ricordiAnswerTextarea");
          if (!ta) return { error: "Textarea not found" };

          // Try focusing and typing
          ta.focus();
          const activeElBefore = document.activeElement ? document.activeElement.tagName + "#" + document.activeElement.id : null;

          // Dispatch click on textarea
          const clickEvt = new MouseEvent('click', { bubbles: true, cancelable: true, view: window });
          const clickDispatched = ta.dispatchEvent(clickEvt);

          const activeElAfterClick = document.activeElement ? document.activeElement.tagName + "#" + document.activeElement.id : null;

          // Check parents and styles
          let cur = ta;
          const chain = [];
          while (cur && cur !== document.body) {
            const cs = window.getComputedStyle(cur);
            chain.push({
              tag: cur.tagName,
              id: cur.id,
              cls: cur.className,
              pointerEvents: cs.pointerEvents,
              userSelect: cs.userSelect,
              zIndex: cs.zIndex,
              opacity: cs.opacity,
              display: cs.display,
              visibility: cs.visibility,
              transform: cs.transform
            });
            cur = cur.parentElement;
          }

          // Check elementFromPoint with scroll/zoom accounted
          const r = ta.getBoundingClientRect();
          const cx = Math.floor(r.left + r.width / 2);
          const cy = Math.floor(r.top + r.height / 2);
          const topEl = document.elementFromPoint(cx, cy);

          // Check all elements in DOM that have high z-index or fixed/absolute position
          const allElements = Array.from(document.querySelectorAll('*'));
          const overlays = [];
          for (const el of allElements) {
            const cs = window.getComputedStyle(el);
            if (cs.position === 'fixed' || cs.position === 'absolute') {
              const er = el.getBoundingClientRect();
              if (er.width > 0 && er.height > 0) {
                // Check if it intersects textarea
                const intersects = !(er.right < r.left || er.left > r.right || er.bottom < r.top || er.top > r.bottom);
                if (intersects) {
                  overlays.push({
                    tag: el.tagName,
                    id: el.id,
                    cls: el.className,
                    position: cs.position,
                    zIndex: cs.zIndex,
                    pointerEvents: cs.pointerEvents,
                    rect: { left: er.left, top: er.top, width: er.width, height: er.height }
                  });
                }
              }
            }
          }

          return {
            activeElBefore,
            activeElAfterClick,
            topEl: topEl ? { tag: topEl.tagName, id: topEl.id, cls: topEl.className } : null,
            targetCenter: { cx, cy, windowWidth: window.innerWidth, windowHeight: window.innerHeight },
            chain,
            overlays
          };
        })()
      `,
      returnByValue: true
    });

    console.log("Deep diagnosis result:\n", JSON.stringify(checkRes.result.value, null, 2));

    ws.close();
    chromeProc.kill();
  };
}

run().catch(console.error);
