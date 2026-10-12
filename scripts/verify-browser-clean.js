const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

const CHROME_PATH = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
const PORT = 9222;

async function run() {
  console.log("=== Running Headless Chrome Browser Verification ===");
  const chromeProc = spawn(CHROME_PATH, [
    `--remote-debugging-port=${PORT}`,
    '--headless=new',
    '--disable-gpu',
    '--no-sandbox',
    '--window-size=1280,900',
    '--user-data-dir=C:\\Users\\harsh\\AppData\\Local\\Temp\\chrome-debug-verify-cleanup-' + Date.now(),
    'http://localhost:8080'
  ]);

  await new Promise(r => setTimeout(r, 2500));
  const list = await fetch(`http://localhost:${PORT}/json/list`).then(r => r.json());
  const page = list.find(t => t.url.includes('8080'));
  const ws = new WebSocket(page.webSocketDebuggerUrl);

  let idCounter = 1;
  const callbacks = new Map();
  const failedRequests = [];
  const consoleErrors = [];

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
      const resp = msg.params.response;
      if (resp.status >= 400) {
        failedRequests.push({ url: resp.url, status: resp.status });
      }
    }
    if (msg.method === "Runtime.consoleAPICalled") {
      if (msg.params.type === "error") {
        consoleErrors.push(msg.params.args.map(a => a.value).join(' '));
      }
    }
    if (msg.id && callbacks.has(msg.id)) {
      const cb = callbacks.get(msg.id);
      callbacks.delete(msg.id);
      if (msg.error) cb.reject(msg.error);
      else cb.resolve(msg.result);
    }
  };

  await new Promise(r => ws.onopen = r);
  await send("Page.enable");
  await send("Network.enable");
  await send("Runtime.enable");

  await new Promise(r => setTimeout(r, 1500));

  const scratchDir = path.resolve("scratch");
  if (!fs.existsSync(scratchDir)) fs.mkdirSync(scratchDir, { recursive: true });

  console.log("Capturing closed album screenshot...");
  const shot1 = await send("Page.captureScreenshot", { format: "png" });
  fs.writeFileSync(path.resolve(scratchDir, "app-closed-clean.png"), Buffer.from(shot1.data, 'base64'));

  console.log("Opening album...");
  await send("Runtime.evaluate", {
    expression: `document.getElementById("ricordiToggleBtn").click();`
  });
  await new Promise(r => setTimeout(r, 1500));

  console.log("Capturing open album screenshot...");
  const shot2 = await send("Page.captureScreenshot", { format: "png" });
  fs.writeFileSync(path.resolve("scratch/app-open-clean.png"), Buffer.from(shot2.data, 'base64'));

  // Test typing in journal
  await send("Runtime.evaluate", {
    expression: `
      (function() {
        const ta = document.getElementById("ricordiAnswerTextarea");
        ta.value = "Testing persistent journal after cleanup.";
        ta.dispatchEvent(new Event("input", { bubbles: true }));
      })()
    `
  });
  await new Promise(r => setTimeout(r, 1500));

  const checkState = await send("Runtime.evaluate", {
    expression: `
      (function() {
        return {
          questionText: document.getElementById("ricordiQuestionText")?.textContent,
          questionNumber: document.getElementById("ricordiQuestionNum")?.textContent,
          saveStatus: document.getElementById("ricordiSaveStatus")?.textContent,
          wordCount: document.getElementById("ricordiWordCount")?.textContent,
          brandLogoExists: !!document.querySelector(".brand-logo"),
          openmojiImages: document.querySelectorAll("img[src*='openmoji']").length
        };
      })()
    `,
    returnByValue: true
  });
  console.log("App live state:", JSON.stringify(checkState.result.value, null, 2));

  console.log("Failed HTTP requests (>= 400):", failedRequests);
  console.log("Console errors:", consoleErrors);

  ws.close();
  chromeProc.kill();
  console.log("=== Browser Verification Finished ===");
}

run().catch(console.error);
