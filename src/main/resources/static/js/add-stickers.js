/* Ricordi Add Stickers component.
 * Stores per-date layouts in this browser's localStorage; server-side sync can be added later.
 */
(() => {
    'use strict';

    const ROOT = '/images/decorations/';
    const STORAGE_KEY = 'ricordi_page_decorations_v1';
    const CATEGORIES = [
        { id: 'all', label: 'All' }, { id: 'bows', label: 'Bows' },
        { id: 'buttons', label: 'Buttons' }, { id: 'lace', label: 'Lace' },
        { id: 'music', label: 'Music' }, { id: 'seals', label: 'Seals' },
        { id: 'stamps', label: 'Stamps' }, { id: 'stickers', label: 'Stickers' },
        { id: 'tape', label: 'Tape' }
    ];
    const ASSETS = [
        ...makeAssets('bows', 'bow', 3), ...makeAssets('buttons', 'button', 4),
        ...makeAssets('lace', 'lace', 3), ...makeAssets('music', 'player', 3),
        ...makeAssets('seals', 'seal', 5), ...makeAssets('stamps', 'stamp', 5),
        ...makeAssets('stickers', 'sticker', 6), ...makeAssets('tape', 'tape', 5)
    ];

    let category = 'all';
    let selectedId = null;
    let nextId = 1;
    let layouts = {};
    let currentDate = '2027-01-01';
    let dragState = null;
    let focusBeforeOpen = null;

    function makeAssets(group, prefix, count) {
        return Array.from({ length: count }, (_, i) => ({
            id: `${group}-${i + 1}`, category: group,
            label: `${prefix.charAt(0).toUpperCase() + prefix.slice(1)} ${i + 1}`,
            src: `${ROOT}${encodeURIComponent(prefix + ' ' + (i + 1) + '.png')}`
        }));
    }

    function qs(selector, root = document) { return root.querySelector(selector); }
    function qsa(selector, root = document) { return Array.from(root.querySelectorAll(selector)); }

    function init() {
        const dialog = qs('#rsStickerDialog');
        const spread = qs('#ricordiSpread');
        if (!dialog || !spread || qs('#rsCanvas')) return;

        const canvas = qs('#rsCanvas');
        spread.appendChild(createOverlay());
        readStorage();
        renderCategories();
        renderLibrary();
        bindEvents();
        syncDate();
        restoreCurrentLayout();
        watchDateChanges();
        if (window.ResizeObserver) new ResizeObserver(renderLiveOverlay).observe(canvas);
    }

    function createOverlay() {
        const overlay = document.createElement('div');
        overlay.className = 'rs-page-overlay';
        overlay.id = 'rsPageOverlay';
        overlay.setAttribute('aria-hidden', 'true');
        return overlay;
    }

    function readStorage() {
        try {
            const stored = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
            if (stored && typeof stored === 'object' && !Array.isArray(stored)) layouts = stored;
        } catch (error) {
            console.warn('Ricordi decorations could not be loaded from local storage.', error);
        }
    }

    function persist() {
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(layouts));
            setSaveStatus('Saved in this browser');
        } catch (error) {
            setSaveStatus('Could not save — browser storage may be full');
            console.warn('Ricordi decorations could not be saved.', error);
        }
    }

    function setSaveStatus(message) {
        const el = qs('#rsSaveStatus');
        if (el) el.textContent = message;
    }

    function getActiveDate() {
        const input = qs('#ricordiDateInput');
        if (input && /^2027-\d{2}-\d{2}$/.test(input.value)) return input.value;
        return currentDate;
    }

    function syncDate() {
        currentDate = getActiveDate();
        const label = qs('#rsCurrentDate');
        if (label) {
            const parts = currentDate.split('-').map(Number);
            label.textContent = new Date(parts[0], parts[1] - 1, parts[2]).toLocaleDateString('en-US', {
                month: 'long', day: 'numeric', year: 'numeric'
            });
        }
    }

    function watchDateChanges() {
        const dateInput = qs('#ricordiDateInput');
        if (dateInput) dateInput.addEventListener('change', changeDate);
        const badge = qs('#ricordiDateBadge');
        if (badge && window.MutationObserver) {
            new MutationObserver(() => changeDate()).observe(badge, { childList: true, characterData: true, subtree: true });
        }
        ['ricordiPrevDayBtn', 'ricordiNextDayBtn'].forEach(id => {
            const button = document.getElementById(id);
            if (button) button.addEventListener('click', () => window.setTimeout(changeDate, 80));
        });
    }

    function changeDate() {
        const nextDate = getActiveDate();
        if (nextDate === currentDate) return;
        saveCurrentLayout(false);
        currentDate = nextDate;
        syncDate();
        selectedId = null;
        renderCanvas();
        updateSelectionTools();
    }

    function renderCategories() {
        const root = qs('#rsCategories');
        if (!root) return;
        root.innerHTML = '';
        CATEGORIES.forEach(item => {
            const button = document.createElement('button');
            button.type = 'button';
            button.className = 'rs-category-button';
            button.textContent = item.label;
            button.dataset.category = item.id;
            button.setAttribute('aria-pressed', String(category === item.id));
            button.addEventListener('click', () => {
                category = item.id;
                qsa('.rs-category-button', root).forEach(el => el.setAttribute('aria-pressed', String(el.dataset.category === category)));
                renderLibrary();
            });
            root.appendChild(button);
        });
    }

    function renderLibrary() {
        const root = qs('#rsLibraryGrid');
        if (!root) return;
        const query = (qs('#rsSearch')?.value || '').trim().toLowerCase();
        const filtered = ASSETS.filter(asset => (category === 'all' || asset.category === category) && asset.label.toLowerCase().includes(query));
        root.innerHTML = '';
        filtered.forEach(asset => {
            const item = document.createElement('div');
            item.className = 'rs-asset-item';
            const button = document.createElement('button');
            button.type = 'button';
            button.className = 'rs-asset-button';
            button.setAttribute('aria-label', `Add ${asset.label}`);
            const image = document.createElement('img');
            image.src = asset.src;
            image.alt = '';
            image.loading = 'lazy';
            image.draggable = false;
            image.addEventListener('error', () => { button.disabled = true; button.title = `Missing asset: ${asset.src}`; }, { once: true });
            button.appendChild(image);
            button.addEventListener('click', () => addDecoration(asset));
            const label = document.createElement('span');
            label.className = 'rs-asset-name';
            label.textContent = asset.label;
            item.append(button, label);
            root.appendChild(item);
        });
        if (!filtered.length) {
            const empty = document.createElement('p');
            empty.className = 'rs-library-hint';
            empty.textContent = 'No decorations match that search.';
            root.appendChild(empty);
        }
    }

    function currentItems() {
        if (!Array.isArray(layouts[currentDate])) layouts[currentDate] = [];
        return layouts[currentDate];
    }

    function addDecoration(asset, sourceItem = null) {
        const item = sourceItem ? { ...sourceItem, id: `dec-${nextId++}` } : {
            id: `dec-${nextId++}`, assetId: asset.id, src: asset.src, label: asset.label,
            x: 50, y: 50, size: 100, rotation: 0, z: currentItems().reduce((max, it) => Math.max(max, Number(it.z) || 0), 0) + 1
        };
        currentItems().push(item);
        selectedId = item.id;
        renderCanvas();
        updateSelectionTools();
        persist();
    }

    function restoreCurrentLayout() {
        const maxId = currentItems().reduce((max, item) => Math.max(max, Number(String(item.id).replace('dec-', '')) || 0), 0);
        nextId = Math.max(nextId, maxId + 1);
        renderCanvas();
        updateSelectionTools();
    }

    function renderCanvas() {
        const canvas = qs('#rsCanvas');
        if (!canvas) return;
        qsa('.rs-placed-item', canvas).forEach(el => el.remove());
        const items = currentItems().slice().sort((a, b) => (a.z || 0) - (b.z || 0));
        canvas.classList.toggle('has-items', items.length > 0);
        items.forEach(item => {
            const wrapper = document.createElement('div');
            wrapper.className = 'rs-placed-item' + (item.id === selectedId ? ' is-selected' : '');
            wrapper.dataset.id = item.id;
            wrapper.style.left = `${clamp(item.x, 0, 100)}%`;
            wrapper.style.top = `${clamp(item.y, 0, 100)}%`;
            wrapper.style.width = `${clamp(item.size, 35, 240)}px`;
            wrapper.style.height = `${clamp(item.size, 35, 240)}px`;
            wrapper.style.zIndex = String(item.z || 1);
            wrapper.style.setProperty('--rs-rotation', `${clamp(item.rotation, -180, 180)}deg`);
            wrapper.setAttribute('role', 'button');
            wrapper.setAttribute('tabindex', '0');
            wrapper.setAttribute('aria-label', `${item.label}, select and drag`);
            const image = document.createElement('img');
            image.src = item.src;
            image.alt = '';
            image.draggable = false;
            wrapper.appendChild(image);
            wrapper.addEventListener('pointerdown', beginDrag);
            wrapper.addEventListener('click', event => { event.stopPropagation(); selectItem(item.id); });
            wrapper.addEventListener('keydown', event => {
                if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); selectItem(item.id); }
                const nudge = event.shiftKey ? 3 : 1;
                if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(event.key)) {
                    event.preventDefault();
                    const live = findItem(item.id);
                    if (!live) return;
                    if (event.key === 'ArrowUp') live.y -= nudge;
                    if (event.key === 'ArrowDown') live.y += nudge;
                    if (event.key === 'ArrowLeft') live.x -= nudge;
                    if (event.key === 'ArrowRight') live.x += nudge;
                    live.x = clamp(live.x, 0, 100); live.y = clamp(live.y, 0, 100);
                    renderCanvas(); selectItem(item.id); persist();
                }
            });
            canvas.appendChild(wrapper);
        });
        renderLiveOverlay();
    }

    function renderLiveOverlay() {
        const overlay = qs('#rsPageOverlay');
        const canvas = qs('#rsCanvas');
        if (!overlay || !canvas) return;
        overlay.innerHTML = '';
        const canvasWidth = canvas.clientWidth || 540;
        currentItems().slice().sort((a, b) => (a.z || 0) - (b.z || 0)).forEach(item => {
            const wrapper = document.createElement('div');
            wrapper.className = 'rs-live-decoration';
            wrapper.style.left = `${clamp(item.x, 0, 100)}%`;
            wrapper.style.top = `${clamp(item.y, 0, 100)}%`;
            wrapper.style.width = `${(clamp(item.size, 35, 240) / canvasWidth) * 100}%`;
            wrapper.style.zIndex = String(item.z || 1);
            wrapper.style.setProperty('--rs-rotation', `${clamp(item.rotation, -180, 180)}deg`);
            const image = document.createElement('img');
            image.src = item.src;
            image.alt = '';
            image.draggable = false;
            wrapper.appendChild(image);
            overlay.appendChild(wrapper);
        });
    }

    function beginDrag(event) {
        if (event.button !== 0 && event.pointerType === 'mouse') return;
        const wrapper = event.currentTarget;
        const id = wrapper.dataset.id;
        selectItem(id);
        const item = findItem(id);
        const canvas = qs('#rsCanvas');
        const rect = canvas.getBoundingClientRect();
        dragState = { id, startX: event.clientX, startY: event.clientY, itemX: item.x, itemY: item.y, width: rect.width, height: rect.height, moved: false };
        try { wrapper.setPointerCapture(event.pointerId); } catch (_) {}
        wrapper.addEventListener('pointermove', moveDrag);
        wrapper.addEventListener('pointerup', endDrag, { once: true });
        wrapper.addEventListener('pointercancel', endDrag, { once: true });
        event.preventDefault();
    }

    function moveDrag(event) {
        if (!dragState) return;
        const item = findItem(dragState.id);
        if (!item) return;
        const dx = event.clientX - dragState.startX;
        const dy = event.clientY - dragState.startY;
        if (Math.abs(dx) + Math.abs(dy) > 2) dragState.moved = true;
        item.x = clamp(dragState.itemX + (dx / dragState.width) * 100, 0, 100);
        item.y = clamp(dragState.itemY + (dy / dragState.height) * 100, 0, 100);
        const wrapper = qs(`.rs-placed-item[data-id="${CSS.escape(item.id)}"]`);
        if (wrapper) { wrapper.style.left = `${item.x}%`; wrapper.style.top = `${item.y}%`; }
    }

    function endDrag(event) {
        if (!dragState) return;
        const wrapper = event.currentTarget;
        wrapper.removeEventListener('pointermove', moveDrag);
        if (dragState.moved) persist();
        dragState = null;
    }

    function findItem(id) { return currentItems().find(item => item.id === id); }

    function selectItem(id) {
        selectedId = id;
        qsa('.rs-placed-item').forEach(el => el.classList.toggle('is-selected', el.dataset.id === id));
        updateSelectionTools();
    }

    function updateSelectionTools() {
        const item = selectedId ? findItem(selectedId) : null;
        const tools = qs('#rsSelectionTools');
        if (!tools) return;
        tools.hidden = !item;
        if (!item) return;
        qs('#rsSelectedLabel').textContent = item.label;
        qs('#rsSize').value = String(item.size);
        qs('#rsRotation').value = String(item.rotation);
    }

    function updateSelected(property, value) {
        const item = selectedId ? findItem(selectedId) : null;
        if (!item) return;
        item[property] = Number(value);
        if (property === 'size') item.size = clamp(item.size, 35, 240);
        if (property === 'rotation') item.rotation = clamp(item.rotation, -180, 180);
        const wrapper = qs(`.rs-placed-item[data-id="${CSS.escape(item.id)}"]`);
        if (wrapper) {
            if (property === 'size') { wrapper.style.width = `${item.size}px`; wrapper.style.height = `${item.size}px`; }
            if (property === 'rotation') wrapper.style.setProperty('--rs-rotation', `${item.rotation}deg`);
        }
        persist();
    }

    function bindEvents() {
        const dialog = qs('#rsStickerDialog');
        qs('#rsOpenStickers')?.addEventListener('click', openDialog);
        qsa('[data-rs-close]', dialog).forEach(button => button.addEventListener('click', closeDialog));
        qs('#rsSearch')?.addEventListener('input', renderLibrary);
        qs('#rsSize')?.addEventListener('input', event => updateSelected('size', event.target.value));
        qs('#rsRotation')?.addEventListener('input', event => updateSelected('rotation', event.target.value));
        qs('#rsBringForward')?.addEventListener('click', () => changeLayer(1));
        qs('#rsSendBackward')?.addEventListener('click', () => changeLayer(-1));
        qs('#rsDuplicate')?.addEventListener('click', () => { const item = selectedId && findItem(selectedId); if (item) addDecoration(null, { ...item, x: clamp(item.x + 5, 0, 100), y: clamp(item.y + 5, 0, 100), z: maxZ() + 1 }); });
        qs('#rsDelete')?.addEventListener('click', deleteSelected);
        qs('#rsClearPage')?.addEventListener('click', () => {
            if (!currentItems().length || !window.confirm('Remove every decoration from this date?')) return;
            layouts[currentDate] = []; selectedId = null; renderCanvas(); updateSelectionTools(); persist();
        });
        qs('#rsCanvas')?.addEventListener('pointerdown', event => {
            if (event.target.id === 'rsCanvas' || event.target.id === 'rsCanvasEmpty') { selectedId = null; qsa('.rs-placed-item').forEach(el => el.classList.remove('is-selected')); updateSelectionTools(); }
        });
        document.addEventListener('keydown', event => {
            if (dialog.hidden) return;
            if (event.key === 'Escape') closeDialog();
            if ((event.key === 'Delete' || event.key === 'Backspace') && !['INPUT', 'TEXTAREA'].includes(document.activeElement.tagName)) deleteSelected();
        });
    }

    function openDialog() {
        focusBeforeOpen = document.activeElement;
        syncDate();
        restoreCurrentLayout();
        qs('#rsStickerDialog').hidden = false;
        document.body.classList.add('rs-dialog-open');
        qs('#rsOpenStickers')?.setAttribute('aria-expanded', 'true');
        qs('#rsSearch')?.focus();
    }

    function closeDialog() {
        saveCurrentLayout(false);
        const dialog = qs('#rsStickerDialog');
        if (!dialog || dialog.hidden) return;
        dialog.hidden = true;
        document.body.classList.remove('rs-dialog-open');
        qs('#rsOpenStickers')?.setAttribute('aria-expanded', 'false');
        if (focusBeforeOpen && typeof focusBeforeOpen.focus === 'function') focusBeforeOpen.focus();
    }

    function saveCurrentLayout(doPersist = true) {
        if (doPersist) persist();
        else persist();
    }

    function maxZ() { return currentItems().reduce((max, item) => Math.max(max, Number(item.z) || 0), 0); }
    function changeLayer(direction) {
        const item = selectedId && findItem(selectedId);
        if (!item) return;
        item.z = direction > 0 ? maxZ() + 1 : Math.max(1, Math.min(...currentItems().map(entry => entry.z || 1)) - 1);
        renderCanvas(); selectItem(item.id); persist();
    }

    function deleteSelected() {
        if (!selectedId) return;
        layouts[currentDate] = currentItems().filter(item => item.id !== selectedId);
        selectedId = null; renderCanvas(); updateSelectionTools(); persist();
    }

    function clamp(value, min, max) { const number = Number(value); return Math.min(max, Math.max(min, Number.isFinite(number) ? number : min)); }

    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init, { once: true });
    else init();
})();
