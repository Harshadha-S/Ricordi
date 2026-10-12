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
    '--disable-dev-shm-usage',
    'http://localhost:8080'
  ]);

  await new Promise(resolve => setTimeout(resolve, 3000));

  // Get debug target list
  http.get(`http://localhost:${PORT}/json/list`, (res) => {
    let body = '';
    res.on('data', chunk => body += chunk);
    res.on('end', async () => {
      try {
        const list = JSON.parse(body);
        console.log('Targets:', list.map(t => ({ id: t.id, url: t.url, ws: t.webSocketDebuggerUrl })));
        const page = list.find(t => t.url.includes('8080'));
        if (page && page.webSocketDebuggerUrl) {
          console.log('WS URL:', page.webSocketDebuggerUrl);
        }
      } catch (err) {
        console.error('Error parsing list:', err);
      } finally {
        chromeProc.kill();
      }
    });
  }).on('error', (err) => {
    console.error('HTTP error:', err);
    chromeProc.kill();
  });
}

run();
