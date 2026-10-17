document.addEventListener("DOMContentLoaded", () => {
    document.querySelectorAll("[data-current-year]").forEach((element) => {
        element.textContent = String(new Date().getFullYear());
    });

    initThemeSystem();
    initTodoBoard();
});

/**
 * Ricordi Selectable Seasonal Theme Controller
 */
function initThemeSystem() {
    const THEMES = {
        'timeless': 'Timeless',
        'cherry-blossom': 'Cherry Blossom',
        'golden-summer': 'Golden Summer',
        'autumn-letters': 'Autumn Letters',
        'winter-hush': 'Winter Hush'
    };
    const VALID_IDS = Object.keys(THEMES);
    const STORAGE_KEY = 'ricordi_theme';

    const toggleBtn = document.getElementById("themeToggleBtn");
    const popover = document.getElementById("themePopover");
    const closeBtn = document.getElementById("themePopoverClose");
    const currentBadge = document.getElementById("themeCurrentBadge");
    const options = Array.from(document.querySelectorAll(".theme-option"));
    const ambientLayer = document.getElementById("seasonalAmbient");

    // 1. Resolve and apply initial theme
    let currentTheme = 'timeless';
    try {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored && VALID_IDS.includes(stored)) {
            currentTheme = stored;
        }
    } catch (e) {
        currentTheme = 'timeless';
    }

    applyTheme(currentTheme, false);

    // 2. Refresh Lucide icons for theme UI
    if (window.lucide && typeof window.lucide.createIcons === 'function') {
        window.lucide.createIcons();
    }

    // 3. Popover Toggle & Dismissal
    function openPopover() {
        if (!popover || !toggleBtn) return;
        popover.removeAttribute("hidden");
        toggleBtn.setAttribute("aria-expanded", "true");
        // Focus active option or first option
        const activeOpt = options.find(btn => btn.dataset.theme === currentTheme) || options[0];
        if (activeOpt) {
            setTimeout(() => activeOpt.focus(), 30);
        }
    }

    function closePopover(returnFocus = true) {
        if (!popover || !toggleBtn) return;
        if (popover.hasAttribute("hidden")) return;
        popover.setAttribute("hidden", "");
        toggleBtn.setAttribute("aria-expanded", "false");
        if (returnFocus) {
            toggleBtn.focus();
        }
    }

    if (toggleBtn) {
        toggleBtn.addEventListener("click", (e) => {
            e.stopPropagation();
            if (popover && !popover.hasAttribute("hidden")) {
                closePopover(false);
            } else {
                openPopover();
            }
        });
    }

    if (closeBtn) {
        closeBtn.addEventListener("click", (e) => {
            e.stopPropagation();
            closePopover(true);
        });
    }

    // Click outside to dismiss
    document.addEventListener("click", (e) => {
        if (popover && !popover.hasAttribute("hidden")) {
            if (!popover.contains(e.target) && e.target !== toggleBtn && !toggleBtn.contains(e.target)) {
                closePopover(false);
            }
        }
    });

    // Keyboard navigation within popover
    if (popover) {
        popover.addEventListener("keydown", (e) => {
            if (e.key === "Escape") {
                e.preventDefault();
                e.stopPropagation(); // Prevent album from closing on Escape
                closePopover(true);
                return;
            }

            const focused = document.activeElement;
            const idx = options.indexOf(focused);

            if (idx !== -1) {
                if (e.key === "ArrowDown" || e.key === "ArrowRight") {
                    e.preventDefault();
                    const nextIdx = (idx + 1) % options.length;
                    options[nextIdx].focus();
                } else if (e.key === "ArrowUp" || e.key === "ArrowLeft") {
                    e.preventDefault();
                    const prevIdx = (idx - 1 + options.length) % options.length;
                    options[prevIdx].focus();
                }
            }
        });
    }

    // Option selection
    options.forEach((opt) => {
        opt.addEventListener("click", (e) => {
            e.stopPropagation();
            const chosen = opt.dataset.theme;
            if (chosen && VALID_IDS.includes(chosen)) {
                applyTheme(chosen, true);
                closePopover(true);
            }
        });
    });

    // 4. Theme Application & Persistence
    function applyTheme(themeId, save = true) {
        if (!VALID_IDS.includes(themeId)) {
            themeId = 'timeless';
        }

        currentTheme = themeId;
        document.documentElement.setAttribute("data-theme", themeId);

        if (save) {
            try {
                localStorage.setItem(STORAGE_KEY, themeId);
            } catch (err) {
                // Graceful fallback if localStorage is disabled
            }
        }

        const themeName = THEMES[themeId] || 'Timeless';

        if (currentBadge) {
            currentBadge.textContent = themeName;
        }

        if (toggleBtn) {
            toggleBtn.setAttribute("aria-label", `Themes: current theme ${themeName}`);
        }

        options.forEach((opt) => {
            const isMatch = opt.dataset.theme === themeId;
            opt.setAttribute("aria-checked", isMatch ? "true" : "false");
            opt.tabIndex = isMatch ? 0 : -1;
        });

        // Update Seasonal Ambient Layer
        renderSeasonalAmbient(themeId);
    }

    // 5. Seasonal Ambient Engine
    function renderSeasonalAmbient(themeId) {
        if (!ambientLayer) return;

        // Clear existing particles immediately to prevent accumulation
        ambientLayer.innerHTML = "";

        // Respect reduced motion preference
        const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
        if (prefersReducedMotion || themeId === 'timeless') {
            return;
        }

        if (themeId === 'cherry-blossom') {
            // Softly drifting petals
            const count = 12;
            for (let i = 0; i < count; i++) {
                const petal = document.createElement("div");
                petal.className = "particle-petal";
                const left = (i * 8 + Math.random() * 6).toFixed(1);
                const duration = (8 + Math.random() * 6).toFixed(1);
                const delay = (Math.random() * 8).toFixed(1);
                const driftX = (50 + Math.random() * 90).toFixed(0);

                petal.style.left = `${left}%`;
                petal.style.animationDuration = `${duration}s`;
                petal.style.animationDelay = `-${delay}s`;
                petal.style.setProperty("--drift-x", `${driftX}px`);
                ambientLayer.appendChild(petal);
            }
        } else if (themeId === 'golden-summer') {
            // Floating sunlight dust motes
            const count = 14;
            for (let i = 0; i < count; i++) {
                const mote = document.createElement("div");
                mote.className = "particle-mote";
                const left = (5 + Math.random() * 88).toFixed(1);
                const top = (15 + Math.random() * 70).toFixed(1);
                const duration = (4 + Math.random() * 5).toFixed(1);
                const delay = (Math.random() * 5).toFixed(1);
                const driftX = (-25 + Math.random() * 50).toFixed(0);
                const driftY = (-40 - Math.random() * 50).toFixed(0);
                const size = (4 + Math.random() * 4).toFixed(0);

                mote.style.left = `${left}%`;
                mote.style.top = `${top}%`;
                mote.style.animationDuration = `${duration}s`;
                mote.style.animationDelay = `-${delay}s`;
                mote.style.setProperty("--drift-x", `${driftX}px`);
                mote.style.setProperty("--drift-y", `${driftY}px`);
                mote.style.setProperty("--mote-size", `${size}px`);
                ambientLayer.appendChild(mote);
            }
        } else if (themeId === 'autumn-letters') {
            // Gently falling leaves
            const count = 10;
            for (let i = 0; i < count; i++) {
                const leaf = document.createElement("div");
                leaf.className = "particle-leaf";
                const left = (i * 9 + Math.random() * 7).toFixed(1);
                const duration = (8.5 + Math.random() * 6).toFixed(1);
                const delay = (Math.random() * 8).toFixed(1);
                const driftX = (-110 + Math.random() * 60).toFixed(0);

                leaf.style.left = `${left}%`;
                leaf.style.animationDuration = `${duration}s`;
                leaf.style.animationDelay = `-${delay}s`;
                leaf.style.setProperty("--drift-x", `${driftX}px`);
                ambientLayer.appendChild(leaf);
            }
        } else if (themeId === 'winter-hush') {
            // Subtle quiet snowfall
            const count = 16;
            for (let i = 0; i < count; i++) {
                const flake = document.createElement("div");
                flake.className = "particle-snowflake";
                const left = (i * 6 + Math.random() * 5).toFixed(1);
                const duration = (6.5 + Math.random() * 5).toFixed(1);
                const delay = (Math.random() * 7).toFixed(1);
                const driftX = (-15 + Math.random() * 45).toFixed(0);
                const size = (4 + Math.random() * 5).toFixed(0);

                flake.style.left = `${left}%`;
                flake.style.animationDuration = `${duration}s`;
                flake.style.animationDelay = `-${delay}s`;
                flake.style.setProperty("--drift-x", `${driftX}px`);
                flake.style.setProperty("--flake-size", `${size}px`);
                ambientLayer.appendChild(flake);
            }
        }
    }

    // Listen to OS reduced-motion preference changes
    try {
        const motionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
        motionQuery.addEventListener("change", () => {
            renderSeasonalAmbient(currentTheme);
        });
    } catch (e) {
        // Fallback for older browsers
    }
}

/**
 * Ricordi Retro To-Do Board Controller
 * Features:
 *  - Persistent storage in PostgreSQL via /api/todos (single-user mode)
 *  - Time filters: Today, This Week, Later
 *  - Date parsing & overdue status indication
 *  - XSS-safe DOM rendering
 *  - Keyboard interaction (Enter to save, Esc to cancel)
 *  - Seamless fade-out on album opening
 */
function initTodoBoard() {
    const API = "/api/todos";

    const board = document.getElementById("todoBoard");
    if (!board) return;

    const addBtn = document.getElementById("todoAddBtn");
    const addForm = document.getElementById("todoAddForm");
    const inputTitle = document.getElementById("todoInputTitle");
    const inputDate = document.getElementById("todoInputDate");
    const btnCancel = document.getElementById("todoBtnCancel");
    const listEl = document.getElementById("todoList");
    const emptyStateEl = document.getElementById("todoEmptyState");
    const tabButtons = Array.from(document.querySelectorAll(".todo-tab"));

    let activeFilter = "today";
    let isSubmitting = false;

    // Helper: ISO date strings (YYYY-MM-DD)
    function getTodayIso() {
        const d = new Date();
        const y = d.getFullYear();
        const m = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        return `${y}-${m}-${day}`;
    }

    function getOffsetIso(days) {
        const d = new Date();
        d.setDate(d.getDate() + days);
        const y = d.getFullYear();
        const m = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        return `${y}-${m}-${day}`;
    }

    function formatFriendlyDate(iso) {
        if (!iso) return "";
        const today = getTodayIso();
        const tomorrow = getOffsetIso(1);
        const yesterday = getOffsetIso(-1);

        if (iso === today) return "Today";
        if (iso === tomorrow) return "Tomorrow";
        if (iso === yesterday) return "Yesterday";

        const parts = iso.split("-");
        if (parts.length === 3) {
            const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
            const idx = parseInt(parts[1], 10) - 1;
            const day = parseInt(parts[2], 10);
            if (idx >= 0 && idx < 12) {
                return `${months[idx]} ${day}`;
            }
        }
        return iso;
    }

    // Accessible status line (offline / errors / delete feedback)
    const statusEl = document.createElement("p");
    statusEl.className = "planner-status";
    statusEl.setAttribute("role", "status");
    statusEl.setAttribute("aria-live", "polite");
    statusEl.style.cssText = "margin:2px 0;font-size:0.72rem;font-style:italic;color:#6C0820;min-height:0;";
    const taskContainer = board.querySelector(".planner-task-container");
    if (taskContainer) taskContainer.parentNode.insertBefore(statusEl, taskContainer);
    let statusTimer = null;
    function setStatus(msg, sticky) {
        statusEl.textContent = msg || "";
        clearTimeout(statusTimer);
        if (msg && !sticky) statusTimer = setTimeout(() => { statusEl.textContent = ""; }, 3500);
    }

    function normalize(t) {
        return { id: String(t.id), title: String(t.title || ""), dueDate: t.dueDate || "", completed: !!t.completed };
    }

    async function api(method, url, body) {
        const opts = { method, headers: { "Accept": "application/json" } };
        if (body !== undefined) {
            opts.headers["Content-Type"] = "application/json";
            opts.body = JSON.stringify(body);
        }
        const res = await fetch(url, opts);
        let data = null;
        try { data = await res.json(); } catch (e) { /* empty body */ }
        if (!res.ok) {
            throw new Error((data && data.error) || `Request failed (${res.status})`);
        }
        return data;
    }

    let tasks = [];
    let backendOnline = false;
    const pending = new Set();

    async function loadTasks() {
        try {
            const data = await api("GET", API);
            tasks = Array.isArray(data) ? data.map(normalize) : [];
            backendOnline = true;
            setStatus("");
        } catch (e) {
            backendOnline = false;
            tasks = [];
            setStatus("Planner is offline — tasks can't be loaded or saved right now.", true);
        }
        render();
    }

    // Filter Matcher
    function matchesFilter(task, filter) {
        const today = getTodayIso();
        const weekEnd = getOffsetIso(7);

        if (!task.dueDate) {
            // Unscheduled tasks remain accessible under Today & This Week
            return filter === "today" || filter === "week";
        }

        if (filter === "today") {
            // Overdue or due today
            return task.dueDate <= today;
        }

        if (filter === "week") {
            // Overdue or due within the upcoming 7 days
            return task.dueDate <= weekEnd;
        }

        if (filter === "later") {
            // Due after the upcoming 7 days
            return task.dueDate > weekEnd;
        }

        return true;
    }

    // Render List securely via DOM APIs
    function render() {
        if (!listEl) return;

        const filtered = tasks.filter(t => matchesFilter(t, activeFilter));
        listEl.innerHTML = "";

        if (filtered.length === 0) {
            if (emptyStateEl) emptyStateEl.hidden = false;
        } else {
            if (emptyStateEl) emptyStateEl.hidden = true;

            filtered.forEach(task => {
                const li = document.createElement("li");
                li.className = "todo-item" + (task.completed ? " is-completed" : "");
                li.dataset.taskId = task.id;

                // Check button
                const checkBtn = document.createElement("button");
                checkBtn.type = "button";
                checkBtn.className = "todo-check-btn";
                checkBtn.setAttribute("role", "checkbox");
                checkBtn.setAttribute("aria-checked", task.completed ? "true" : "false");
                checkBtn.setAttribute("aria-label", `Mark "${task.title}" as ${task.completed ? "incomplete" : "complete"}`);

                const checkIcon = document.createElement("span");
                checkIcon.className = "todo-check-icon";
                checkIcon.setAttribute("aria-hidden", "true");
                checkIcon.textContent = "✓";
                checkBtn.appendChild(checkIcon);

                // Content container
                const contentWrap = document.createElement("div");
                contentWrap.className = "todo-item-content";

                const titleSpan = document.createElement("span");
                titleSpan.className = "todo-item-title";
                titleSpan.textContent = task.title; // Safe textContent avoids XSS
                contentWrap.appendChild(titleSpan);

                // Optional due date badge
                if (task.dueDate) {
                    const metaWrap = document.createElement("div");
                    metaWrap.className = "todo-item-meta";

                    const isOverdue = !task.completed && task.dueDate < getTodayIso();
                    const dateBadge = document.createElement("span");
                    dateBadge.className = "todo-date-badge" + (isOverdue ? " is-overdue" : "");
                    dateBadge.textContent = (isOverdue ? "⚠ " : "") + formatFriendlyDate(task.dueDate);
                    metaWrap.appendChild(dateBadge);
                    contentWrap.appendChild(metaWrap);
                }

                // Delete button
                const delBtn = document.createElement("button");
                delBtn.type = "button";
                delBtn.className = "todo-del-btn";
                delBtn.setAttribute("aria-label", `Delete "${task.title}"`);
                delBtn.textContent = "×";

                li.appendChild(checkBtn);
                li.appendChild(contentWrap);
                li.appendChild(delBtn);

                listEl.appendChild(li);
            });
        }
    }

    // Toggle Task Completion
    async function toggleTask(id) {
        if (pending.has(id)) return;
        pending.add(id);
        try {
            const updated = normalize(await api("PATCH", `${API}/${encodeURIComponent(id)}/toggle`));
            tasks = tasks.map(t => (t.id === id ? updated : t));
            render();
            const btn = listEl && listEl.querySelector(`[data-task-id="${CSS.escape(id)}"] .todo-check-btn`);
            if (btn) btn.focus();
        } catch (e) {
            setStatus("Couldn't update the task: " + e.message);
        } finally {
            pending.delete(id);
        }
    }

    // Delete Task
    async function deleteTask(id) {
        if (pending.has(id)) return;
        const task = tasks.find(t => t.id === id);
        if (!task) return;
        if (!window.confirm(`Delete "${task.title}"?`)) return;
        pending.add(id);
        try {
            await api("DELETE", `${API}/${encodeURIComponent(id)}`);
            tasks = tasks.filter(t => t.id !== id);
            render();
            setStatus(`Deleted "${task.title}".`);
        } catch (e) {
            setStatus("Couldn't delete the task: " + e.message);
        } finally {
            pending.delete(id);
        }
    }

    // Event Delegation on List
    if (listEl) {
        listEl.addEventListener("click", (e) => {
            const checkBtn = e.target.closest(".todo-check-btn");
            if (checkBtn) {
                const li = checkBtn.closest(".todo-item");
                if (li && li.dataset.taskId) {
                    toggleTask(li.dataset.taskId);
                }
                return;
            }

            const delBtn = e.target.closest(".todo-del-btn");
            if (delBtn) {
                const li = delBtn.closest(".todo-item");
                if (li && li.dataset.taskId) {
                    deleteTask(li.dataset.taskId);
                }
                return;
            }
        });
    }

    // Time Filter Tabs
    tabButtons.forEach(btn => {
        btn.addEventListener("click", () => {
            const chosen = btn.dataset.filter;
            if (!chosen || chosen === activeFilter) return;

            activeFilter = chosen;
            tabButtons.forEach(b => {
                const isActive = b.dataset.filter === chosen;
                b.classList.toggle("is-active", isActive);
                b.setAttribute("aria-selected", isActive ? "true" : "false");
            });

            render();
        });
    });

    // Add Form Toggle & Submission
    function openForm() {
        if (!addForm) return;
        addForm.hidden = false;
        if (addBtn) addBtn.setAttribute("aria-expanded", "true");
        if (inputTitle) {
            inputTitle.value = "";
            inputTitle.focus();
        }
        if (inputDate) {
            inputDate.value = "";
        }
    }

    function closeForm() {
        if (!addForm) return;
        addForm.hidden = true;
        if (addBtn) {
            addBtn.setAttribute("aria-expanded", "false");
            addBtn.focus();
        }
    }

    if (addBtn) {
        addBtn.addEventListener("click", () => {
            if (addForm && !addForm.hidden) {
                closeForm();
            } else {
                openForm();
            }
        });
    }

    if (btnCancel) {
        btnCancel.addEventListener("click", closeForm);
    }

    if (addForm) {
        addForm.addEventListener("submit", async (e) => {
            e.preventDefault();
            if (isSubmitting) return;

            const title = inputTitle ? inputTitle.value.trim() : "";
            if (!title) {
                setStatus("Please write a task title first.");
                if (inputTitle) inputTitle.focus();
                return;
            }

            const dueDate = inputDate ? inputDate.value.trim() : "";
            if (dueDate && !/^\d{4}-\d{2}-\d{2}$/.test(dueDate)) {
                setStatus("Please choose a valid due date.");
                return;
            }

            isSubmitting = true;
            const saveBtn = document.getElementById("todoBtnSave");
            if (saveBtn) saveBtn.disabled = true;

            let newTask;
            try {
                newTask = normalize(await api("POST", API, { title: title.slice(0, 80), dueDate: dueDate || null }));
                backendOnline = true;
            } catch (err) {
                setStatus("Couldn't save the task: " + err.message);
                isSubmitting = false;
                if (saveBtn) saveBtn.disabled = false;
                return;
            }
            if (saveBtn) saveBtn.disabled = false;

            tasks.unshift(newTask);

            // If task matches active filter, stay; if not, switch to appropriate tab so user sees it
            if (!matchesFilter(newTask, activeFilter)) {
                if (dueDate && dueDate > getOffsetIso(7)) {
                    activeFilter = "later";
                } else if (dueDate && dueDate > getTodayIso()) {
                    activeFilter = "week";
                } else {
                    activeFilter = "today";
                }
                tabButtons.forEach(b => {
                    const isActive = b.dataset.filter === activeFilter;
                    b.classList.toggle("is-active", isActive);
                    b.setAttribute("aria-selected", isActive ? "true" : "false");
                });
            }

            closeForm();
            render();

            isSubmitting = false;
        });

        // Keydown handling in form (Escape cancels)
        addForm.addEventListener("keydown", (e) => {
            if (e.key === "Escape") {
                e.preventDefault();
                closeForm();
            }
        });
    }

    // Initial load from backend
    render();
    loadTasks();

    

    // Synchronize with Scrapbook open/close state
    const albumMaster = document.getElementById("ricordi-album-master");
    const container = document.querySelector(".album-main-container");
    if (albumMaster && container) {
    const syncAlbumState = () => {
        const isOpen = albumMaster.classList.contains("is-open");

        container.classList.toggle("has-open-album", isOpen);
        document.body.classList.toggle("album-open", isOpen);
    };

    const observer = new MutationObserver(syncAlbumState);

    observer.observe(albumMaster, {
        attributes: true,
        attributeFilter: ["class"]
    });
        syncAlbumState();
}}