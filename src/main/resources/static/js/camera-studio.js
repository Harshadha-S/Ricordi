/**
 * Ricordi Photo Studio
 * ---------------------------------------------------------------------------
 * Everything happens locally in the browser:
 *   - photos are read with createImageBitmap / <img>, never uploaded
 *   - nothing is written to localStorage / sessionStorage / IndexedDB
 *   - the camera is only requested after the user presses "Take photo"
 *   - the camera stream is stopped when leaving the page or cancelling
 *
 * Two looks only: "normal" (untouched) and "bw" (vintage black & white).
 * One frame only: /images/paper_cover/polaraid-frame.png
 */
(function () {
    'use strict';

    // ---- Artwork geometry (measured from the supplied PNGs) ----------------
    // polaraid-frame.png is 1086 x 1448 with a fully transparent photo opening.
    const ART = {
        FRAME_URL: '/images/paper_cover/polaraid-frame.png',
        OPEN: { x: 151, y: 145, w: 783, h: 1021 }, // transparent photo opening
        CARD: { x: 87, y: 63, w: 912, h: 1329 },   // opaque Polaroid card bounds
        PAD: 3                                      // photo tucks 3px under the frame
    };

    const MAX_FILE_BYTES = 40 * 1024 * 1024;
    const MAX_SOURCE_EDGE = 2800; // working copy limit (keeps memory & filtering fast)
    const ZOOM_MIN = 1, ZOOM_MAX = 3;

    const $ = (id) => document.getElementById(id);
    const els = {
        stage: $('cameraStage'),
        lcdCanvas: $('lcdCanvas'),
        lcdVideo: $('lcdVideo'),
        lcdPlaceholder: $('lcdPlaceholder'),
        lcdFlash: $('lcdFlash'),
        fileInput: $('photoFileInput'),
        uploadBtn: $('uploadBtn'),
        cameraBtn: $('cameraBtn'),
        cancelCameraBtn: $('cancelCameraBtn'),
        lookNormal: $('lookNormal'),
        lookBw: $('lookBw'),
        polaroidStage: $('polaroidStage'),
        polaroidCanvas: $('polaroidCanvas'),
        zoom: $('cropZoom'),
        hint: $('polaroidHint'),
        downloadBtn: $('downloadBtn'),
        status: $('studioStatus'),
        error: $('studioError'),
        backLinks: [$('studioBackLink'), $('studioBackLinkTop'), $('camHomeHotspot')].filter(Boolean)
    };
    if (!els.lcdCanvas || !els.polaroidCanvas) return;

    const state = {
        source: null,     // working canvas holding the chosen / captured photo
        look: 'normal',   // 'normal' | 'bw'
        zoom: 1,
        cx: 0, cy: 0,     // crop centre in source pixels
        stream: null,
        frame: null,      // HTMLImageElement of the Polaroid frame
        frameOk: false,
        busy: false
    };

    // ---- Small helpers -------------------------------------------------------
    function makeCanvas(w, h) {
        const c = document.createElement('canvas');
        c.width = Math.max(1, Math.round(w));
        c.height = Math.max(1, Math.round(h));
        return c;
    }
    const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));

    function setStatus(msg) {
        els.status.textContent = msg || '';
        if (msg) { els.error.hidden = true; els.error.textContent = ''; }
    }
    function setError(msg) {
        els.error.textContent = msg || '';
        els.error.hidden = !msg;
        if (msg) els.status.textContent = '';
    }

    // ---- The vintage black & white look (used for preview AND export) ---------
    function mulberry32(a) {
        return function () {
            a |= 0; a = (a + 0x6D2B79F5) | 0;
            let t = Math.imul(a ^ (a >>> 15), 1 | a);
            t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
            return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
        };
    }

    function applyVintageBW(ctx, x, y, w, h) {
        x = Math.max(0, Math.floor(x)); y = Math.max(0, Math.floor(y));
        w = Math.floor(w); h = Math.floor(h);
        if (w < 1 || h < 1) return;
        const img = ctx.getImageData(x, y, w, h);
        const d = img.data;
        const rnd = mulberry32(1987); // fixed seed: grain pattern is stable, no flicker
        for (let i = 0; i < d.length; i += 4) {
            // Rec.709 luminance keeps skin tones natural
            let v = (0.2126 * d[i] + 0.7152 * d[i + 1] + 0.0722 * d[i + 2]) / 255;
            v = 0.5 + (v - 0.5) * 1.08;          // gentle contrast
            v = 0.03 + v * 0.935;                // soft matte blacks and whites
            const n = rnd() + rnd() + rnd() - 1.5; // ~bell-shaped, std 0.5
            v += n * 0.05 * (1 - Math.abs(v * 2 - 1) * 0.55); // subtle grain, strongest in midtones
            v = v < 0 ? 0 : v > 1 ? 1 : v;
            const g = (v * 255 + 0.5) | 0;
            d[i] = d[i + 1] = d[i + 2] = g;
        }
        ctx.putImageData(img, x, y);
    }

    // ---- Crop maths ------------------------------------------------------------
    const CROP_ASPECT = (ART.OPEN.w + 2 * ART.PAD) / (ART.OPEN.h + 2 * ART.PAD);

    function getCrop() {
        const src = state.source;
        let cw, ch;
        if (src.width / src.height > CROP_ASPECT) { ch = src.height; cw = ch * CROP_ASPECT; }
        else { cw = src.width; ch = cw / CROP_ASPECT; }
        cw /= state.zoom; ch /= state.zoom;
        state.cx = clamp(state.cx, cw / 2, src.width - cw / 2);
        state.cy = clamp(state.cy, ch / 2, src.height - ch / 2);
        return { x: state.cx - cw / 2, y: state.cy - ch / 2, w: cw, h: ch };
    }

    // ---- Rendering: Polaroid composite (identical pipeline for preview & PNG) --
    function buildComposite() {
        const { OPEN, CARD, PAD } = ART;
        const out = makeCanvas(CARD.w, CARD.h);
        const ctx = out.getContext('2d');

        const pw = OPEN.w + 2 * PAD, ph = OPEN.h + 2 * PAD;
        const photo = makeCanvas(pw, ph);
        const pctx = photo.getContext('2d');
        pctx.imageSmoothingEnabled = true;
        pctx.imageSmoothingQuality = 'high';

        if (state.source) {
            pctx.fillStyle = '#ffffff'; // flatten transparent PNGs onto white
            pctx.fillRect(0, 0, pw, ph);
            const c = getCrop();
            pctx.drawImage(state.source, c.x, c.y, c.w, c.h, 0, 0, pw, ph);
            if (state.look === 'bw') applyVintageBW(pctx, 0, 0, pw, ph);
        } else {
            pctx.fillStyle = '#EFE9DE';
            pctx.fillRect(0, 0, pw, ph);
            pctx.fillStyle = 'rgba(108, 8, 32, 0.5)';
            pctx.textAlign = 'center';
            pctx.font = 'italic 600 40px "Playfair Display", Georgia, serif';
            pctx.fillText('Your photo will', pw / 2, ph / 2 - 8);
            pctx.fillText('appear here', pw / 2, ph / 2 + 44);
        }

        ctx.drawImage(photo, OPEN.x - PAD - CARD.x, OPEN.y - PAD - CARD.y);
        if (state.frame && state.frameOk) {
            ctx.drawImage(state.frame, -CARD.x, -CARD.y); // frame on top, untouched
        }
        return out;
    }

    function drawPolaroidPreview() {
        const cv = els.polaroidCanvas;
        const cssW = cv.clientWidth || 300;
        const dpr = Math.min(window.devicePixelRatio || 1, 2);
        const W = Math.round(cssW * dpr);
        const H = Math.round(W * ART.CARD.h / ART.CARD.w);
        if (cv.width !== W || cv.height !== H) { cv.width = W; cv.height = H; }
        const ctx = cv.getContext('2d');
        ctx.clearRect(0, 0, W, H);
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(buildComposite(), 0, 0, W, H);
    }

    // ---- Rendering: LCD preview inside the camera ------------------------------
    function drawLcd() {
        const cv = els.lcdCanvas;
        const cssW = cv.clientWidth || 600, cssH = cv.clientHeight || 420;
        const dpr = Math.min(window.devicePixelRatio || 1, 2);
        const W = Math.round(cssW * dpr), H = Math.round(cssH * dpr);
        if (cv.width !== W || cv.height !== H) { cv.width = W; cv.height = H; }
        const ctx = cv.getContext('2d');
        ctx.fillStyle = '#0b1015';
        ctx.fillRect(0, 0, W, H);
        if (!state.source) return;

        const sw = state.source.width, sh = state.source.height;
        const s = Math.min(W / sw, H / sh);
        const dw = sw * s, dh = sh * s;
        const ox = (W - dw) / 2, oy = (H - dh) / 2;
        ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(state.source, ox, oy, dw, dh);

        if (state.look === 'bw') {
            const ix = Math.round(ox), iy = Math.round(oy);
            applyVintageBW(ctx, ix, iy, Math.min(W - ix, Math.round(dw)), Math.min(H - iy, Math.round(dh)));
        }

        // Crop guide: the part of the photo that lands inside the Polaroid
        const c = getCrop();
        const rx = ox + c.x * s, ry = oy + c.y * s, rw = c.w * s, rh = c.h * s;
        ctx.fillStyle = 'rgba(8, 12, 16, 0.5)';
        ctx.fillRect(ox, oy, dw, ry - oy);
        ctx.fillRect(ox, ry + rh, dw, oy + dh - (ry + rh));
        ctx.fillRect(ox, ry, rx - ox, rh);
        ctx.fillRect(rx + rw, ry, ox + dw - (rx + rw), rh);

        const len = Math.max(10, Math.min(rw, rh) * 0.08);
        ctx.strokeStyle = 'rgba(255, 249, 240, 0.95)';
        ctx.lineWidth = Math.max(1.5, dpr * 1.5);
        ctx.beginPath();
        [[rx, ry, 1, 1], [rx + rw, ry, -1, 1], [rx, ry + rh, 1, -1], [rx + rw, ry + rh, -1, -1]].forEach(([x, y, sx, sy]) => {
            ctx.moveTo(x, y + sy * len); ctx.lineTo(x, y); ctx.lineTo(x + sx * len, y);
        });
        ctx.stroke();
    }

    let rafPending = false;
    function renderAll() {
        if (rafPending) return;
        rafPending = true;
        requestAnimationFrame(() => {
            rafPending = false;
            if (!els.lcdVideo.hidden) { /* live viewfinder shows <video>; skip LCD canvas */ }
            else drawLcd();
            drawPolaroidPreview();
        });
    }

    // ---- UI state --------------------------------------------------------------
    function updateUi() {
        const hasPhoto = !!state.source;
        const live = !!state.stream;
        els.lcdPlaceholder.hidden = hasPhoto || live;
        els.lcdCanvas.hidden = live;
        els.lcdVideo.hidden = !live;
        els.lcdVideo.classList.toggle('is-bw', state.look === 'bw');
        els.zoom.disabled = !hasPhoto;
        els.zoom.value = String(state.zoom);
        els.downloadBtn.disabled = !(hasPhoto && state.frameOk) || state.busy;
        els.polaroidStage.classList.toggle('has-photo', hasPhoto);
        els.hint.textContent = hasPhoto
            ? 'Drag the photo (or use arrow keys) to adjust the crop.'
            : 'Add a photo to see it in the Polaroid.';

        [els.lookNormal, els.lookBw].forEach((b) => {
            const on = b.dataset.look === state.look;
            b.setAttribute('aria-checked', on ? 'true' : 'false');
            b.tabIndex = on ? 0 : -1;
        });

        els.cameraBtn.textContent = live ? 'Capture' : 'Take photo';
        els.cameraBtn.classList.toggle('is-live', live);
        els.cancelCameraBtn.hidden = !live;
    }

    function setLook(look) {
        if (look !== 'normal' && look !== 'bw') return;
        state.look = look;
        updateUi();
        renderAll();
        setStatus(look === 'bw' ? 'Vintage Black & White look applied.' : 'Normal look: original colours.');
    }

    function setZoom(z) {
        if (!state.source) { setStatus('Choose a photo first, then adjust the crop.'); return; }
        state.zoom = clamp(Math.round(z * 100) / 100, ZOOM_MIN, ZOOM_MAX);
        updateUi();
        renderAll();
    }

    // ---- Loading photos --------------------------------------------------------
    function adoptSource(drawable, w, h) {
        const scale = Math.min(1, MAX_SOURCE_EDGE / Math.max(w, h));
        const c = makeCanvas(w * scale, h * scale);
        const cctx = c.getContext('2d');
        cctx.imageSmoothingQuality = 'high';
        cctx.drawImage(drawable, 0, 0, c.width, c.height);
        state.source = c;
        state.zoom = 1;
        state.cx = c.width / 2;
        state.cy = c.height / 2;
    }

    function decodeWithImageElement(file) {
        return new Promise((resolve, reject) => {
            const url = URL.createObjectURL(file);
            const img = new Image();
            img.onload = () => { resolve({ drawable: img, w: img.naturalWidth, h: img.naturalHeight, done: () => URL.revokeObjectURL(url) }); };
            img.onerror = () => { URL.revokeObjectURL(url); reject(new Error('decode')); };
            img.src = url;
        });
    }

    async function loadFile(file) {
        if (!file) return;
        stopCamera(true);
        setError('');

        const looksLikeImage = /^image\//i.test(file.type) || /\.(jpe?g|png|webp|gif|bmp|avif)$/i.test(file.name);
        if (!looksLikeImage) {
            setError('That file isn\u2019t an image. Please choose a JPEG, PNG or WebP photo.');
            return;
        }
        if (/heic|heif/i.test(file.type) || /\.(heic|heif)$/i.test(file.name)) {
            setError('HEIC photos aren\u2019t supported by most browsers. Please export the photo as JPEG or PNG and try again.');
            return;
        }
        if (file.size > MAX_FILE_BYTES) {
            setError('That photo is too large (over 40 MB). Please choose a smaller one.');
            return;
        }
        if (file.size === 0) {
            setError('That file is empty. Please choose another photo.');
            return;
        }

        setStatus('Loading your photo\u2026');
        try {
            let decoded = null;
            if (typeof createImageBitmap === 'function') {
                try {
                    const bmp = await createImageBitmap(file); // honours EXIF orientation
                    decoded = { drawable: bmp, w: bmp.width, h: bmp.height, done: () => bmp.close && bmp.close() };
                } catch (e) { decoded = null; }
            }
            if (!decoded) decoded = await decodeWithImageElement(file);
            if (!decoded.w || !decoded.h) throw new Error('empty');
            adoptSource(decoded.drawable, decoded.w, decoded.h);
            decoded.done();
        } catch (e) {
            setError('We couldn\u2019t read that image. It may be damaged or in a format your browser can\u2019t open. Try a JPEG or PNG.');
            return;
        }
        updateUi();
        renderAll();
        setStatus('Photo ready. Drag it inside the Polaroid to adjust the crop.');
    }

    // ---- Device camera (permission only after the user asks) -------------------
    async function startCamera() {
        setError('');
        if (!navigator.mediaDevices || typeof navigator.mediaDevices.getUserMedia !== 'function') {
            setError('Camera access isn\u2019t available here. It needs a modern browser and a secure (https) connection. You can still upload a photo.');
            return;
        }
        setStatus('Asking for camera access\u2026 please choose \u201CAllow\u201D in your browser prompt.');
        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                video: { facingMode: { ideal: 'environment' }, width: { ideal: 1920 }, height: { ideal: 1440 } },
                audio: false
            });
            state.stream = stream;
            els.lcdVideo.srcObject = stream;
            await els.lcdVideo.play().catch(() => { /* autoplay quirks: user gesture already given */ });
            updateUi();
            setStatus('Camera is on. Press Capture when you\u2019re ready.');
            els.cameraBtn.focus();
        } catch (err) {
            state.stream = null;
            const name = err && err.name;
            if (name === 'NotAllowedError' || name === 'SecurityError') {
                setError('Camera permission was declined. You can allow it in your browser settings, or simply upload a photo instead.');
            } else if (name === 'NotFoundError' || name === 'OverconstrainedError') {
                setError('No camera was found on this device. You can upload a photo instead.');
            } else if (name === 'NotReadableError') {
                setError('The camera is busy in another app. Close it and try again, or upload a photo.');
            } else {
                setError('We couldn\u2019t start the camera. You can upload a photo instead.');
            }
            updateUi();
        }
    }

    function stopCamera(silent) {
        if (state.stream) {
            state.stream.getTracks().forEach((t) => t.stop());
            state.stream = null;
        }
        els.lcdVideo.pause();
        els.lcdVideo.srcObject = null;
        updateUi();
        if (!silent) setStatus('Camera turned off.');
    }

    function captureFrame() {
        const v = els.lcdVideo;
        if (!state.stream || !v.videoWidth || !v.videoHeight) {
            setError('The camera isn\u2019t ready yet. Please wait a moment and try again.');
            return;
        }
        try {
            adoptSource(v, v.videoWidth, v.videoHeight);
        } catch (e) {
            setError('We couldn\u2019t capture that frame. Please try again.');
            return;
        }
        els.lcdFlash.classList.remove('is-flashing');
        void els.lcdFlash.offsetWidth; // restart the (reduced-motion-safe) flash
        els.lcdFlash.classList.add('is-flashing');
        stopCamera(true);
        updateUi();
        renderAll();
        setStatus('Photo captured. Drag it inside the Polaroid to adjust the crop.');
    }

    function onCameraButton() {
        if (state.stream) captureFrame(); else startCamera();
    }

    // ---- Download --------------------------------------------------------------
    function downloadPolaroid() {
        if (!state.source) { setStatus('Choose a photo first, then download your Polaroid.'); return; }
        if (!state.frameOk) { setError('The Polaroid frame didn\u2019t load, so the image can\u2019t be exported. Please refresh the page.'); return; }
        if (state.busy) return;
        state.busy = true;
        updateUi();
        setStatus('Preparing your Polaroid\u2026');
        try {
            const composite = buildComposite(); // same pipeline as the preview, at full frame resolution
            composite.toBlob((blob) => {
                state.busy = false;
                updateUi();
                if (!blob) {
                    setError('We couldn\u2019t create the PNG. Try a smaller photo or a different browser.');
                    return;
                }
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = state.look === 'bw' ? 'ricordi-polaroid-bw.png' : 'ricordi-polaroid.png';
                document.body.appendChild(a);
                a.click();
                a.remove();
                setTimeout(() => URL.revokeObjectURL(url), 4000);
                setStatus('Download started: ' + a.download);
            }, 'image/png');
        } catch (e) {
            state.busy = false;
            updateUi();
            setError('Something went wrong while exporting. Please try again.');
        }
    }

    // ---- Cropping interactions ---------------------------------------------------
    let drag = null;
    function pointerDown(e) {
        if (!state.source) return;
        drag = { id: e.pointerId, x: e.clientX, y: e.clientY };
        els.polaroidCanvas.setPointerCapture(e.pointerId);
        els.polaroidStage.classList.add('is-dragging');
    }
    function pointerMove(e) {
        if (!drag || e.pointerId !== drag.id || !state.source) return;
        const c = getCrop();
        const rect = els.polaroidCanvas.getBoundingClientRect();
        // displayed px per source px inside the opening
        const dispPerSrc = (rect.width * (ART.OPEN.w + 2 * ART.PAD) / ART.CARD.w) / c.w;
        state.cx -= (e.clientX - drag.x) / dispPerSrc;
        state.cy -= (e.clientY - drag.y) / dispPerSrc;
        drag.x = e.clientX; drag.y = e.clientY;
        renderAll();
    }
    function pointerUp(e) {
        if (!drag || e.pointerId !== drag.id) return;
        drag = null;
        els.polaroidStage.classList.remove('is-dragging');
    }

    function onPolaroidKey(e) {
        if (!state.source) return;
        const c = getCrop();
        const step = 0.04;
        let handled = true;
        switch (e.key) {
            case 'ArrowLeft': state.cx -= c.w * step; break;
            case 'ArrowRight': state.cx += c.w * step; break;
            case 'ArrowUp': state.cy -= c.h * step; break;
            case 'ArrowDown': state.cy += c.h * step; break;
            case '+': case '=': setZoom(state.zoom + 0.1); return;
            case '-': case '_': setZoom(state.zoom - 0.1); return;
            default: handled = false;
        }
        if (handled) { e.preventDefault(); renderAll(); }
    }

    // ---- Wiring ----------------------------------------------------------------
    els.uploadBtn.addEventListener('click', () => { stopCamera(true); els.fileInput.click(); });
    els.fileInput.addEventListener('change', () => {
        const f = els.fileInput.files && els.fileInput.files[0];
        loadFile(f).finally(() => { els.fileInput.value = ''; }); // forget the file selection
    });
    els.cameraBtn.addEventListener('click', onCameraButton);
    els.cancelCameraBtn.addEventListener('click', () => stopCamera(false));
    els.downloadBtn.addEventListener('click', downloadPolaroid);
    els.zoom.addEventListener('input', () => setZoom(parseFloat(els.zoom.value)));

    [els.lookNormal, els.lookBw].forEach((btn) => {
        btn.addEventListener('click', () => setLook(btn.dataset.look));
        btn.addEventListener('keydown', (e) => {
            if (['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(e.key)) {
                e.preventDefault();
                const next = btn === els.lookNormal ? els.lookBw : els.lookNormal;
                setLook(next.dataset.look);
                next.focus();
            }
        });
    });

    // Camera buttons built into the artwork
    document.querySelectorAll('.cam-hotspot[data-action]').forEach((hs) => {
        hs.addEventListener('click', () => {
            switch (hs.dataset.action) {
                case 'camera': onCameraButton(); break;
                case 'upload': stopCamera(true); els.fileInput.click(); break;
                case 'zoom-in': setZoom(state.zoom + 0.15); break;
                case 'zoom-out': setZoom(state.zoom - 0.15); break;
                case 'look-normal': setLook('normal'); break;
                case 'look-bw': setLook('bw'); break;
                case 'download': downloadPolaroid(); break;
                default: break;
            }
        });
    });

    els.polaroidCanvas.addEventListener('pointerdown', pointerDown);
    els.polaroidCanvas.addEventListener('pointermove', pointerMove);
    els.polaroidCanvas.addEventListener('pointerup', pointerUp);
    els.polaroidCanvas.addEventListener('pointercancel', pointerUp);
    els.polaroidStage.addEventListener('keydown', onPolaroidKey);

    // Drag & drop a photo onto the camera
    ['dragenter', 'dragover'].forEach((t) => els.stage.addEventListener(t, (e) => {
        e.preventDefault(); els.stage.classList.add('is-drop-target');
    }));
    ['dragleave', 'drop'].forEach((t) => els.stage.addEventListener(t, (e) => {
        e.preventDefault(); els.stage.classList.remove('is-drop-target');
    }));
    els.stage.addEventListener('drop', (e) => {
        const f = e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files[0];
        if (f) loadFile(f);
    });

    // Always release the camera when leaving the studio
    window.addEventListener('pagehide', () => stopCamera(true));
    window.addEventListener('beforeunload', () => stopCamera(true));
    document.addEventListener('visibilitychange', () => {
        if (document.hidden && state.stream) {
            stopCamera(true);
            setStatus('Camera turned off while the page was hidden.');
        }
    });
    els.backLinks.forEach((a) => a.addEventListener('click', () => stopCamera(true)));

    if (typeof ResizeObserver === 'function') {
        new ResizeObserver(() => renderAll()).observe(els.polaroidCanvas);
        new ResizeObserver(() => renderAll()).observe(els.lcdCanvas);
    } else {
        window.addEventListener('resize', renderAll);
    }

    // ---- Boot: load the one Polaroid frame ---------------------------------------
    updateUi();
    renderAll();
    const frame = new Image();
    frame.onload = () => {
        state.frame = frame;
        state.frameOk = true;
        updateUi();
        renderAll();
    };
    frame.onerror = () => {
        state.frameOk = false;
        setError('The Polaroid frame couldn\u2019t be loaded, so exporting is unavailable right now.');
        updateUi();
    };
    frame.src = ART.FRAME_URL;

    // Test/QA hook (read-only introspection; no photo data is exposed or stored)
    window.__ricordiStudio = {
        art: ART,
        get hasPhoto() { return !!state.source; },
        get look() { return state.look; },
        get streaming() { return !!state.stream; },
        buildComposite: buildComposite
    };
})();
