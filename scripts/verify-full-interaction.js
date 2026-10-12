const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

const CHROME_PATH = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
const PORT = 9222;

async function run() {
  console.log("=== Starting End-to-End Real Browser Verification ===");
  const chromeProc = spawn(CHROME_PATH, [
    `--remote-debugging-port=${PORT}`,
    '--headless=new',
    '--disable-gpu',
    '--no-sandbox',
    '--window-size=1280,900',
    '--user-data-dir=C:\\Users\\harsh\\AppData\\Local\\Temp\\chrome-debug-verify-' + Date.now(),
    'http://localhost:8080'
  ]);

  await new Promise(r => setTimeout(r, 2500));

  const listRes = await fetch(`http://localhost:${PORT}/json/list`).then(r => r.json());
  const page = listRes.find(t => t.url.includes('8080'));
  if (!page) throw new Error("Could not find page target on port 8080");

  const ws = new WebSocket(page.webSocketDebuggerUrl);

  let idCounter = 1;
  const callbacks = new Map();
  const networkEvents = [];
  const consoleMessages = [];

  function send(method, params = {}) {
    return new Promise((resolve, reject) => {
      const id = idCounter++;
      callbacks.set(id, { resolve, reject });
      ws.send(JSON.stringify({ id, method, params }));
    });
  }

  ws.onmessage = (event) => {
    const msg = JSON.parse(event.data);
    if (msg.method === "Network.responseReceived") {
      networkEvents.push(msg.params);
    }
    if (msg.method === "Runtime.consoleAPICalled") {
      consoleMessages.push(msg.params);
    }
    if (msg.id && callbacks.has(msg.id)) {
      const cb = callbacks.get(msg.id);
      callbacks.delete(msg.id);
      if (msg.error) cb.reject(msg.error);
      else cb.resolve(msg.result);
    }
  };

  await new Promise(r => ws.onopen = r);

  await send("Runtime.enable");
  await send("Page.enable");
  await send("DOM.enable");
  await send("Network.enable");

  console.log("1. Opening album...");
  await send("Runtime.evaluate", {
    expression: `document.getElementById("ricordiToggleBtn").click();`
  });
  await new Promise(r => setTimeout(r, 1200));

  console.log("2. Verifying open album state and element hit-testing...");
  const hitTest = await send("Runtime.evaluate", {
    expression: `
      (function() {
        const ta = document.getElementById("ricordiAnswerTextarea");
        const tar = ta.getBoundingClientRect();
        const topElTa = document.elementFromPoint(Math.floor(tar.left + tar.width/2), Math.floor(tar.top + tar.height/2));

        const fp = document.querySelector(".filepond--root");
        const fpr = fp ? fp.getBoundingClientRect() : null;
        const topElFp = fpr ? document.elementFromPoint(Math.floor(fpr.left + fpr.width/2), Math.floor(fpr.top + fpr.height/2)) : null;

        return {
          taVisible: !!(ta && tar.width > 0 && tar.height > 0),
          topElTa: topElTa ? { tag: topElTa.tagName, id: topElTa.id, cls: topElTa.className } : null,
          fpVisible: !!(fp && fpr.width > 0 && fpr.height > 0),
          topElFp: topElFp ? { tag: topElFp.tagName, id: topElFp.id, cls: topElFp.className } : null
        };
      })()
    `,
    returnByValue: true
  });
  console.log("Hit test result:", JSON.stringify(hitTest.result.value, null, 2));

  console.log("3. Testing typing into Journal Textarea...");
  // Focus and dispatch click on textarea
  await send("Runtime.evaluate", {
    expression: `
      (function() {
        const ta = document.getElementById("ricordiAnswerTextarea");
        ta.focus();
        ta.click();
      })()
    `
  });

  const testText = "Today was a peaceful and productive day in January.";
  // Type characters using Input.dispatchKeyEvent
  for (const char of testText) {
    await send("Input.dispatchKeyEvent", {
      type: "keyDown",
      text: char
    });
    await send("Input.dispatchKeyEvent", {
      type: "keyUp"
    });
    // also simulate input event if needed
  }
  // Also dispatch real input event to trigger auto-save listener
  await send("Runtime.evaluate", {
    expression: `
      (function() {
        const ta = document.getElementById("ricordiAnswerTextarea");
        ta.value = ${JSON.stringify(testText)};
        ta.dispatchEvent(new Event('input', { bubbles: true }));
      })()
    `
  });

  await new Promise(r => setTimeout(r, 600));

  const typingState = await send("Runtime.evaluate", {
    expression: `
      (function() {
        const ta = document.getElementById("ricordiAnswerTextarea");
        const wc = document.getElementById("ricordiWordCount");
        const status = document.getElementById("ricordiSaveStatus");
        return {
          value: ta.value,
          wordCountText: wc ? wc.textContent : null,
          saveStatusText: status ? status.textContent : null
        };
      })()
    `,
    returnByValue: true
  });
  console.log("Typing state:", JSON.stringify(typingState.result.value, null, 2));

  // Wait for auto-save debounce (1200ms in album.js)
  console.log("Waiting for auto-save debounce...");
  await new Promise(r => setTimeout(r, 2000));

  const afterSaveState = await send("Runtime.evaluate", {
    expression: `
      (function() {
        const status = document.getElementById("ricordiSaveStatus");
        return {
          saveStatusText: status ? status.textContent : null
        };
      })()
    `,
    returnByValue: true
  });
  console.log("Save status after debounce:", JSON.stringify(afterSaveState.result.value, null, 2));

  console.log("4. Testing photo upload via FilePond...");
  // Find FilePond input DOM node (FilePond uses input.filepond--browser)
  const doc = await send("DOM.getDocument");
  const inputNode = await send("DOM.querySelector", {
    nodeId: doc.root.nodeId,
    selector: "input.filepond--browser, input[type='file']"
  });

  const testImgPath = path.resolve("src/main/resources/static/images/paper_cover/paper-texture.png");
  console.log("Found file input nodeId:", inputNode.nodeId, "setting file:", testImgPath);

  await send("DOM.setFileInputFiles", {
    nodeId: inputNode.nodeId,
    files: [testImgPath]
  });

  // Wait for FilePond upload completion and UI update
  console.log("Waiting for upload to process...");
  await new Promise(r => setTimeout(r, 3500));

  const photoState = await send("Runtime.evaluate", {
    expression: `
      (function() {
        const container = document.getElementById("ricordiPhotoContainer");
        const polaroids = container ? container.querySelectorAll(".ricordi-scrapbook-polaroid") : [];
        const polaroidData = Array.from(polaroids).map(p => ({
          photoId: p.dataset.photoId,
          caption: p.querySelector(".ricordi-caption-input")?.value,
          imgSrc: p.querySelector("img")?.src
        }));
        return {
          polaroidsCount: polaroids.length,
          polaroidData: polaroidData
        };
      })()
    `,
    returnByValue: true
  });
  console.log("Photo state after upload:", JSON.stringify(photoState.result.value, null, 2));

  console.log("5. Testing Page Turn animation (forward and back)...");
  await send("Runtime.evaluate", {
    expression: `document.getElementById("ricordiNextDayBtn").click();`
  });
  await new Promise(r => setTimeout(r, 1200));

  const day2State = await send("Runtime.evaluate", {
    expression: `
      (function() {
        return {
          dayTitle: document.getElementById("ricordiDayTitle")?.textContent,
          dateBadge: document.getElementById("ricordiDateBadge")?.textContent
        };
      })()
    `,
    returnByValue: true
  });
  console.log("Day 2 state:", JSON.stringify(day2State.result.value, null, 2));

  // Turn back to Day 1
  await send("Runtime.evaluate", {
    expression: `document.getElementById("ricordiPrevDayBtn").click();`
  });
  await new Promise(r => setTimeout(r, 1200));

  const day1AgainState = await send("Runtime.evaluate", {
    expression: `
      (function() {
        const ta = document.getElementById("ricordiAnswerTextarea");
        return {
          dayTitle: document.getElementById("ricordiDayTitle")?.textContent,
          textareaValue: ta ? ta.value : null
        };
      })()
    `,
    returnByValue: true
  });
  console.log("Back to Day 1 state (persisted journal content):", JSON.stringify(day1AgainState.result.value, null, 2));

  console.log("Console errors/warnings:", consoleMessages.filter(m => m.type === "error" || m.type === "warning").map(m => m.args.map(a => a.value).join(' ')));
  console.log("Key API network responses:", networkEvents.filter(e => e.response.url.includes('/api/')).map(e => ({ url: e.response.url, status: e.response.status })));

  ws.close();
  chromeProc.kill();
  console.log("=== Verification Complete ===");
}

run().catch(err => {
  console.error("Verification failed:", err);
  process.exit(1);
});
