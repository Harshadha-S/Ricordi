/**
 * Ricordi — Realistic 3D Physical Page-Turning & Full-Size Scrapbook Controller
 * 2027 Edition (365 Days) with Persistent Journal Editor, Photo Scrapbook,
 * FilePond Uploads, SortableJS Drag-and-Drop, Lucide Icons & Scrawl UI
 */

const ALBUM_YEAR = 2027;
const TOTAL_DAYS = 365;
const MAX_WORDS = 500;

let promptMapByDate = new Map();
let journalEntriesByDate = new Map();
let photosByDate = new Map();
let dirtyDates = new Set();
let saveTimeoutMap = new Map();

let currentDate = new Date(2027, 0, 1); // January 1, 2027
let isTurning = false;

let filePondInstance = null;
let sortableInstance = null;

document.addEventListener("DOMContentLoaded", () => {
    initFilePondPlugins();
    loadAllData();
    initAlbumControls();
});

function initFilePondPlugins() {
    if (window.FilePond) {
        const plugins = [];
        if (window.FilePondPluginImagePreview) plugins.push(window.FilePondPluginImagePreview);
        if (window.FilePondPluginFileValidateType) plugins.push(window.FilePondPluginFileValidateType);
        if (window.FilePondPluginFileValidateSize) plugins.push(window.FilePondPluginFileValidateSize);
        if (plugins.length > 0) {
            FilePond.registerPlugin(...plugins);
        }
    }
}

// Load persistent questions, journal entries, and photos from backend REST APIs
async function loadAllData() {
    try {
        const [promptsRes, journalRes, photosRes] = await Promise.all([
            fetch('/api/prompts/all'),
            fetch('/api/journal/all'),
            fetch('/api/photos/all')
        ]);

        if (promptsRes.ok) {
            const data = await promptsRes.json();
            if (Array.isArray(data)) {
                promptMapByDate.clear();
                data.forEach(item => {
                    if (item && item.date) {
                        promptMapByDate.set(item.date, {
                            id: item.questionId,
                            question: item.questionText
                        });
                    }
                });
            }
        }

        if (journalRes.ok) {
            const journalData = await journalRes.json();
            if (Array.isArray(journalData)) {
                journalEntriesByDate.clear();
                journalData.forEach(item => {
                    if (item && item.date) {
                        journalEntriesByDate.set(item.date, item.content || "");
                    }
                });
            }
        }

        if (photosRes.ok) {
            const photoData = await photosRes.json();
            if (Array.isArray(photoData)) {
                photosByDate.clear();
                photoData.forEach(item => {
                    if (item && item.date) {
                        if (!photosByDate.has(item.date)) {
                            photosByDate.set(item.date, []);
                        }
                        photosByDate.get(item.date).push(item);
                    }
                });

                // Sort photos by displayOrder
                photosByDate.forEach((list) => {
                    list.sort((a, b) => (a.displayOrder || 0) - (b.displayOrder || 0));
                });
            }
        }
    } catch (err) {
        console.warn("Error loading scrapbook data from backend endpoints.", err);
    }

    // Render initial Jan 1, 2027 state
    const dayOfYear = getDayOfYear(currentDate);
    const prompt = getPromptForDate(currentDate);
    applySpreadContent(currentDate, dayOfYear, prompt);
    updateNavBounds();
}

function initAlbumControls() {
    const album = document.getElementById("ricordi-album-master");
    if (!album) return;

    // Click on closed album cover opens it
    album.addEventListener("click", (e) => {
        if (e.target.closest("a, input, button, textarea, .filepond--root") && !e.target.closest("#ricordiToggleBtn")) {
            return;
        }
        if (!album.classList.contains("is-open")) {
            openAlbum(album);
        }
    });

    // Keyboard accessibility
    document.addEventListener("keydown", (e) => {
        const isOpen = album.classList.contains("is-open");

        if (document.activeElement && ["INPUT", "TEXTAREA"].includes(document.activeElement.tagName)) {
            return;
        }

        if (!isOpen) {
            if ((e.key === "Enter" || e.key === " ") && (document.activeElement === album || document.activeElement.tagName === "BODY")) {
                e.preventDefault();
                openAlbum(album);
            }
        } else {
            if (e.key === "ArrowLeft" || e.key === "a" || e.key === "A") {
                e.preventDefault();
                prevDay();
            } else if (e.key === "ArrowRight" || e.key === "d" || e.key === "D") {
                e.preventDefault();
                nextDay();
            } else if (e.key === "Escape") {
                e.preventDefault();
                closeAlbum(album);
            }
        }
    });

    // Toggle button (Open / Close Album)
    const toggleBtn = document.getElementById("ricordiToggleBtn");
    if (toggleBtn) {
        toggleBtn.addEventListener("click", (e) => {
            e.stopPropagation();
            if (album.classList.contains("is-open")) {
                closeAlbum(album);
            } else {
                openAlbum(album);
            }
        });
    }

    // Previous Day Button
    const prevBtn = document.getElementById("ricordiPrevDayBtn");
    if (prevBtn) {
        prevBtn.addEventListener("click", (e) => {
            e.stopPropagation();
            prevDay();
        });
    }

    // Next Day Button
    const nextBtn = document.getElementById("ricordiNextDayBtn");
    if (nextBtn) {
        nextBtn.addEventListener("click", (e) => {
            e.stopPropagation();
            nextDay();
        });
    }

    // Date Picker Input
    const dateInput = document.getElementById("ricordiDateInput");
    if (dateInput) {
        dateInput.value = getIsoDate(currentDate);
        dateInput.setAttribute("min", `${ALBUM_YEAR}-01-01`);
        dateInput.setAttribute("max", `${ALBUM_YEAR}-12-31`);

        dateInput.addEventListener("change", (e) => {
            if (e.target.value) {
                const parts = e.target.value.split("-");
                if (parts.length === 3) {
                    let year = parseInt(parts[0]);
                    let month = parseInt(parts[1]) - 1;
                    let day = parseInt(parts[2]);

                    if (year !== ALBUM_YEAR) {
                        year = ALBUM_YEAR;
                    }

                    const pickedDate = new Date(year, month, day);
                    jumpToDate(pickedDate);
                }
            }
        });
    }
}

function openAlbum(album) {
    album.classList.add("is-open");
    album.setAttribute("aria-expanded", "true");
    updateNavButtons(true);
    refreshIcons();
}

function closeAlbum(album) {
    if (isTurning) return;
    ensureCurrentJournalSaved();
    album.classList.remove("is-open");
    album.setAttribute("aria-expanded", "false");
    updateNavButtons(false);
}

function updateNavButtons(isOpen) {
    const toggleBtnText = document.getElementById("ricordiToggleBtnText");
    const spreadNav = document.getElementById("ricordiSpreadNav");

    if (toggleBtnText) {
        toggleBtnText.textContent = isOpen ? "Close Album" : "Open Album";
    }

    if (spreadNav) {
        spreadNav.style.display = isOpen ? "flex" : "none";
    }

    updateNavBounds();
    refreshIcons();
}

function updateNavBounds() {
    const prevBtn = document.getElementById("ricordiPrevDayBtn");
    const nextBtn = document.getElementById("ricordiNextDayBtn");

    const iso = getIsoDate(currentDate);

    if (prevBtn) {
        prevBtn.disabled = (iso === `${ALBUM_YEAR}-01-01`);
    }

    if (nextBtn) {
        nextBtn.disabled = (iso === `${ALBUM_YEAR}-12-31`);
    }
}

function refreshIcons() {
    if (window.lucide && typeof window.lucide.createIcons === 'function') {
        window.lucide.createIcons();
    }
}

// Helper: Format Date
function formatDate(date) {
    const options = { month: 'long', day: 'numeric', year: 'numeric' };
    return date.toLocaleDateString('en-US', options);
}

function getIsoDate(date) {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
}

function getDayOfYear(date) {
    const start = new Date(date.getFullYear(), 0, 0);
    const diff = date - start;
    const oneDay = 1000 * 60 * 60 * 24;
    return Math.floor(diff / oneDay);
}

function getPromptForDate(date) {
    const isoDate = getIsoDate(date);
    if (promptMapByDate.has(isoDate)) {
        return promptMapByDate.get(isoDate);
    }
    const day = getDayOfYear(date);
    return {
        id: day,
        question: "What moment from today brought a smile to your face?"
    };
}

function escapeHtml(str) {
    if (!str) return "";
    return str
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

function getWordCount(text) {
    if (!text || !text.trim()) return 0;
    return text.trim().split(/\s+/).length;
}

// --------------------------------------------------------------------------
// Journal Editor Binds & Saving Logic
// --------------------------------------------------------------------------
function bindJournalEditorEvents(targetDate) {
    const textarea = document.getElementById("ricordiAnswerTextarea");
    const wordCountEl = document.getElementById("ricordiWordCount");
    const statusEl = document.getElementById("ricordiSaveStatus");

    if (!textarea) return;

    const isoDate = getIsoDate(targetDate);
    const savedContent = journalEntriesByDate.get(isoDate) || "";
    textarea.value = savedContent;
    updateWordCountDisplay(savedContent, wordCountEl);

    textarea.addEventListener("input", (e) => {
        const text = e.target.value;
        const words = getWordCount(text);

        if (words > MAX_WORDS) {
            const trimmed = trimToMaxWords(text, MAX_WORDS);
            textarea.value = trimmed;
            journalEntriesByDate.set(isoDate, trimmed);
            updateWordCountDisplay(trimmed, wordCountEl);
        } else {
            journalEntriesByDate.set(isoDate, text);
            updateWordCountDisplay(text, wordCountEl);
        }

        dirtyDates.add(isoDate);
        if (statusEl) {
            statusEl.textContent = "Unsaved changes...";
            statusEl.classList.remove("saved", "saving");
        }

        debounceSave(isoDate, statusEl);
    });

    textarea.addEventListener("blur", () => {
        if (dirtyDates.has(isoDate)) {
            saveJournalEntryImmediate(isoDate, statusEl);
        }
    });
}

function updateWordCountDisplay(text, wordCountEl) {
    if (!wordCountEl) return;
    const count = getWordCount(text);
    wordCountEl.textContent = `${count} / ${MAX_WORDS} words`;
    if (count >= MAX_WORDS) {
        wordCountEl.classList.add("limit-reached");
    } else {
        wordCountEl.classList.remove("limit-reached");
    }
}

function trimToMaxWords(text, maxWords) {
    const words = text.trim().split(/\s+/);
    return words.slice(0, maxWords).join(" ");
}

function debounceSave(isoDate, statusEl) {
    if (saveTimeoutMap.has(isoDate)) {
        clearTimeout(saveTimeoutMap.get(isoDate));
    }
    const timer = setTimeout(() => {
        saveJournalEntryImmediate(isoDate, statusEl);
    }, 1200);
    saveTimeoutMap.set(isoDate, timer);
}

async function saveJournalEntryImmediate(isoDate, statusEl) {
    if (!dirtyDates.has(isoDate)) return;

    if (statusEl) {
        statusEl.textContent = "Saving...";
        statusEl.classList.add("saving");
    }

    const content = journalEntriesByDate.get(isoDate) || "";

    try {
        const response = await fetch('/api/journal', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                date: isoDate,
                content: content
            })
        });

        if (response.ok) {
            dirtyDates.delete(isoDate);
            if (statusEl) {
                statusEl.textContent = "Saved";
                statusEl.classList.remove("saving");
                statusEl.classList.add("saved");
                setTimeout(() => {
                    if (statusEl && statusEl.textContent === "Saved") {
                        statusEl.textContent = "";
                        statusEl.classList.remove("saved");
                    }
                }, 2000);
            }
        } else {
            if (statusEl) {
                statusEl.textContent = "Error saving";
                statusEl.classList.remove("saving");
            }
        }
    } catch (err) {
        console.error("Error saving journal entry:", err);
        if (statusEl) {
            statusEl.textContent = "Error saving";
            statusEl.classList.remove("saving");
        }
    }
}

function ensureCurrentJournalSaved() {
    const isoDate = getIsoDate(currentDate);
    if (dirtyDates.has(isoDate)) {
        const statusEl = document.getElementById("ricordiSaveStatus");
        saveJournalEntryImmediate(isoDate, statusEl);
    }
}

// --------------------------------------------------------------------------
// Right Page Photo Scrapbook (FilePond + SortableJS)
// --------------------------------------------------------------------------
function bindRightPagePhotoEvents(targetDate) {
    const isoDate = getIsoDate(targetDate);
    initSortable(isoDate);
    initFilePond(isoDate);
    refreshIcons();
}

function initSortable(isoDate) {
    const container = document.getElementById("ricordiPhotoContainer");
    if (!container) return;

    if (sortableInstance) {
        try { sortableInstance.destroy(); } catch (e) {}
        sortableInstance = null;
    }

    if (window.Sortable && container.children.length > 0) {
        sortableInstance = Sortable.create(container, {
            animation: 200,
            handle: ".ricordi-drag-handle",
            ghostClass: "sortable-ghost",
            chosenClass: "sortable-chosen",
            dragClass: "sortable-drag",
            onEnd: function () {
                savePhotoOrder(isoDate);
            }
        });
    }
}

async function savePhotoOrder(isoDate) {
    const container = document.getElementById("ricordiPhotoContainer");
    if (!container) return;

    const cards = container.querySelectorAll(".ricordi-scrapbook-polaroid");
    const photoIds = Array.from(cards)
        .map(card => parseInt(card.getAttribute("data-photo-id")))
        .filter(id => !isNaN(id));

    let photos = photosByDate.get(isoDate) || [];
    photos.sort((a, b) => photoIds.indexOf(a.id) - photoIds.indexOf(b.id));
    photosByDate.set(isoDate, photos);

    try {
        await fetch('/api/photos/reorder', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                date: isoDate,
                photoIds: photoIds
            })
        });
    } catch (err) {
        console.error("Error saving reordered photos:", err);
    }
}

function initFilePond(isoDate) {
    const pondInput = document.getElementById("ricordiFilePondInput");
    const pondWrap = document.getElementById("ricordiFilePondWrap");
    const limitMsg = document.getElementById("ricordiPhotoLimitMsg");
    if (!pondInput) return;

    const photos = photosByDate.get(isoDate) || [];
    const isFull = photos.length >= 3;

    if (limitMsg) {
        limitMsg.style.display = isFull ? "inline-flex" : "none";
    }

    if (filePondInstance) {
        try { filePondInstance.destroy(); } catch (e) {}
        filePondInstance = null;
    }

    if (isFull) {
        if (pondWrap) pondWrap.style.display = "none";
        return;
    }

    if (pondWrap) pondWrap.style.display = "block";

    if (window.FilePond) {
        initFilePondPlugins();
        filePondInstance = FilePond.create(pondInput, {
            maxFiles: 1,
            allowMultiple: false,
            maxFileSize: '10MB',
            acceptedFileTypes: ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'],
            labelIdle: '<span class="filepond--label-action"><i data-lucide="upload-cloud" class="filepond-upload-icon"></i> Add Memory Photo (<span class="pond-count">' + photos.length + '</span>/3)</span>',
            server: {
                process: (fieldName, file, metadata, load, error, progress, abort) => {
                    const formData = new FormData();
                    formData.append("file", file, file.name);
                    formData.append("date", isoDate);
                    formData.append("caption", "");

                    fetch('/api/photos/upload', {
                        method: 'POST',
                        body: formData
                    })
                    .then(res => {
                        if (!res.ok) {
                            return res.json().then(e => Promise.reject(e.error || 'Upload failed'));
                        }
                        return res.json();
                    })
                    .then(savedPhoto => {
                        load(savedPhoto.id);
                        let datePhotos = photosByDate.get(isoDate) || [];
                        datePhotos.push(savedPhoto);
                        photosByDate.set(isoDate, datePhotos);

                        const rightEl = document.getElementById("ricordiPageRight");
                        const dayOfYear = getDayOfYear(currentDate);
                        if (rightEl) {
                            rightEl.innerHTML = renderRightPageHtml(currentDate, dayOfYear);
                            bindRightPagePhotoEvents(currentDate);
                        }
                    })
                    .catch(err => {
                        alert("Upload failed: " + err);
                        error(err.toString());
                    });
                }
            }
        });
        refreshIcons();
    }
}

async function deletePhoto(photoId) {
    if (!confirm("Are you sure you want to remove this memory photo?")) return;

    try {
        const response = await fetch(`/api/photos/${photoId}`, {
            method: 'DELETE'
        });

        if (response.ok) {
            const isoDate = getIsoDate(currentDate);
            let photos = photosByDate.get(isoDate) || [];
            photos = photos.filter(p => p.id !== photoId && p.id != photoId);
            photosByDate.set(isoDate, photos);

            const dayOfYear = getDayOfYear(currentDate);
            const rightEl = document.getElementById("ricordiPageRight");
            if (rightEl) {
                rightEl.innerHTML = renderRightPageHtml(currentDate, dayOfYear);
                bindRightPagePhotoEvents(currentDate);
            }
        } else {
            alert("Failed to delete photo.");
        }
    } catch (err) {
        console.error("Error deleting photo", err);
        alert("Failed to delete photo due to network error.");
    }
}

async function updateCaption(photoId, newCaption) {
    try {
        const response = await fetch(`/api/photos/${photoId}/caption`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ caption: newCaption })
        });

        if (response.ok) {
            const updated = await response.json();
            const isoDate = getIsoDate(currentDate);
            const photos = photosByDate.get(isoDate) || [];
            const idx = photos.findIndex(p => p.id === photoId || p.id == photoId);
            if (idx !== -1) {
                photos[idx].caption = updated.caption;
            }
        }
    } catch (err) {
        console.error("Error updating caption", err);
    }
}

// --------------------------------------------------------------------------
// HTML Page Renderers
// --------------------------------------------------------------------------
function renderLeftPageHtml(date, dayOfYear, prompt) {
    const formatted = formatDate(date);
    const isoDate = getIsoDate(date);
    const content = journalEntriesByDate.get(isoDate) || "";
    const wordCount = getWordCount(content);

    return `
        <!-- Scrapbook Washi Tape Accent (Non-blocking) -->

        <div class="ricordi-day-header">
            <span class="ricordi-day-title">DAY ${dayOfYear} OF ${TOTAL_DAYS}</span>
            <span class="ricordi-date-badge">${formatted}</span>
        </div>
        <div class="ricordi-question-card scrawl-paper-card">
            <span class="ricordi-question-number">DAILY QUESTION #${prompt.id}</span>
            <p class="ricordi-question-text">${escapeHtml(prompt.question)}</p>
        </div>
        <div class="ricordi-journal-editor-wrap">
            <textarea id="ricordiAnswerTextarea"
                      class="ricordi-journal-textarea"
                      placeholder="Write your thoughts here..."
                      aria-label="Daily Journal Response"
                      rows="6">${escapeHtml(content)}</textarea>
            <div class="ricordi-editor-footer">
                <span id="ricordiWordCount" class="ricordi-word-count ${wordCount >= MAX_WORDS ? 'limit-reached' : ''}">${wordCount} / ${MAX_WORDS} words</span>
                <span id="ricordiSaveStatus" class="ricordi-save-status" aria-live="polite"></span>
            </div>
        </div>
    `;
}

function renderRightPageHtml(date, dayOfYear) {
    const monthNames = [
        "January", "February", "March", "April", "May", "June",
        "July", "August", "September", "October", "November", "December"
    ];
    const heading = `Memories for ${monthNames[date.getMonth()]} ${date.getDate()}, ${date.getFullYear()}`;
    const isoDate = getIsoDate(date);
    const photos = photosByDate.get(isoDate) || [];
    const isFull = photos.length >= 3;

    let polaroidsHtml = "";
    if (photos.length === 0) {
        polaroidsHtml = `<p class="ricordi-photo-empty-msg"><i data-lucide="image" class="empty-icon"></i> Add your first memory for this day...</p>`;
    } else {
        photos.forEach((photo, idx) => {
            const rotClass = `photo-rot-${idx % 3}`;
            polaroidsHtml += `
                <div class="ricordi-scrapbook-polaroid ${rotClass}" data-photo-id="${photo.id}">
                    <div class="ricordi-polaroid-top-bar">
                        <span class="ricordi-drag-handle" title="Drag to reorder"><i data-lucide="grip-vertical"></i></span>
                        <button type="button" class="ricordi-polaroid-delete-btn" title="Remove Photo" onclick="RicordiAlbum.deletePhoto(${photo.id})"><i data-lucide="trash-2"></i></button>
                    </div>
                    <div class="ricordi-polaroid-img-wrap">
                        <img src="${escapeHtml(photo.url)}" alt="Memory photo ${idx + 1}" />
                    </div>
                    <input type="text"
                           class="ricordi-caption-input"
                           placeholder="Add a caption..."
                           value="${escapeHtml(photo.caption || '')}"
                           onchange="RicordiAlbum.updateCaption(${photo.id}, this.value)"
                           aria-label="Photo caption" />
                </div>
            `;
        });
    }

    return `
        <!-- Scrapbook Washi Tape Accent (Non-blocking) -->
        <div class="ricordi-journal-header">
            <h3 class="ricordi-journal-heading">${heading}</h3>
            <span class="ricordi-journal-tag">Day ${dayOfYear}</span>
        </div>
        <div id="ricordiPhotoScrapbook" class="ricordi-photo-scrapbook">
            <div id="ricordiPhotoContainer" class="ricordi-photo-container">
                ${polaroidsHtml}
            </div>
            <div id="ricordiUploadArea" class="ricordi-upload-area">
                <div id="ricordiFilePondWrap" class="ricordi-filepond-wrap" ${isFull ? 'style="display:none;"' : ''}>
                    <input type="file" id="ricordiFilePondInput" class="filepond" name="file" accept="image/jpeg,image/png,image/webp" />
                </div>
                <span id="ricordiPhotoLimitMsg" class="ricordi-photo-limit-msg" ${isFull ? '' : 'style="display:none;"'}>
                    <i data-lucide="check-circle" class="limit-icon"></i> Page is full (3/3 photos)
                </span>
            </div>
        </div>
    `;
}

function applySpreadContent(date, dayOfYear, prompt) {
    const leftEl = document.getElementById("ricordiPageLeft");
    const rightEl = document.getElementById("ricordiPageRight");

    if (leftEl) {
        leftEl.innerHTML = renderLeftPageHtml(date, dayOfYear, prompt);
        bindJournalEditorEvents(date);
    }
    if (rightEl) {
        rightEl.innerHTML = renderRightPageHtml(date, dayOfYear);
        bindRightPagePhotoEvents(date);
    }

    const dateInput = document.getElementById("ricordiDateInput");
    if (dateInput) dateInput.value = getIsoDate(date);
    refreshIcons();
}

// --------------------------------------------------------------------------
// Physical 3D Page Turn Engine
// --------------------------------------------------------------------------
function nextDay() {
    if (isTurning) return;
    if (getIsoDate(currentDate) === `${ALBUM_YEAR}-12-31`) return;

    const targetDate = new Date(currentDate);
    targetDate.setDate(targetDate.getDate() + 1);
    turnPageToDate(targetDate, 1);
}

function prevDay() {
    if (isTurning) return;
    if (getIsoDate(currentDate) === `${ALBUM_YEAR}-01-01`) return;

    const targetDate = new Date(currentDate);
    targetDate.setDate(targetDate.getDate() - 1);
    turnPageToDate(targetDate, -1);
}

function jumpToDate(targetDate) {
    if (isTurning) return;

    if (targetDate.getFullYear() !== ALBUM_YEAR) {
        targetDate = new Date(ALBUM_YEAR, targetDate.getMonth(), targetDate.getDate());
    }

    if (targetDate.getTime() === currentDate.getTime()) return;
    const direction = targetDate > currentDate ? 1 : -1;
    turnPageToDate(targetDate, direction);
}

function turnPageToDate(targetDate, direction) {
    if (isTurning) return;

    ensureCurrentJournalSaved();

    const prefersReducedMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) {
        currentDate = targetDate;
        const dayOfYear = getDayOfYear(currentDate);
        const prompt = getPromptForDate(currentDate);
        applySpreadContent(currentDate, dayOfYear, prompt);
        updateNavBounds();
        return;
    }

    isTurning = true;
    setNavButtonsDisabled(true);

    const leaf = document.getElementById("ricordiTurningLeaf");
    const leafFrontContent = document.getElementById("ricordiLeafFrontContent");
    const leafBackContent = document.getElementById("ricordiLeafBackContent");
    const pageLeft = document.getElementById("ricordiPageLeft");
    const pageRight = document.getElementById("ricordiPageRight");

    const currDay = getDayOfYear(currentDate);
    const currPrompt = getPromptForDate(currentDate);
    const targetDay = getDayOfYear(targetDate);
    const targetPrompt = getPromptForDate(targetDate);

    if (direction === 1) {
        leafFrontContent.innerHTML = renderRightPageHtml(currentDate, currDay);
        leafBackContent.innerHTML = renderLeftPageHtml(targetDate, targetDay, targetPrompt);
        pageRight.innerHTML = renderRightPageHtml(targetDate, targetDay);

        leaf.className = "ricordi-turning-leaf active";
        leaf.style.transform = "rotateY(0deg)";
        void leaf.offsetWidth;

        leaf.classList.add("turning-forward");
        if (pageLeft) pageLeft.classList.add("under-turn-shadow");
        if (pageRight) pageRight.classList.add("under-turn-shadow");

        const cleanup = () => {
            leaf.removeEventListener("animationend", cleanup);
            leaf.className = "ricordi-turning-leaf";
            if (pageLeft) {
                pageLeft.classList.remove("under-turn-shadow");
                pageLeft.innerHTML = renderLeftPageHtml(targetDate, targetDay, targetPrompt);
                bindJournalEditorEvents(targetDate);
            }
            if (pageRight) {
                pageRight.classList.remove("under-turn-shadow");
                bindRightPagePhotoEvents(targetDate);
            }

            currentDate = targetDate;
            const dateInput = document.getElementById("ricordiDateInput");
            if (dateInput) dateInput.value = getIsoDate(currentDate);

            isTurning = false;
            updateNavBounds();
            refreshIcons();
        };

        leaf.addEventListener("animationend", cleanup, { once: true });
        setTimeout(() => { if (isTurning) cleanup(); }, 850);

    } else {
        leafFrontContent.innerHTML = renderRightPageHtml(targetDate, targetDay);
        leafBackContent.innerHTML = renderLeftPageHtml(currentDate, currDay, currPrompt);
        pageLeft.innerHTML = renderLeftPageHtml(targetDate, targetDay, targetPrompt);

        leaf.className = "ricordi-turning-leaf active";
        leaf.style.transform = "rotateY(-180deg)";
        void leaf.offsetWidth;

        leaf.classList.add("turning-backward");
        if (pageLeft) pageLeft.classList.add("under-turn-shadow");
        if (pageRight) pageRight.classList.add("under-turn-shadow");

        const cleanup = () => {
            leaf.removeEventListener("animationend", cleanup);
            leaf.className = "ricordi-turning-leaf";
            if (pageRight) {
                pageRight.classList.remove("under-turn-shadow");
                pageRight.innerHTML = renderRightPageHtml(targetDate, targetDay);
                bindRightPagePhotoEvents(targetDate);
            }
            if (pageLeft) {
                pageLeft.classList.remove("under-turn-shadow");
                pageLeft.innerHTML = renderLeftPageHtml(targetDate, targetDay, targetPrompt);
                bindJournalEditorEvents(targetDate);
            }

            currentDate = targetDate;
            const dateInput = document.getElementById("ricordiDateInput");
            if (dateInput) dateInput.value = getIsoDate(currentDate);

            isTurning = false;
            updateNavBounds();
            refreshIcons();
        };

        leaf.addEventListener("animationend", cleanup, { once: true });
        setTimeout(() => { if (isTurning) cleanup(); }, 850);
    }
}

function setNavButtonsDisabled(disabled) {
    const prevBtn = document.getElementById("ricordiPrevDayBtn");
    const nextBtn = document.getElementById("ricordiNextDayBtn");

    if (disabled) {
        if (prevBtn) prevBtn.disabled = true;
        if (nextBtn) nextBtn.disabled = true;
    } else {
        updateNavBounds();
    }
}

// Global API Export
window.RicordiAlbum = {
    open: () => openAlbum(document.getElementById("ricordi-album-master")),
    close: () => closeAlbum(document.getElementById("ricordi-album-master")),
    next: () => nextDay(),
    prev: () => prevDay(),
    goToDate: (dateStr) => {
        const parts = dateStr.split("-");
        if (parts.length === 3) {
            const date = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
            jumpToDate(date);
        }
    },
    deletePhoto: (photoId) => deletePhoto(photoId),
    updateCaption: (photoId, caption) => updateCaption(photoId, caption)
};
