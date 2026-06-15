import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import {
  getDatabase,
  ref,
  onValue,
  set,
  get
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-database.js";
import {
  getAuth,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  setPersistence,
  browserSessionPersistence
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

/*
  1) Firebase를 쓰려면 아래 값들을 Firebase 콘솔의 Web App 설정값으로 교체하세요.
  2) 비워두면 localStorage 데모 모드로 동작합니다.
*/
const firebaseConfig = {
  apiKey: "AIzaSyBPysuBDerQ2rMN4E_blY-jpU4Wj4JkVHo",
  authDomain: "bingo-d4a00.firebaseapp.com",
  // Firebase 콘솔 > Realtime Database에서 정확한 URL을 복사해 넣으세요.
  // 예: "https://bingo-d4a00-default-rtdb.asia-southeast1.firebasedatabase.app"
  databaseURL: "https://bingo-d4a00-default-rtdb.firebaseio.com/",
  projectId: "bingo-d4a00",
  storageBucket: "bingo-d4a00.firebasestorage.app",
  messagingSenderId: "166246860692",
  appId: "1:166246860692:web:f9e40453a441594250f181",
  measurementId: "G-4DW4SXCZR3"
};

const ROOM_PATH = "bingoRooms/main";
const LOCAL_STORAGE_KEY = "bkg-bingo-v1-state";
const LOCAL_ADMIN_PIN = "1234";
const ADMIN_EMAIL_DOMAIN = "@suweet.com";

const stateDefaults = {
  title: "오늘의 빙고",
  size: 5,
  contentType: "mission",
  chickenCount: 0,
  bingoCount: 0,
  completedLines: {},
  effectNonce: 0,
  lastNewLines: [],
  cells: []
};

const $ = (selector) => document.querySelector(selector);
const $$ = (selector) => [...document.querySelectorAll(selector)];

const els = {
  pageTitle: $("#pageTitle"),
  topbar: $("#topbar"),
  adminPanel: $("#adminPanel"),
  loginStatus: $("#loginStatus"),
  firebaseLoginBox: $("#firebaseLoginBox"),
  localLoginBox: $("#localLoginBox"),
  adminEmail: $("#adminEmail"),
  adminPassword: $("#adminPassword"),
  loginBtn: $("#loginBtn"),
  logoutBtn: $("#logoutBtn"),
  localPin: $("#localPin"),
  localLoginBtn: $("#localLoginBtn"),
  localLogoutBtn: $("#localLogoutBtn"),
  titleInput: $("#titleInput"),
  sizeSelect: $("#sizeSelect"),
  typeSelect: $("#typeSelect"),
  createBoardBtn: $("#createBoardBtn"),
  shuffleBtn: $("#shuffleBtn"),
  resetChecksBtn: $("#resetChecksBtn"),
  chickenPreview: $("#chickenPreview"),
  chickenInput: $("#chickenInput"),
  chickenMinusBtn: $("#chickenMinusBtn"),
  chickenPlusBtn: $("#chickenPlusBtn"),
  bulkText: $("#bulkText"),
  applyBulkBtn: $("#applyBulkBtn"),
  clearBulkBtn: $("#clearBulkBtn"),
  hardResetBtn: $("#hardResetBtn"),
  stage: $("#stage"),
  boardWrap: $("#boardWrap"),
  bingoBoard: $("#bingoBoard"),
  lineLayer: $("#lineLayer"),
  bingoOverlay: $("#bingoOverlay"),
  bingoCount: $("#bingoCount"),
  chickenCount: $("#chickenCount"),
  maxBingoCount: $("#maxBingoCount"),
  maxBingoBox: $("#maxBingoBox"),
  cellEditorHelp: $("#cellEditorHelp")
};

let currentState = makeInitialState();
let firebaseApp = null;
let db = null;
let auth = null;
let roomRef = null;
let isFirebaseEnabled = Boolean(firebaseConfig.apiKey && firebaseConfig.databaseURL && firebaseConfig.projectId);
let isAdmin = false;
let activeView = new URLSearchParams(location.search).get("view") || "public";
let lastRenderedEffectNonce = 0;
let titleSaveTimer = null;
let cellSaveTimers = new Map();

if (!["public", "obs", "admin"].includes(activeView)) activeView = "public";

init();

async function init() {
  setupView();
  bindEvents();
  setupFirebaseIfAvailable();
  await loadInitialState();
  render();
}

function setupView() {
  document.body.classList.add(`view-${activeView}`);
  $$('[data-view-link]').forEach((link) => {
    link.classList.toggle("active", link.dataset.viewLink === activeView);
  });

  if (activeView === "admin") {
    els.adminPanel.hidden = false;
    els.cellEditorHelp.hidden = false;
  }
}

function setupFirebaseIfAvailable() {
  if (!isFirebaseEnabled) {
    els.localLoginBox.hidden = false;
    els.firebaseLoginBox.hidden = true;
    setLoginStatus("로컬 모드", "warn");
    return;
  }

  firebaseApp = initializeApp(firebaseConfig);
  db = getDatabase(firebaseApp);
  auth = getAuth(firebaseApp);
  roomRef = ref(db, ROOM_PATH);

  els.firebaseLoginBox.hidden = false;
  els.localLoginBox.hidden = true;

  onAuthStateChanged(auth, (user) => {
    isAdmin = Boolean(user);
    setLoginStatus(isAdmin ? "관리자 로그인됨" : "보기 전용", isAdmin ? "ok" : "warn");
    renderAdminLock();
  });

  onValue(roomRef, (snapshot) => {
    if (!snapshot.exists()) return;
    currentState = normalizeState(snapshot.val());
    render();
  });
}

async function loadInitialState() {
  if (isFirebaseEnabled) {
    const snapshot = await get(roomRef);
    if (snapshot.exists()) {
      currentState = normalizeState(snapshot.val());
    } else {
      currentState = makeInitialState();
      // 방이 없을 때는 로그인한 관리자만 생성 가능. 미로그인 상태면 화면에 기본값만 표시됩니다.
      if (auth.currentUser) await saveWholeState(currentState);
    }
    return;
  }

  const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
  currentState = saved ? normalizeState(JSON.parse(saved)) : makeInitialState();
}

function bindEvents() {
  els.loginBtn?.addEventListener("click", async () => {
    try {
      const email = makeLoginEmail(els.adminEmail.value);

if (!email) {
  alert("아이디를 입력해 주세요.");
  return;
}

await setPersistence(auth, browserSessionPersistence);
await signInWithEmailAndPassword(auth, email, els.adminPassword.value);
    } catch (error) {
      alert(`로그인 실패: ${error.message}`);
    }
  });

  els.logoutBtn?.addEventListener("click", async () => {
    if (auth) await signOut(auth);
  });

  els.localLoginBtn?.addEventListener("click", () => {
    if (els.localPin.value === LOCAL_ADMIN_PIN) {
      isAdmin = true;
      setLoginStatus("관리자 열림", "ok");
      renderAdminLock();
      render();
      return;
    }
    alert("PIN이 맞지 않습니다. app.js에서 LOCAL_ADMIN_PIN 값을 바꿀 수 있어요.");
  });

  els.localLogoutBtn?.addEventListener("click", () => {
    isAdmin = false;
    setLoginStatus("로컬 모드", "warn");
    renderAdminLock();
    render();
  });

  els.titleInput.addEventListener("input", () => {
    clearTimeout(titleSaveTimer);
    titleSaveTimer = setTimeout(() => {
      commitState((draft) => {
        draft.title = els.titleInput.value.trim() || "오늘의 빙고";
      });
    }, 350);
  });

  els.createBoardBtn.addEventListener("click", () => {
    const size = Number(els.sizeSelect.value);
    const contentType = els.typeSelect.value;
    commitState((draft) => {
      draft.size = size;
      draft.contentType = contentType;
      draft.cells = buildCells(size, contentType);
      draft.completedLines = {};
      draft.bingoCount = 0;
      draft.effectNonce += 1;
      draft.lastNewLines = [];
    });
  });

  els.shuffleBtn.addEventListener("click", () => {
    commitState((draft) => {
      const texts = shuffleArray(draft.cells.map((cell) => cell.text));
      draft.cells = draft.cells.map((cell, index) => ({ ...cell, text: texts[index] }));
    });
  });

  els.resetChecksBtn.addEventListener("click", () => {
    commitState((draft) => {
      draft.cells = draft.cells.map((cell) => ({ ...cell, cleared: false }));
      draft.completedLines = {};
      draft.bingoCount = 0;
      draft.lastNewLines = [];
      draft.effectNonce += 1;
    });
  });

  els.chickenMinusBtn.addEventListener("click", () => updateChicken(-1));
  els.chickenPlusBtn.addEventListener("click", () => updateChicken(1));
  els.chickenInput.addEventListener("change", () => {
    const value = Math.max(0, Number(els.chickenInput.value || 0));
    commitState((draft) => {
      draft.chickenCount = value;
    });
  });

  els.applyBulkBtn.addEventListener("click", () => {
    const lines = els.bulkText.value
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean);

    if (!lines.length) {
      alert("적용할 내용이 없습니다.");
      return;
    }

    commitState((draft) => {
      draft.cells = draft.cells.map((cell, index) => ({
        ...cell,
        text: lines[index] ?? cell.text
      }));
    });
  });

  els.clearBulkBtn.addEventListener("click", () => {
    els.bulkText.value = "";
  });

  els.hardResetBtn.addEventListener("click", () => {
    if (!confirm("전체 초기화할까요? 빙고판과 치킨 수가 모두 초기화됩니다.")) return;
    commitState((draft) => {
      const fresh = makeInitialState();
      Object.assign(draft, fresh);
    });
  });
}

function updateChicken(delta) {
  commitState((draft) => {
    draft.chickenCount = Math.max(0, Number(draft.chickenCount || 0) + delta);
  });
}

function render() {
  currentState = normalizeState(currentState);

  els.pageTitle.textContent = currentState.title;
  els.titleInput.value = currentState.title;
  els.sizeSelect.value = String(currentState.size);
  els.typeSelect.value = currentState.contentType;
  els.chickenInput.value = String(currentState.chickenCount);
  els.chickenPreview.textContent = currentState.chickenCount;
  els.bingoCount.textContent = currentState.bingoCount;
  els.chickenCount.textContent = currentState.chickenCount;
  els.maxBingoCount.textContent = currentState.size * 2 + 2;
  els.bingoBoard.style.setProperty("--cell-size", currentState.size);

  renderAdminLock();
  renderBoard();
  renderLines();
  maybePlayBingoEffect();
}

function renderAdminLock() {
  const locked = activeView === "admin" && !isAdmin;
  $$('[data-admin-only]').forEach((item) => {
    item.style.opacity = locked ? ".45" : "1";
    item.style.pointerEvents = locked ? "none" : "auto";
  });

  const shouldDisable = activeView === "admin" && !isAdmin;
  [
    els.titleInput,
    els.sizeSelect,
    els.typeSelect,
    els.createBoardBtn,
    els.shuffleBtn,
    els.resetChecksBtn,
    els.chickenInput,
    els.chickenMinusBtn,
    els.chickenPlusBtn,
    els.bulkText,
    els.applyBulkBtn,
    els.clearBulkBtn,
    els.hardResetBtn
  ].forEach((el) => {
    if (el) el.disabled = shouldDisable;
  });
}

function renderBoard() {
  els.bingoBoard.innerHTML = "";
  const completedCellIndexes = new Set(
    Object.values(currentState.completedLines || {}).flatMap((line) => line.cells)
  );

  currentState.cells.forEach((cell, index) => {
    const cellEl = document.createElement("div");
    cellEl.className = "cell";
    cellEl.dataset.index = String(index);
    cellEl.classList.toggle("cleared", Boolean(cell.cleared));
    cellEl.classList.toggle("line-completed", completedCellIndexes.has(index));

    if (activeView === "admin" && isAdmin) {
      const textarea = document.createElement("textarea");
      textarea.className = "admin-cell-editor";
      textarea.value = cell.text;
      textarea.maxLength = 80;
      textarea.addEventListener("input", () => scheduleCellTextSave(index, textarea.value));

      const actions = document.createElement("div");
      actions.className = "cell-actions";

      const toggleBtn = document.createElement("button");
      toggleBtn.className = `cell-mini-btn${cell.cleared ? " active" : ""}`;
      toggleBtn.textContent = cell.cleared ? "복구" : "지움";
      toggleBtn.addEventListener("click", () => toggleCell(index));

      actions.append(toggleBtn);
      cellEl.append(textarea, actions);
    } else {
      const text = document.createElement("div");
      text.className = "cell-text";
      text.textContent = cell.text;
      cellEl.append(text);
    }

    els.bingoBoard.append(cellEl);
  });
}

function renderLines() {
  els.lineLayer.innerHTML = "";
  const lines = Object.values(currentState.completedLines || {});
  const newLineIds = new Set(currentState.lastNewLines || []);

  lines.forEach((line) => {
    const coords = getLineCoords(line, currentState.size);
    const svgLine = document.createElementNS("http://www.w3.org/2000/svg", "line");
    svgLine.setAttribute("x1", coords.x1);
    svgLine.setAttribute("y1", coords.y1);
    svgLine.setAttribute("x2", coords.x2);
    svgLine.setAttribute("y2", coords.y2);
    svgLine.classList.add("bingo-line");
    if (newLineIds.has(line.id)) svgLine.classList.add("new");
    els.lineLayer.append(svgLine);
  });
}

function maybePlayBingoEffect() {
  const hasNewLine = currentState.effectNonce !== lastRenderedEffectNonce && (currentState.lastNewLines || []).length > 0;
  if (!hasNewLine) return;

  lastRenderedEffectNonce = currentState.effectNonce;
  els.bingoOverlay.hidden = false;
  els.bingoOverlay.style.animation = "none";
  void els.bingoOverlay.offsetWidth;
  els.bingoOverlay.style.animation = "";

  window.setTimeout(() => {
    els.bingoOverlay.hidden = true;
  }, 1700);
}

function scheduleCellTextSave(index, value) {
  clearTimeout(cellSaveTimers.get(index));
  const timer = setTimeout(() => {
    commitState((draft) => {
      if (!draft.cells[index]) return;
      draft.cells[index].text = value.trim() || `미션 ${index + 1}`;
    });
  }, 320);
  cellSaveTimers.set(index, timer);
}

function toggleCell(index) {
  commitState((draft) => {
    if (!draft.cells[index]) return;
    draft.cells[index].cleared = !draft.cells[index].cleared;
  });
}

async function commitState(mutator) {
  if (activeView === "admin" && !isAdmin) {
    alert("관리자 로그인 후 수정할 수 있습니다.");
    return;
  }

  const before = normalizeState(currentState);
  const draft = structuredClone(before);
  mutator(draft);

  const after = applyBingoCalculation(draft, before.completedLines || {});
  await saveWholeState(after);
}

async function saveWholeState(nextState) {
  currentState = normalizeState(nextState);

  if (isFirebaseEnabled) {
    if (!auth.currentUser) {
      render();
      alert("Firebase 모드에서는 관리자 로그인 후 저장할 수 있습니다.");
      return;
    }
    await set(roomRef, currentState);
    return;
  }

  localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(currentState));
  render();
}

function makeInitialState() {
  const base = structuredClone(stateDefaults);
  base.cells = buildCells(base.size, base.contentType);
  return applyBingoCalculation(base, {});
}

function normalizeState(raw) {
  const size = [5, 7, 10].includes(Number(raw?.size)) ? Number(raw.size) : 5;
  const contentType = ["mission", "number", "alphabet"].includes(raw?.contentType) ? raw.contentType : "mission";
  const cells = Array.isArray(raw?.cells) && raw.cells.length === size * size
    ? raw.cells.map((cell, index) => ({
        id: cell.id || `cell_${index}`,
        index,
        text: String(cell.text ?? `미션 ${index + 1}`),
        cleared: Boolean(cell.cleared)
      }))
    : buildCells(size, contentType);

  return applyBingoCalculation({
    ...stateDefaults,
    ...raw,
    title: String(raw?.title || "오늘의 빙고"),
    size,
    contentType,
    chickenCount: Math.max(0, Number(raw?.chickenCount || 0)),
    effectNonce: Number(raw?.effectNonce || 0),
    lastNewLines: Array.isArray(raw?.lastNewLines) ? raw.lastNewLines : [],
    cells
  }, raw?.completedLines || {});
}

function buildCells(size, contentType) {
  const count = size * size;
  return Array.from({ length: count }, (_, index) => ({
    id: `cell_${index}`,
    index,
    text: makeCellText(index, contentType),
    cleared: false
  }));
}

function makeCellText(index, contentType) {
  if (contentType === "number") return String(index + 1);
  if (contentType === "alphabet") return excelColumnName(index + 1);
  return `미션 ${index + 1}`;
}

function excelColumnName(number) {
  let name = "";
  while (number > 0) {
    const mod = (number - 1) % 26;
    name = String.fromCharCode(65 + mod) + name;
    number = Math.floor((number - mod) / 26);
  }
  return name;
}

function applyBingoCalculation(draft, previousCompletedLines) {
  const completedLines = computeCompletedLines(draft.cells, draft.size);
  const newLines = Object.keys(completedLines).filter((lineId) => !previousCompletedLines[lineId]);

  draft.completedLines = completedLines;
  draft.bingoCount = Object.keys(completedLines).length;

  if (newLines.length > 0) {
    draft.lastNewLines = newLines;
    draft.effectNonce = Number(draft.effectNonce || 0) + 1;
  } else {
    draft.lastNewLines = [];
  }

  return draft;
}

function computeCompletedLines(cells, size) {
  const completed = {};
  const isCleared = (index) => Boolean(cells[index]?.cleared);

  for (let row = 0; row < size; row += 1) {
    const indexes = Array.from({ length: size }, (_, col) => row * size + col);
    if (indexes.every(isCleared)) {
      completed[`row_${row}`] = { id: `row_${row}`, type: "row", index: row, cells: indexes };
    }
  }

  for (let col = 0; col < size; col += 1) {
    const indexes = Array.from({ length: size }, (_, row) => row * size + col);
    if (indexes.every(isCleared)) {
      completed[`col_${col}`] = { id: `col_${col}`, type: "col", index: col, cells: indexes };
    }
  }

  const diagA = Array.from({ length: size }, (_, index) => index * size + index);
  if (diagA.every(isCleared)) {
    completed.diag_0 = { id: "diag_0", type: "diag", index: 0, cells: diagA };
  }

  const diagB = Array.from({ length: size }, (_, index) => index * size + (size - 1 - index));
  if (diagB.every(isCleared)) {
    completed.diag_1 = { id: "diag_1", type: "diag", index: 1, cells: diagB };
  }

  return completed;
}

function getLineCoords(line, size) {
  const gap = 3;
  const step = 100 / size;

  if (line.type === "row") {
    const y = step * (line.index + 0.5);
    return { x1: gap, y1: y, x2: 100 - gap, y2: y };
  }

  if (line.type === "col") {
    const x = step * (line.index + 0.5);
    return { x1: x, y1: gap, x2: x, y2: 100 - gap };
  }

  if (line.id === "diag_0") return { x1: gap, y1: gap, x2: 100 - gap, y2: 100 - gap };
  return { x1: 100 - gap, y1: gap, x2: gap, y2: 100 - gap };
}

function shuffleArray(array) {
  const copy = [...array];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

function setLoginStatus(text, mode) {
  els.loginStatus.textContent = text;
  els.loginStatus.classList.remove("ok", "warn");
  if (mode) els.loginStatus.classList.add(mode);
}

function makeLoginEmail(value) {
  const raw = String(value || "").trim();
  if (!raw) return "";
  return raw.includes("@") ? raw : `${raw}${ADMIN_EMAIL_DOMAIN}`;
}
