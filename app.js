import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import {
  getDatabase,
  ref,
  onValue,
  set,
  get,
  remove
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

const ROOMS_PATH = "bingoRooms";
const BATTLE_ROOMS_PATH = "battleRooms";
const ROOM_OPTIONS = [
  { id: "room1", label: "1번 방" },
  { id: "room2", label: "2번 방" },
  { id: "room3", label: "3번 방" },
  { id: "special", label: "수힛방" }
];
const BATTLE_ROOM_OPTIONS = [
  { id: "battle1", label: "대결방 1" },
  { id: "battle2", label: "대결방 2" },
  { id: "battle3", label: "대결방 3" },
  { id: "battle4", label: "대결방 4" }
];
const ROOM_IDS = ROOM_OPTIONS.map((room) => room.id);
const BATTLE_ROOM_IDS = BATTLE_ROOM_OPTIONS.map((room) => room.id);
const ROOM_LABELS = Object.fromEntries(ROOM_OPTIONS.map((room) => [room.id, room.label]));
const BATTLE_ROOM_LABELS = Object.fromEntries(BATTLE_ROOM_OPTIONS.map((room) => [room.id, room.label]));
const MASTER_ROOM_ADMIN_CODE = "0305";
const LOCAL_STORAGE_KEY_PREFIX = "suweet-bingo-room-state-";
const BATTLE_LOCAL_STORAGE_KEY_PREFIX = "suweet-battle-room-state-";
const ROOM_SESSION_PREFIX = "suweet-bingo-room-access-";
const BATTLE_SESSION_PREFIX = "suweet-battle-room-access-";
const OBS_SCALE_STORAGE_KEY = "bkg-bingo-obs-scale";
const LOCAL_ADMIN_PIN = "0305";
const ADMIN_EMAIL_DOMAIN = "@suweet.com";
const BINGO_TYPES = ["mission", "number", "alphabet", "reset"];
const NUMBER_BINGO_SIZES = [5, 7, 10];
const ADMIN_SECTIONS_BY_TYPE = {
  mission: ["roomAuth", "createBingo", "cellEdit", "bounty", "chicken", "missionBulk", "globalManage"],
  number: ["roomAuth", "createBingo", "cellEdit", "bounty", "chicken", "globalManage"],
  alphabet: ["roomAuth", "createBingo", "cellEdit", "bounty", "chicken", "globalManage"],
  reset: ["roomAuth", "createBingo", "cellEdit", "bounty", "chicken", "resetMenu", "globalManage"]
};

const stateDefaults = {
  roomId: "",
  roomName: "",
  accessCode: "",
  createdAt: 0,
  updatedAt: 0,
  title: "오늘의 빙고",
  size: 5,
  contentType: "mission",
  chickenCount: 0,
  resetRewards: {
    one: 0,
    line: 0,
    all: 0
  },
  bountyNumbers: [],
  bounties: {},
  memoText: "",
  bingoCount: 0,
  completedLines: {},
  effectNonce: 0,
  lastNewLines: [],
  cells: []
};

const $ = (selector) => document.querySelector(selector);
const $$ = (selector) => [...document.querySelectorAll(selector)];

const els = {
  homeScreen: $("#homeScreen"),
  roomCards: $("#roomCards"),
  roomAdminAuthModal: $("#roomAdminAuthModal"),
  roomAdminAuthTitle: $("#roomAdminAuthTitle"),
  roomAdminAuthMessage: $("#roomAdminAuthMessage"),
  roomAdminAuthEmail: $("#roomAdminAuthEmail"),
  roomAdminAuthPassword: $("#roomAdminAuthPassword"),
  roomAdminAuthConfirmBtn: $("#roomAdminAuthConfirmBtn"),
  roomAdminAuthCancelBtn: $("#roomAdminAuthCancelBtn"),
  roomAdminAuthCloseBtn: $("#roomAdminAuthCloseBtn"),
  roomAdminAuthStatus: $("#roomAdminAuthStatus"),
  roomGateModal: $("#roomGateModal"),
  roomGateInput: $("#roomGateInput"),
  roomGateEnterBtn: $("#roomGateEnterBtn"),
  roomGateHomeBtn: $("#roomGateHomeBtn"),
  roomGateMessage: $("#roomGateMessage"),
  roomInfoBox: $("#roomInfoBox"),
  currentRoomName: $("#currentRoomName"),
  currentRoomCode: $("#currentRoomCode"),
  copyRoomCodeBtn: $("#copyRoomCodeBtn"),
  leaveRoomBtn: $("#leaveRoomBtn"),
  pageTitle: $("#pageTitle"),
  boardTitle: $("#boardTitle"),
  topbar: $("#topbar"),
  adminPanel: $("#adminPanel"),
  adminSections: $$("[data-admin-section]"),
  adminToggleRow: $("#adminToggleRow"),
  adminToggle: $("#adminToggle"),
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
  bountyPanel: $("#bountyPanel"),
  bountyNumberInput: $("#bountyNumberInput"),
  bountyAmountInput: $("#bountyAmountInput"),
  bountyAddBtn: $("#bountyAddBtn"),
  bountyClearBtn: $("#bountyClearBtn"),
  bountyList: $("#bountyList"),
  bountyPreview: $("#bountyPreview"),
  chickenPreview: $("#chickenPreview"),
  chickenInput: $("#chickenInput"),
  chickenMinusBtn: $("#chickenMinusBtn"),
  chickenPlusBtn: $("#chickenPlusBtn"),
  resetMenuAdmin: $("#resetMenuAdmin"),
  resetRewardOne: $("#resetRewardOne"),
  resetRewardLine: $("#resetRewardLine"),
  resetRewardAll: $("#resetRewardAll"),
  resetReleaseButtons: $$(".reset-release-btn"),
  resetReleaseAllBtn: $("#resetReleaseAllBtn"),
  standardScoreStrip: $("#standardScoreStrip"),
  resetScoreMenu: $("#resetScoreMenu"),
  resetBingoCount: $("#resetBingoCount"),
  resetChickenCount: $("#resetChickenCount"),
  resetMenuOne: $("#resetMenuOne"),
  resetMenuLine: $("#resetMenuLine"),
  resetMenuAll: $("#resetMenuAll"),
  bulkText: $("#bulkText"),
  applyBulkBtn: $("#applyBulkBtn"),
  clearBulkBtn: $("#clearBulkBtn"),
  hardResetBtn: $("#hardResetBtn"),
  editModePanel: $("#editModePanel"),
  editModeToggleBtn: $("#editModeToggleBtn"),
  editModeStatus: $("#editModeStatus"),
  editModeHelp: $("#editModeHelp"),
  stage: $("#stage"),
  boardWrap: $("#boardWrap"),
  bingoBoard: $("#bingoBoard"),
  lineLayer: $("#lineLayer"),
  bingoOverlay: $("#bingoOverlay"),
  bingoCount: $("#bingoCount"),
  chickenCount: $("#chickenCount"),
  maxBingoCount: $("#maxBingoCount"),
  maxBingoBox: $("#maxBingoBox"),
  cellEditorHelp: $("#cellEditorHelp"),
  obsScalePanel: $("#obsScalePanel"),
  obsScaleButtons: $$(`[data-obs-scale]`),
  memoOpenBtn: $("#memoOpenBtn"),
  memoModal: $("#memoModal"),
  memoCloseBtn: $("#memoCloseBtn"),
  memoCancelBtn: $("#memoCancelBtn"),
  memoText: $("#memoText"),
  memoSaveBtn: $("#memoSaveBtn"),
  memoClearBtn: $("#memoClearBtn"),
  memoSaveStatus: $("#memoSaveStatus"),
  cellEditModal: $("#cellEditModal"),
  cellEditCloseBtn: $("#cellEditCloseBtn"),
  cellEditCancelBtn: $("#cellEditCancelBtn"),
  cellEditSaveBtn: $("#cellEditSaveBtn"),
  cellEditInput: $("#cellEditInput"),
  cellEditCurrent: $("#cellEditCurrent"),
  cellEditHelpText: $("#cellEditHelpText")
};

const urlParams = new URLSearchParams(location.search);
let activeRoomId = normalizeRoomId(urlParams.get("room"));
let activeBattleRoomId = normalizeBattleRoomId(urlParams.get("battleRoom"));
if (activeBattleRoomId) activeRoomId = null;
let currentState = makeInitialState(activeRoomId);
let currentBattleState = null;
let roomSummaries = {};
let battleRoomSummaries = {};
let firebaseApp = null;
let db = null;
let auth = null;
let roomsRef = null;
let roomRef = null;
let battleRoomsRef = null;
let battleRoomRef = null;
let isFirebaseEnabled = Boolean(firebaseConfig.apiKey && firebaseConfig.databaseURL && firebaseConfig.projectId);
let isAdmin = false;
let activeView = urlParams.get("view") || "public";
let lastRenderedEffectNonce = 0;
let titleSaveTimer = null;
let cellSaveTimers = new Map();
let obsScale = getInitialObsScale();
let isEditMode = false;
let editingCellIndex = null;
let roomAdminAuthResolver = null;
let roomAdminAuthBusy = false;
let isBattleAdmin = false;
let battleActiveTeamIndex = Math.max(0, Math.min(2, Number(urlParams.get("team") || 0)));

if (activeBattleRoomId) {
  if (!["public", "battleObs"].includes(activeView)) activeView = "public";
} else {
  if (!["public", "obs"].includes(activeView)) activeView = "public";
  if (!activeRoomId) activeView = "public";
}

// 앱 시작은 모든 함수/상수 선언이 끝난 뒤 startApp()에서 실행합니다.
// 대결방 상수 초기화 전에 initBattle()가 실행되어 홈 화면까지 멈추는 문제를 방지합니다.

async function init() {
  setupView();
  bindEvents();

  // 홈 화면은 Firebase 수신보다 먼저 기본 방 카드부터 렌더링합니다.
  // DB Rules나 네트워크 문제로 battleRooms를 읽지 못해도 방 목록이 빈 화면으로 멈추지 않게 하기 위한 안전장치입니다.
  if (!activeRoomId) renderRoomCards();

  try {
    setupFirebaseIfAvailable();
  } catch (error) {
    console.error("Firebase 초기화 실패", error);
    isFirebaseEnabled = false;
    setLoginStatus(activeRoomId ? "DB 연결 오류" : "로컬 모드", "warn");
    if (!activeRoomId) renderRoomCards();
  }

  await loadInitialState();
  render();
}

function setupView() {
  const isHome = !activeRoomId && !activeBattleRoomId;
  document.body.classList.toggle("view-home", isHome);
  document.body.classList.add(`view-${activeView}`);

  if (els.homeScreen) els.homeScreen.hidden = !isHome;
  const layout = document.querySelector(".layout");
  if (layout) {
    layout.hidden = isHome;
    layout.setAttribute("aria-hidden", isHome ? "true" : "false");
  }

  $$('[data-view-link]').forEach((link) => {
    const viewName = link.dataset.viewLink;
    link.classList.toggle("active", !isHome && viewName === activeView);

    // 홈/방 선택 버튼은 항상 방 목록으로 이동하게 합니다.
    // 기존에는 방 안에서 "메인 화면"이 현재 방 public 화면으로 이동해 혼동이 있었습니다.
    if (viewName === "home") {
      link.href = "./";
    } else if (!isHome && activeRoomId) {
      link.href = `?room=${encodeURIComponent(activeRoomId)}&view=${encodeURIComponent(viewName)}`;
    } else {
      link.href = "./";
    }
  });

  if (els.memoOpenBtn) els.memoOpenBtn.hidden = isHome || activeView === "obs";

  if (isHome) {
    if (els.adminPanel) els.adminPanel.hidden = true;
    if (els.adminToggleRow) els.adminToggleRow.hidden = true;
    if (els.cellEditorHelp) els.cellEditorHelp.hidden = true;
    if (els.obsScalePanel) els.obsScalePanel.hidden = true;
    if (els.pageTitle) els.pageTitle.textContent = "방 선택";
    return;
  }

  if (activeView !== "obs") {
    els.adminPanel.hidden = false;
    els.adminToggleRow.hidden = false;
    els.cellEditorHelp.hidden = false;
  } else if (els.obsScalePanel) {
    els.obsScalePanel.hidden = false;
  }

  applyObsScale(obsScale);
}

function setupFirebaseIfAvailable() {
  if (!isFirebaseEnabled) {
    if (els.localLoginBox) els.localLoginBox.hidden = true;
    if (els.firebaseLoginBox) els.firebaseLoginBox.hidden = true;
    if (els.roomInfoBox) els.roomInfoBox.hidden = !activeRoomId;
    setLoginStatus(activeRoomId ? "방 코드 필요" : "로컬 모드", "warn");
    return;
  }

  firebaseApp = initializeApp(firebaseConfig);
  db = getDatabase(firebaseApp);
  auth = getAuth(firebaseApp);
  roomsRef = ref(db, ROOMS_PATH);
  battleRoomsRef = ref(db, BATTLE_ROOMS_PATH);
  if (activeRoomId) roomRef = ref(db, `${ROOMS_PATH}/${activeRoomId}`);

  if (els.firebaseLoginBox) els.firebaseLoginBox.hidden = true;
  if (els.localLoginBox) els.localLoginBox.hidden = true;
  if (els.roomInfoBox) els.roomInfoBox.hidden = !activeRoomId;

  onValue(roomsRef, (snapshot) => {
    roomSummaries = snapshot.exists() ? snapshot.val() : {};
    renderRoomCards();
  }, (error) => {
    console.warn("빙고방 목록 수신 실패", error);
    roomSummaries = {};
    renderRoomCards();
  });

  // 대결방 목록은 홈 화면에서만 불러옵니다.
  // 기존 빙고방 화면에서는 battleRooms Rules가 아직 적용되지 않아도
  // 빙고판 렌더링이 멈추지 않도록 분리합니다.
  if (!activeRoomId && battleRoomsRef) {
    onValue(battleRoomsRef, (snapshot) => {
      battleRoomSummaries = snapshot.exists() ? snapshot.val() : {};
      renderRoomCards();
    }, (error) => {
      console.warn("대결방 목록 수신 실패", error);
      battleRoomSummaries = {};
      renderRoomCards();
    });
  }

  if (!activeRoomId || !roomRef) return;

  onValue(roomRef, (snapshot) => {
    if (!snapshot.exists()) {
      alert("아직 생성되지 않은 방입니다. 방 선택 화면으로 이동합니다.");
      location.href = "./";
      return;
    }
    currentState = normalizeState(snapshot.val());
    syncRoomAccessFromQuery();
    updateRoomAccessState();
    render();
  }, (error) => {
    console.error("Firebase 실시간 수신 실패", error);
    setLoginStatus("DB 연결 오류", "warn");
  });
}

async function loadInitialState() {
  if (!activeRoomId) {
    currentState = makeInitialState();
    renderRoomCards();
    return;
  }

  if (isFirebaseEnabled) {
    try {
      const snapshot = await get(roomRef);
      if (snapshot.exists()) {
        currentState = normalizeState(snapshot.val());
        syncRoomAccessFromQuery();
      } else {
        currentState = makeInitialState(activeRoomId);
      }
      updateRoomAccessState();
    } catch (error) {
      console.error("Firebase DB 초기 불러오기 실패", error);
      currentState = makeInitialState(activeRoomId);
      setLoginStatus("DB 연결 오류", "warn");
    }
    return;
  }

  const saved = localStorage.getItem(getLocalStorageKey(activeRoomId));
  currentState = saved ? normalizeState(JSON.parse(saved)) : makeInitialState(activeRoomId);
  syncRoomAccessFromQuery();
  updateRoomAccessState();
}


function normalizeRoomId(value) {
  const roomId = String(value || "").trim();
  return ROOM_IDS.includes(roomId) ? roomId : null;
}

function normalizeBattleRoomId(value) {
  const roomId = String(value || "").trim();
  return BATTLE_ROOM_IDS.includes(roomId) ? roomId : null;
}

function getBattleRoomLabel(roomId) {
  return BATTLE_ROOM_LABELS[roomId] || "대결방";
}

function getRoomLabel(roomId) {
  return ROOM_LABELS[roomId] || "빙고 방";
}

function getLocalStorageKey(roomId = activeRoomId) {
  return `${LOCAL_STORAGE_KEY_PREFIX}${roomId || "main"}`;
}

function getRoomSessionKey(roomId = activeRoomId) {
  return `${ROOM_SESSION_PREFIX}${roomId || "main"}`;
}

function getBattleLocalStorageKey(roomId = activeBattleRoomId) {
  return `${BATTLE_LOCAL_STORAGE_KEY_PREFIX}${roomId || "main"}`;
}

function getBattleRoomSessionKey(roomId = activeBattleRoomId) {
  return `${BATTLE_SESSION_PREFIX}${roomId || "main"}`;
}

function generateRoomCode() {
  return String(Math.floor(10000 + Math.random() * 90000));
}

function getStoredRoomCode(roomId = activeRoomId) {
  return sessionStorage.getItem(getRoomSessionKey(roomId)) || localStorage.getItem(getRoomSessionKey(roomId)) || "";
}

function storeRoomCode(roomId, code) {
  sessionStorage.setItem(getRoomSessionKey(roomId), String(code));
}

function clearRoomCode(roomId = activeRoomId) {
  sessionStorage.removeItem(getRoomSessionKey(roomId));
  localStorage.removeItem(getRoomSessionKey(roomId));
}

function getStoredBattleRoomCode(roomId = activeBattleRoomId) {
  return sessionStorage.getItem(getBattleRoomSessionKey(roomId)) || localStorage.getItem(getBattleRoomSessionKey(roomId)) || "";
}

function storeBattleRoomCode(roomId, code) {
  sessionStorage.setItem(getBattleRoomSessionKey(roomId), String(code));
}

function clearBattleRoomCode(roomId = activeBattleRoomId) {
  sessionStorage.removeItem(getBattleRoomSessionKey(roomId));
  localStorage.removeItem(getBattleRoomSessionKey(roomId));
}

function isRoomUnlocked() {
  if (!activeRoomId) return false;
  const code = String(currentState.accessCode || "");
  return Boolean(code && getStoredRoomCode(activeRoomId) === code);
}

function syncRoomAccessFromQuery() {
  if (!activeRoomId) return;
  const params = new URLSearchParams(location.search);
  const code = params.get("code");
  if (code && String(code) === String(currentState.accessCode || "")) {
    storeRoomCode(activeRoomId, code);
    params.delete("code");
    const nextQuery = params.toString();
    history.replaceState(null, "", `${location.pathname}${nextQuery ? `?${nextQuery}` : ""}`);
  }
}

function updateRoomAccessState() {
  isAdmin = isRoomUnlocked();
  if (!isAdmin) {
    isEditMode = false;
    closeCellEditModal();
  }
  setLoginStatus(isAdmin ? "방 입장 완료" : "입장 코드 필요", isAdmin ? "ok" : "warn");
  renderRoomGate();
}

function renderRoomGate() {
  if (!els.roomGateModal || !activeRoomId || activeView === "obs") {
    if (els.roomGateModal) els.roomGateModal.hidden = true;
    return;
  }
  els.roomGateModal.hidden = isAdmin;
  if (!isAdmin) {
    if (els.roomGateMessage) els.roomGateMessage.textContent = `${getRoomLabel(activeRoomId)} 입장 코드를 입력해 주세요.`;
    setTimeout(() => els.roomGateInput?.focus(), 0);
  }
}

function enterCurrentRoomByCode() {
  if (!activeRoomId) return;
  const code = String(els.roomGateInput?.value || "").trim();
  if (!/^\d{5}$/.test(code)) {
    alert("5자리 숫자 코드를 입력해 주세요.");
    return;
  }
  if (code !== String(currentState.accessCode || "")) {
    alert("입장 코드가 맞지 않습니다.");
    return;
  }
  storeRoomCode(activeRoomId, code);
  updateRoomAccessState();
  render();
}

async function createOrResetRoom(roomId) {
  const room = ROOM_OPTIONS.find((item) => item.id === roomId);
  if (!room) return;

  const alreadyExists = Boolean(roomSummaries?.[roomId]?.accessCode);
  const approved = await requestRoomAdminApproval(room.label, alreadyExists);
  if (!approved) return;
  if (alreadyExists && !confirm(`${room.label}이 이미 있습니다. 새 입장 코드로 초기화할까요? 기존 빙고 데이터가 초기화됩니다.`)) return;

  const code = generateRoomCode();
  const fresh = makeInitialState(roomId);
  fresh.roomId = roomId;
  fresh.roomName = room.label;
  fresh.accessCode = code;
  fresh.createdAt = Date.now();
  fresh.updatedAt = Date.now();

  try {
    if (isFirebaseEnabled && db) {
      await set(ref(db, `${ROOMS_PATH}/${roomId}`), prepareStateForStorage(fresh));
    } else {
      localStorage.setItem(getLocalStorageKey(roomId), JSON.stringify(fresh));
    }
    storeRoomCode(roomId, code);
    alert(`${room.label} 생성 완료!\n입장 코드: ${code}\n이 코드를 접속할 인원에게 알려주세요.`);
    location.href = `?room=${encodeURIComponent(roomId)}&view=public`;
  } catch (error) {
    console.error("방 생성 실패", error);
    alert("방 생성에 실패했습니다. Firebase Rules 또는 DB 연결을 확인해 주세요.");
  }
}

async function requestRoomAdminApproval(roomLabel, alreadyExists, actionLabel = "") {
  const resolvedActionLabel = actionLabel || (alreadyExists ? "초기화/코드 재발급" : "생성");

  if (isFirebaseEnabled && auth && els.roomAdminAuthModal) {
    return openRoomAdminAuthModal(roomLabel, resolvedActionLabel);
  }

  const adminCode = prompt(`${roomLabel}을 ${resolvedActionLabel}하려면 관리자 코드를 입력해 주세요.`);
  if (adminCode == null) return false;
  if (adminCode !== MASTER_ROOM_ADMIN_CODE) {
    alert("관리자 코드가 맞지 않습니다.");
    return false;
  }
  return true;
}

function openRoomAdminAuthModal(roomLabel, actionLabel = "생성") {
  return new Promise((resolve) => {
    roomAdminAuthResolver = resolve;
    roomAdminAuthBusy = false;
    if (els.roomAdminAuthTitle) els.roomAdminAuthTitle.textContent = `관리자 인증 · 방 ${actionLabel}`;
    if (els.roomAdminAuthMessage) els.roomAdminAuthMessage.textContent = `${roomLabel}을 ${actionLabel}하려면 관리자 계정으로 인증해 주세요.`;
    if (els.roomAdminAuthStatus) els.roomAdminAuthStatus.textContent = "";
    if (els.roomAdminAuthEmail) els.roomAdminAuthEmail.value = "";
    if (els.roomAdminAuthPassword) els.roomAdminAuthPassword.value = "";
    if (els.roomAdminAuthConfirmBtn) els.roomAdminAuthConfirmBtn.disabled = false;
    els.roomAdminAuthModal.hidden = false;
    document.body.classList.add("memo-open");
    setTimeout(() => els.roomAdminAuthEmail?.focus(), 0);
  });
}

function closeRoomAdminAuthModal(result = false) {
  if (!els.roomAdminAuthModal || els.roomAdminAuthModal.hidden) return;
  els.roomAdminAuthModal.hidden = true;
  document.body.classList.remove("memo-open");
  roomAdminAuthBusy = false;
  if (els.roomAdminAuthConfirmBtn) els.roomAdminAuthConfirmBtn.disabled = false;
  const resolver = roomAdminAuthResolver;
  roomAdminAuthResolver = null;
  if (resolver) resolver(Boolean(result));
}

async function confirmRoomAdminAuth() {
  if (roomAdminAuthBusy) return;
  const email = makeLoginEmail(els.roomAdminAuthEmail?.value);
  const password = els.roomAdminAuthPassword?.value || "";

  if (!email) {
    if (els.roomAdminAuthStatus) els.roomAdminAuthStatus.textContent = "관리자 아이디를 입력해 주세요.";
    els.roomAdminAuthEmail?.focus();
    return;
  }
  if (!password) {
    if (els.roomAdminAuthStatus) els.roomAdminAuthStatus.textContent = "비밀번호를 입력해 주세요.";
    els.roomAdminAuthPassword?.focus();
    return;
  }

  roomAdminAuthBusy = true;
  if (els.roomAdminAuthConfirmBtn) els.roomAdminAuthConfirmBtn.disabled = true;
  if (els.roomAdminAuthStatus) els.roomAdminAuthStatus.textContent = "관리자 계정 확인 중...";

  try {
    await verifyRoomAdminCredentials(email, password);
    if (els.roomAdminAuthStatus) els.roomAdminAuthStatus.textContent = "인증 완료";
    closeRoomAdminAuthModal(true);
  } catch (error) {
    console.error("관리자 인증 실패", error);
    roomAdminAuthBusy = false;
    if (els.roomAdminAuthConfirmBtn) els.roomAdminAuthConfirmBtn.disabled = false;
    if (els.roomAdminAuthStatus) els.roomAdminAuthStatus.textContent = "아이디 또는 비밀번호를 확인해 주세요.";
  }
}

async function verifyRoomAdminCredentials(email, password) {
  /*
    현재 버전은 Firebase Auth 이메일/비밀번호 계정으로 관리자 인증을 확인합니다.
    Firebase Functions 검증 URL/함수명이 따로 있다면 이 함수 안만 교체하면 됩니다.
    프론트 입력은 suweet처럼 아이디만 받아도 makeLoginEmail()에서 suweet@suweet.com으로 변환됩니다.
  */
  await setPersistence(auth, browserSessionPersistence);
  await signInWithEmailAndPassword(auth, email, password);
  return true;
}

function promptEnterRoom(roomId, view = "public") {
  const room = roomSummaries?.[roomId];
  const label = getRoomLabel(roomId);
  if (!room?.accessCode) {
    alert("아직 생성되지 않은 방입니다. 먼저 방 생성을 해주세요.");
    return;
  }
  const cached = getStoredRoomCode(roomId);
  if (cached && cached === String(room.accessCode)) {
    location.href = `?room=${encodeURIComponent(roomId)}&view=${encodeURIComponent(view)}`;
    return;
  }
  const code = prompt(`${label} 입장 코드 5자리를 입력해 주세요.`);
  if (code == null) return;
  if (String(code).trim() !== String(room.accessCode)) {
    alert("입장 코드가 맞지 않습니다.");
    return;
  }
  storeRoomCode(roomId, String(code).trim());
  location.href = `?room=${encodeURIComponent(roomId)}&view=${encodeURIComponent(view)}`;
}

async function closeCreatedRoom(roomId, type) {
  const isBattle = type === "battle";
  const options = isBattle ? BATTLE_ROOM_OPTIONS : ROOM_OPTIONS;
  const summaries = isBattle ? battleRoomSummaries : roomSummaries;
  const room = options.find((item) => item.id === roomId);
  const label = isBattle ? getBattleRoomLabel(roomId) : getRoomLabel(roomId);

  if (!room || !summaries?.[roomId]?.accessCode) {
    alert("이미 종료되었거나 생성되지 않은 방입니다.");
    return;
  }

  const approved = await requestRoomAdminApproval(label, true, "종료");
  if (!approved) return;
  if (!confirm(`${label}을 종료할까요?
방 데이터와 입장 코드가 삭제되고, 방 목록에서 EMPTY 상태로 돌아갑니다.`)) return;

  try {
    if (isFirebaseEnabled && db) {
      await remove(ref(db, `${isBattle ? BATTLE_ROOMS_PATH : ROOMS_PATH}/${roomId}`));
    } else if (isBattle) {
      localStorage.removeItem(getBattleLocalStorageKey(roomId));
    } else {
      localStorage.removeItem(getLocalStorageKey(roomId));
    }

    if (isBattle) {
      clearBattleRoomCode(roomId);
      battleRoomSummaries = { ...(battleRoomSummaries || {}) };
      delete battleRoomSummaries[roomId];
    } else {
      clearRoomCode(roomId);
      roomSummaries = { ...(roomSummaries || {}) };
      delete roomSummaries[roomId];
    }

    renderRoomCards();
    alert(`${label}이 종료되었습니다.`);
  } catch (error) {
    console.error("방 종료 실패", error);
    alert("방 종료에 실패했습니다. Firebase Rules 또는 DB 연결을 확인해 주세요.");
  }
}

function renderRoomCards() {
  if (!els.roomCards) return;
  els.roomCards.innerHTML = "";

  const addGroupTitle = (eyebrow, title, help) => {
    const group = document.createElement("div");
    group.className = "room-group-title";
    group.innerHTML = `<p class="eyebrow">${escapeHtml(eyebrow)}</p><h3>${escapeHtml(title)}</h3><p>${escapeHtml(help)}</p>`;
    els.roomCards.append(group);
  };

  const addCard = ({ room, data, type }) => {
    const exists = Boolean(data.accessCode);
    const card = document.createElement("article");
    card.className = `room-card ${exists ? "is-created" : "is-empty"} ${type === "battle" ? "battle-room-card" : ""}`;

    const info = document.createElement("div");
    info.className = "room-card-info";
    const typeLabel = type === "battle"
      ? (exists ? `숫자 ${Number(data.battle?.size || 5)}×${Number(data.battle?.size || 5)} · ${Number(data.battle?.playerCount || 2)}팀` : "비어 있음")
      : (exists ? getContentTypeLabel(data.contentType) : "비어 있음");
    const subtitle = type === "battle"
      ? (exists ? `${escapeHtml(data.battle?.title || "숫자빙고 대결")} · ${typeLabel}` : "관리자 계정으로 대결방을 생성하세요.")
      : (exists ? `${escapeHtml(data.title || "오늘의 빙고")} · ${typeLabel}` : "관리자 계정으로 방을 생성하세요.");
    info.innerHTML = `
      <p class="eyebrow">${exists ? "READY" : "EMPTY"}</p>
      <h3>${escapeHtml(room.label)}</h3>
      <p>${subtitle}</p>
    `;

    const actions = document.createElement("div");
    actions.className = "room-card-actions";

    const createBtn = document.createElement("button");
    createBtn.type = "button";
    createBtn.className = exists ? "ghost-btn" : "primary-btn";
    createBtn.textContent = exists ? "초기화/코드 재발급" : "방 생성";
    createBtn.addEventListener("click", () => type === "battle" ? createOrResetBattleRoom(room.id) : createOrResetRoom(room.id));

    const enterBtn = document.createElement("button");
    enterBtn.type = "button";
    enterBtn.className = "primary-btn";
    enterBtn.textContent = "입장";
    enterBtn.disabled = !exists;
    enterBtn.addEventListener("click", () => type === "battle" ? promptEnterBattleRoom(room.id, "public") : promptEnterRoom(room.id, "public"));

    const obsBtn = document.createElement("button");
    obsBtn.type = "button";
    obsBtn.className = "ghost-btn";
    obsBtn.textContent = "송출용";
    obsBtn.disabled = !exists;
    obsBtn.addEventListener("click", () => type === "battle" ? promptEnterBattleRoom(room.id, "battleObs") : promptEnterRoom(room.id, "obs"));

    actions.append(createBtn, enterBtn, obsBtn);

    if (exists) {
      const closeBtn = document.createElement("button");
      closeBtn.type = "button";
      closeBtn.className = "ghost-btn danger-soft";
      closeBtn.textContent = "방 종료";
      closeBtn.addEventListener("click", () => closeCreatedRoom(room.id, type));
      actions.append(closeBtn);
    }

    card.append(info, actions);
    els.roomCards.append(card);
  };

  addGroupTitle("BINGO ROOM", "빙고 방", "기존 빙고 기능을 사용하는 방입니다.");
  ROOM_OPTIONS.forEach((room) => addCard({ room, data: roomSummaries?.[room.id] || {}, type: "bingo" }));

  addGroupTitle("BATTLE ROOM", "대결 방", "숫자빙고를 2팀 또는 3팀으로 진행하는 송출용 대결방입니다.");
  BATTLE_ROOM_OPTIONS.forEach((room) => addCard({ room, data: battleRoomSummaries?.[room.id] || {}, type: "battle" }));
}

function getContentTypeLabel(type) {
  return ({ mission: "미션", number: "숫자", alphabet: "알파벳", reset: "리셋" })[type] || "미션";
}

function bindEvents() {
  els.roomGateEnterBtn?.addEventListener("click", enterCurrentRoomByCode);
  els.roomGateInput?.addEventListener("keydown", (event) => {
    if (event.key === "Enter") {
      event.preventDefault();
      enterCurrentRoomByCode();
    }
  });
  els.roomGateHomeBtn?.addEventListener("click", () => {
    location.href = "./";
  });

  els.roomAdminAuthCancelBtn?.addEventListener("click", () => closeRoomAdminAuthModal(false));
  els.roomAdminAuthCloseBtn?.addEventListener("click", () => closeRoomAdminAuthModal(false));
  els.roomAdminAuthModal?.addEventListener("click", (event) => {
    if (event.target?.hasAttribute?.("data-admin-auth-close")) closeRoomAdminAuthModal(false);
  });
  els.roomAdminAuthConfirmBtn?.addEventListener("click", confirmRoomAdminAuth);
  els.roomAdminAuthPassword?.addEventListener("keydown", (event) => {
    if (event.key === "Enter") {
      event.preventDefault();
      confirmRoomAdminAuth();
    }
  });
  els.copyRoomCodeBtn?.addEventListener("click", async () => {
    const code = currentState.accessCode || "";
    if (!code) return;
    try {
      await navigator.clipboard.writeText(code);
      alert("입장 코드를 복사했어요.");
    } catch {
      prompt("입장 코드를 복사하세요.", code);
    }
  });
  els.leaveRoomBtn?.addEventListener("click", () => {
    clearRoomCode(activeRoomId);
    location.href = "./";
  });

  els.adminToggle?.addEventListener("click", () => {
    const collapsed = document.body.classList.toggle("admin-collapsed");
    els.adminToggle.textContent = collapsed ? "관리자 패널 열기" : "관리자 패널 접기";
  });

  els.memoOpenBtn?.addEventListener("click", openMemoModal);
  els.memoCloseBtn?.addEventListener("click", closeMemoModal);
  els.memoCancelBtn?.addEventListener("click", closeMemoModal);
  els.memoModal?.addEventListener("click", (event) => {
    if (event.target?.hasAttribute?.("data-memo-close")) closeMemoModal();
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      if (els.cellEditModal && !els.cellEditModal.hidden) closeCellEditModal();
      if (els.memoModal && !els.memoModal.hidden) closeMemoModal();
      if (els.roomAdminAuthModal && !els.roomAdminAuthModal.hidden) closeRoomAdminAuthModal(false);
    }

    if (event.key === "Enter" && els.cellEditModal && !els.cellEditModal.hidden && document.activeElement === els.cellEditInput) {
      event.preventDefault();
      saveCellEdit();
    }
  });

  els.editModeToggleBtn?.addEventListener("click", () => {
    if (!isAdmin) {
      alert("관리자 로그인 후 수정 모드를 사용할 수 있어요.");
      return;
    }
    isEditMode = !isEditMode;
    if (!isEditMode) closeCellEditModal();
    renderEditModeState();
    renderBoard();
  });

  els.cellEditCloseBtn?.addEventListener("click", closeCellEditModal);
  els.cellEditCancelBtn?.addEventListener("click", closeCellEditModal);
  els.cellEditModal?.addEventListener("click", (event) => {
    if (event.target?.hasAttribute?.("data-cell-edit-close")) closeCellEditModal();
  });
  els.cellEditSaveBtn?.addEventListener("click", saveCellEdit);

  els.memoText?.addEventListener("input", () => {
    if (!isAdmin) return;
    if (els.memoSaveStatus) els.memoSaveStatus.textContent = "저장하지 않은 변경사항이 있어요.";
  });

  els.memoSaveBtn?.addEventListener("click", () => {
    if (!isAdmin) {
      alert("관리자로 로그인해야 메모를 저장할 수 있어요.");
      return;
    }
    commitState((draft) => {
      draft.memoText = els.memoText?.value || "";
    });
    if (els.memoSaveStatus) els.memoSaveStatus.textContent = "메모가 저장됐어요.";
  });

  els.memoClearBtn?.addEventListener("click", () => {
    if (!isAdmin) {
      alert("관리자로 로그인해야 메모를 비울 수 있어요.");
      return;
    }
    if (!confirm("메모 내용을 비울까요?")) return;
    commitState((draft) => {
      draft.memoText = "";
    });
    if (els.memoText) els.memoText.value = "";
    if (els.memoSaveStatus) els.memoSaveStatus.textContent = "메모가 비워졌어요.";
  });

  els.obsScaleButtons?.forEach((button) => {
    button.addEventListener("click", () => {
      const scale = Number(button.dataset.obsScale || 1);
      applyObsScale(scale);
      localStorage.setItem(OBS_SCALE_STORAGE_KEY, String(scale));
    });
  });

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
    isEditMode = false;
    closeCellEditModal();
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

  els.typeSelect.addEventListener("change", () => {
    syncSizeSelectForType(els.typeSelect.value);
    updateAdminPanelSections();
    updateBountyPanelState();
    updateResetMenuAdminState();
  });

  els.sizeSelect.addEventListener("change", () => {
    const validSize = getValidSizeForType(els.typeSelect.value, Number(els.sizeSelect.value));
    els.sizeSelect.value = String(validSize);
  });

  els.createBoardBtn.addEventListener("click", () => {
    const contentType = els.typeSelect.value;
    const size = getValidSizeForType(contentType, Number(els.sizeSelect.value));
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

  els.bountyAddBtn?.addEventListener("click", addOrUpdateBounty);

  els.bountyClearBtn?.addEventListener("click", () => {
    if (!confirm("현상금을 모두 비울까요?")) return;
    commitState((draft) => {
      draft.bounties = {};
      draft.bountyNumbers = [];
    });
  });

  [els.bountyNumberInput, els.bountyAmountInput].forEach((input) => {
    input?.addEventListener("keydown", (event) => {
      if (event.key === "Enter") {
        event.preventDefault();
        addOrUpdateBounty();
      }
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

  [
    [els.resetRewardOne, "one"],
    [els.resetRewardLine, "line"],
    [els.resetRewardAll, "all"]
  ].forEach(([input, key]) => {
    input?.addEventListener("change", () => {
      const value = Math.max(0, Number(input.value || 0));
      commitState((draft) => {
        draft.resetRewards = normalizeResetRewards(draft.resetRewards);
        draft.resetRewards[key] = value;
      });
    });
  });


  els.resetReleaseButtons?.forEach((button) => {
    button.addEventListener("click", () => {
      const lineType = button.dataset.lineType;
      const lineIndex = Number(button.dataset.lineIndex);
      releaseResetLine(lineType, lineIndex);
    });
  });

  els.resetReleaseAllBtn?.addEventListener("click", releaseAllResetChecks);

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
      const fresh = makeInitialState(activeRoomId);
      fresh.accessCode = draft.accessCode;
      fresh.roomId = draft.roomId || activeRoomId || "";
      fresh.roomName = draft.roomName || getRoomLabel(activeRoomId);
      fresh.createdAt = draft.createdAt || Date.now();
      Object.assign(draft, fresh);
    });
  });
}

function getAllowedSizesForType(contentType) {
  return contentType === "number" ? NUMBER_BINGO_SIZES : [5];
}

function getValidSizeForType(contentType, size) {
  const allowed = getAllowedSizesForType(contentType);
  const numericSize = Number(size);
  return allowed.includes(numericSize) ? numericSize : allowed[0];
}

function syncSizeSelectForType(contentType, requestedSize = Number(els.sizeSelect?.value || currentState.size)) {
  if (!els.sizeSelect) return;
  const allowed = getAllowedSizesForType(contentType);
  const nextSize = getValidSizeForType(contentType, requestedSize);

  els.sizeSelect.innerHTML = allowed
    .map((size) => `<option value="${size}">${size} × ${size}</option>`)
    .join("");
  els.sizeSelect.value = String(nextSize);
}

function makeLoginEmail(value) {
  const raw = String(value || "").trim();
  if (!raw) return "";
  return raw.includes("@") ? raw : `${raw}${ADMIN_EMAIL_DOMAIN}`;
}


function openMemoModal() {
  if (!els.memoModal) return;
  els.memoModal.hidden = false;
  document.body.classList.add("memo-open");
  renderMemoState(true);
  setTimeout(() => els.memoText?.focus(), 0);
}

function closeMemoModal() {
  if (!els.memoModal) return;
  els.memoModal.hidden = true;
  document.body.classList.remove("memo-open");
}

function renderMemoState(forceSync = false) {
  if (!els.memoText) return;
  const memo = String(currentState.memoText || "");
  const isEditingMemo = document.activeElement === els.memoText && !forceSync;
  if (!isEditingMemo) els.memoText.value = memo;
  els.memoText.readOnly = !isAdmin;
  if (els.memoSaveBtn) els.memoSaveBtn.disabled = !isAdmin;
  if (els.memoClearBtn) els.memoClearBtn.disabled = !isAdmin || !memo.trim();
  if (els.memoSaveStatus) {
    els.memoSaveStatus.textContent = isAdmin
      ? (memo.trim() ? "메모가 Firebase에 저장되어 있어요." : "저장된 메모가 없습니다.")
      : "보기 전용입니다. 저장하려면 관리자 로그인이 필요해요.";
  }
}

function renderEditModeState() {
  if (!isAdmin || activeView === "obs") {
    isEditMode = false;
    closeCellEditModal();
  }

  document.body.classList.toggle("cell-edit-mode", isEditMode);

  if (els.editModeStatus) {
    els.editModeStatus.textContent = isEditMode ? "ON" : "OFF";
    els.editModeStatus.classList.toggle("ok", isEditMode);
    els.editModeStatus.classList.toggle("warn", !isEditMode);
  }

  if (els.editModeToggleBtn) {
    els.editModeToggleBtn.textContent = isEditMode ? "수정 모드 끄기" : "수정 모드 켜기";
    els.editModeToggleBtn.classList.toggle("is-on", isEditMode);
    els.editModeToggleBtn.disabled = !isAdmin || activeView === "obs";
  }

  if (els.editModeHelp) {
    els.editModeHelp.textContent = isEditMode
      ? "수정 모드 ON: 왼쪽 빙고칸을 클릭하면 내용 수정창이 열립니다."
      : "수정 모드를 켜면 왼쪽 빙고칸을 클릭해서 내용을 직접 바꿀 수 있어요.";
  }

  if (els.cellEditorHelp) {
    els.cellEditorHelp.textContent = isEditMode
      ? "현재 칸 수정 모드입니다. 칸을 클릭하면 내용을 바꿀 수 있어요."
      : "관리자로 로그인하면 왼쪽 빙고칸을 클릭해서 바로 지움/복구할 수 있어요.";
  }
}

function openCellEditModal(index) {
  if (!isAdmin) {
    alert("관리자 로그인 후 수정할 수 있습니다.");
    return;
  }

  const cell = currentState.cells[index];
  if (!cell || !els.cellEditModal) return;

  editingCellIndex = index;
  if (els.cellEditCurrent) els.cellEditCurrent.textContent = cell.text || "-";
  if (els.cellEditInput) {
    els.cellEditInput.value = cell.text || "";
    els.cellEditInput.maxLength = currentState.contentType === "mission" ? 60 : 3;
    els.cellEditInput.inputMode = currentState.contentType === "number" ? "numeric" : "text";
  }
  if (els.cellEditHelpText) els.cellEditHelpText.textContent = getCellEditHelpText();

  els.cellEditModal.hidden = false;
  document.body.classList.add("memo-open");
  setTimeout(() => {
    els.cellEditInput?.focus();
    els.cellEditInput?.select();
  }, 0);
}

function closeCellEditModal() {
  if (!els.cellEditModal) return;
  els.cellEditModal.hidden = true;
  editingCellIndex = null;
  if (!els.memoModal || els.memoModal.hidden) document.body.classList.remove("memo-open");
}

function saveCellEdit() {
  if (editingCellIndex == null) return;
  if (!isAdmin) {
    alert("관리자 로그인 후 수정할 수 있습니다.");
    return;
  }

  const result = normalizeEditedCellText(els.cellEditInput?.value || "", currentState.contentType);
  if (!result.ok) {
    alert(result.message);
    return;
  }

  const duplicate = currentState.cells.some((cell, index) => {
    if (index === editingCellIndex) return false;
    return String(cell.text).trim().toUpperCase() === result.value.toUpperCase();
  });

  if (duplicate && ["number", "alphabet", "reset"].includes(currentState.contentType)) {
    const proceed = confirm("이미 같은 값이 빙고판에 있습니다. 그래도 수정할까요?");
    if (!proceed) return;
  }

  const indexToSave = editingCellIndex;
  commitState((draft) => {
    if (!draft.cells[indexToSave]) return;
    draft.cells[indexToSave].text = result.value;
  });
  closeCellEditModal();
}

function getCellEditHelpText() {
  if (currentState.contentType === "number") return "숫자 빙고는 1~100 숫자만 입력할 수 있어요.";
  if (currentState.contentType === "alphabet" || currentState.contentType === "reset") return "알파벳/리셋 빙고는 A~Z 한 글자만 입력할 수 있어요.";
  return "미션 빙고는 자유롭게 내용을 입력할 수 있어요. 긴 문구는 자동으로 줄바꿈됩니다.";
}

function normalizeEditedCellText(value, contentType) {
  const raw = String(value || "").trim();

  if (contentType === "number") {
    const number = Number(raw);
    if (!/^\d+$/.test(raw) || !Number.isInteger(number) || number < 1 || number > 100) {
      return { ok: false, message: "숫자 빙고는 1~100 사이의 숫자만 입력할 수 있어요." };
    }
    return { ok: true, value: String(number) };
  }

  if (contentType === "alphabet" || contentType === "reset") {
    const letter = raw.toUpperCase();
    if (!/^[A-Z]$/.test(letter)) {
      return { ok: false, message: "알파벳/리셋 빙고는 A~Z 한 글자만 입력할 수 있어요." };
    }
    return { ok: true, value: letter };
  }

  if (!raw) return { ok: false, message: "빈 내용으로는 수정할 수 없어요." };
  return { ok: true, value: raw };
}

function updateChicken(delta) {
  commitState((draft) => {
    draft.chickenCount = Math.max(0, Number(draft.chickenCount || 0) + delta);
  });
}

function normalizeResetRewards(value) {
  return {
    one: Math.max(0, Number(value?.one || 0)),
    line: Math.max(0, Number(value?.line || 0)),
    all: Math.max(0, Number(value?.all || 0))
  };
}

function getAdminPanelType() {
  return BINGO_TYPES.includes(els.typeSelect?.value) ? els.typeSelect.value : currentState.contentType || "mission";
}

function updateAdminPanelSections() {
  const type = getAdminPanelType();
  const allowedSections = new Set(ADMIN_SECTIONS_BY_TYPE[type] || ADMIN_SECTIONS_BY_TYPE.mission);

  els.adminSections?.forEach((section) => {
    const key = section.dataset.adminSection;
    section.hidden = !allowedSections.has(key);
  });
}

function updateResetMenuAdminState() {
  const selectedType = getAdminPanelType();
  const isReset = selectedType === "reset";

  if (els.resetMenuAdmin) {
    els.resetMenuAdmin.classList.toggle("is-muted", !isReset);
  }

  const resetControlsDisabled = !isAdmin || activeView === "obs" || !isReset;
  [els.resetRewardOne, els.resetRewardLine, els.resetRewardAll, els.resetReleaseAllBtn].forEach((input) => {
    if (!input) return;
    input.disabled = resetControlsDisabled;
  });
  els.resetReleaseButtons?.forEach((button) => {
    button.disabled = resetControlsDisabled;
  });
}

function updateBountyPanelState() {
  const bounties = normalizeBounties(currentState.bounties, currentState.bountyNumbers);
  const entries = sortBountyEntries(Object.entries(bounties));

  if (els.bountyPanel) {
    els.bountyPanel.classList.remove("is-muted");
  }

  [els.bountyNumberInput, els.bountyAmountInput].forEach((input) => {
    if (input) input.disabled = !isAdmin || activeView === "obs";
  });

  if (els.bountyAddBtn) els.bountyAddBtn.disabled = !isAdmin || activeView === "obs";
  if (els.bountyClearBtn) els.bountyClearBtn.disabled = !isAdmin || activeView === "obs" || entries.length === 0;
  if (els.bountyPreview) els.bountyPreview.textContent = String(entries.length);

  if (els.bountyList) {
    els.bountyList.innerHTML = "";

    if (entries.length === 0) {
      const empty = document.createElement("p");
      empty.className = "bounty-empty";
      empty.textContent = "등록된 현상금이 없습니다.";
      els.bountyList.append(empty);
    } else {
      entries.forEach(([target, amount]) => {
        const item = document.createElement("div");
        item.className = "bounty-item";

        const label = document.createElement("span");
        label.innerHTML = `<strong>${escapeHtml(target)}</strong> <b>${formatBountyAmount(amount)}</b>개`;

        const removeBtn = document.createElement("button");
        removeBtn.type = "button";
        removeBtn.className = "bounty-remove";
        removeBtn.textContent = "삭제";
        removeBtn.disabled = !isAdmin || activeView === "obs";
        removeBtn.addEventListener("click", () => removeBounty(target));

        item.append(label, removeBtn);
        els.bountyList.append(item);
      });
    }
  }
}

function addOrUpdateBounty() {
  const target = normalizeBountyTarget(els.bountyNumberInput?.value || "");
  const amount = Number(els.bountyAmountInput?.value || 0);

  if (!target) {
    alert("현상금을 걸 대상 칸 내용을 입력해 주세요.");
    els.bountyNumberInput?.focus();
    return;
  }

  if (!Number.isInteger(amount) || amount < 0) {
    alert("현상금 개수는 0 이상의 정수로 입력해 주세요.");
    els.bountyAmountInput?.focus();
    return;
  }

  const existsInBoard = currentState.cells.some((cell) => normalizeBountyTarget(cell.text) === target);
  if (!existsInBoard) {
    const proceed = confirm("현재 빙고판에 같은 내용의 칸이 없습니다. 그래도 현상금으로 등록할까요?");
    if (!proceed) return;
  }

  commitState((draft) => {
    const next = normalizeBounties(draft.bounties, draft.bountyNumbers);
    if (amount === 0) {
      delete next[target];
    } else {
      next[target] = amount;
    }
    draft.bounties = next;
    draft.bountyNumbers = Object.keys(next);
  });

  if (els.bountyNumberInput) els.bountyNumberInput.value = "";
  if (els.bountyAmountInput) els.bountyAmountInput.value = "";
  els.bountyNumberInput?.focus();
}

function removeBounty(target) {
  commitState((draft) => {
    const normalizedTarget = normalizeBountyTarget(target);
    const next = normalizeBounties(draft.bounties, draft.bountyNumbers);
    delete next[normalizedTarget];
    draft.bounties = next;
    draft.bountyNumbers = Object.keys(next);
  });
}

function normalizeBounties(value, legacyNumbers = []) {
  const result = {};

  if (Array.isArray(value)) {
    value.forEach((entry) => {
      const target = normalizeBountyTarget(entry?.target ?? entry?.number ?? entry?.text ?? "");
      const amount = Number(entry?.amount ?? entry?.count ?? 0);
      if (target && Number.isInteger(amount) && amount > 0) result[target] = amount;
    });
  } else if (value && typeof value === "object") {
    Object.entries(value).forEach(([rawKey, rawValue]) => {
      let target = "";
      let amount = 0;

      if (rawValue && typeof rawValue === "object" && !Array.isArray(rawValue)) {
        target = normalizeBountyTarget(rawValue.target ?? rawValue.number ?? rawValue.text ?? decodeBountyStorageKey(rawKey));
        amount = Number(rawValue.amount ?? rawValue.count ?? 0);
      } else {
        target = normalizeBountyTarget(decodeBountyStorageKey(rawKey));
        amount = Number(rawValue);
      }

      if (target && Number.isInteger(amount) && amount > 0) result[target] = amount;
    });
  }

  normalizeBountyNumbers(legacyNumbers).forEach((target) => {
    if (!result[target]) result[target] = 1;
  });

  return Object.fromEntries(sortBountyEntries(Object.entries(result)));
}

function normalizeBountyNumbers(value) {
  if (value && typeof value === "object" && !Array.isArray(value)) {
    return Object.keys(normalizeBounties(value));
  }

  const source = Array.isArray(value) ? value.join("\n") : String(value || "");
  return Array.from(new Set(source
    .split(/[\n,]+/g)
    .map((target) => normalizeBountyTarget(target))
    .filter(Boolean)));
}


function normalizeBountyTarget(value) {
  const raw = String(value ?? "").trim().replace(/\s+/g, " ");
  if (!raw) return "";

  if (/^\d+$/.test(raw)) {
    return String(Number(raw));
  }

  if (/^[a-z]$/i.test(raw)) {
    return raw.toUpperCase();
  }

  return raw;
}

function sortBountyEntries(entries) {
  return [...entries].sort(([a], [b]) => {
    const aNumber = /^\d+$/.test(a) ? Number(a) : null;
    const bNumber = /^\d+$/.test(b) ? Number(b) : null;

    if (aNumber != null && bNumber != null) return aNumber - bNumber;
    if (aNumber != null) return -1;
    if (bNumber != null) return 1;
    return String(a).localeCompare(String(b), "ko-KR", { numeric: true });
  });
}

function encodeBountyStorageKey(target) {
  const normalized = normalizeBountyTarget(target);
  return encodeURIComponent(normalized)
    .replace(/\./g, "%2E")
    .replace(/!/g, "%21")
    .replace(/~/g, "%7E")
    .replace(/\*/g, "%2A")
    .replace(/'/g, "%27")
    .replace(/\(/g, "%28")
    .replace(/\)/g, "%29");
}

function decodeBountyStorageKey(key) {
  const value = String(key ?? "");
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}

function encodeBountiesForStorage(value) {
  const normalized = normalizeBounties(value);
  const result = {};
  sortBountyEntries(Object.entries(normalized)).forEach(([target, amount]) => {
    const key = encodeBountyStorageKey(target);
    if (!key) return;
    result[key] = {
      target,
      amount: Number(amount)
    };
  });
  return result;
}

function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function formatBountyAmount(value) {
  const number = Math.max(0, Number(value || 0));
  return Number.isFinite(number) ? number.toLocaleString("ko-KR") : "0";
}

function getBountyAmountClass(value) {
  const length = String(Math.max(0, Number(value || 0))).length;
  if (length <= 3) return "bounty-amount-short";
  if (length <= 5) return "bounty-amount-medium";
  return "bounty-amount-long";
}

function getTextLengthClass(value) {
  const length = Array.from(String(value || "").replace(/\s+/g, "")).length;
  if (length <= 4) return "text-short";
  if (length <= 8) return "text-medium";
  if (length <= 13) return "text-long";
  return "text-xlong";
}

function getNumberDigitClass(value) {
  const digits = String(value || "").replace(/\D/g, "").length;
  if (digits <= 1) return "number-digit-1";
  if (digits === 2) return "number-digit-2";
  return "number-digit-3";
}


function render() {
  if (!activeRoomId && !activeBattleRoomId) {
    document.body.classList.add("view-home");
    if (els.homeScreen) els.homeScreen.hidden = false;
    const layout = document.querySelector(".layout");
    if (layout) {
      layout.hidden = true;
      layout.setAttribute("aria-hidden", "true");
    }
    if (els.adminPanel) els.adminPanel.hidden = true;
    if (els.adminToggleRow) els.adminToggleRow.hidden = true;
    if (els.obsScalePanel) els.obsScalePanel.hidden = true;
    renderRoomCards();
    if (els.pageTitle) els.pageTitle.textContent = "방 선택";
    return;
  }

  currentState = normalizeState(currentState);
  updateRoomAccessState();

  if (els.pageTitle) els.pageTitle.textContent = getViewTitle();
  if (els.currentRoomName) els.currentRoomName.textContent = currentState.roomName || getRoomLabel(activeRoomId);
  if (els.currentRoomCode) els.currentRoomCode.textContent = isAdmin ? (currentState.accessCode || "-") : "입장 후 표시";
  if (els.roomInfoBox) els.roomInfoBox.hidden = false;
  if (els.boardTitle) els.boardTitle.textContent = currentState.title;
  if (els.titleInput) els.titleInput.value = currentState.title;
  if (els.typeSelect) els.typeSelect.value = currentState.contentType;
  syncSizeSelectForType(currentState.contentType, currentState.size);

  const isResetBingo = currentState.contentType === "reset";
  const isNumberBingo = currentState.contentType === "number";
  const isLetterBingo = currentState.contentType === "alphabet" || currentState.contentType === "reset";
  const resetRewards = normalizeResetRewards(currentState.resetRewards);

  document.body.classList.toggle("is-reset-bingo", isResetBingo);
  document.body.classList.toggle("is-number-bingo", isNumberBingo);
  document.body.classList.toggle("is-letter-bingo", isLetterBingo);

  if (els.chickenInput) els.chickenInput.value = String(currentState.chickenCount);
  if (els.chickenPreview) els.chickenPreview.textContent = currentState.chickenCount;
  if (els.bingoCount) els.bingoCount.textContent = currentState.bingoCount;
  if (els.chickenCount) els.chickenCount.textContent = currentState.chickenCount;
  if (els.resetBingoCount) els.resetBingoCount.textContent = currentState.bingoCount;
  if (els.resetChickenCount) els.resetChickenCount.textContent = currentState.chickenCount;
  if (els.resetRewardOne) els.resetRewardOne.value = String(resetRewards.one);
  if (els.resetRewardLine) els.resetRewardLine.value = String(resetRewards.line);
  if (els.resetRewardAll) els.resetRewardAll.value = String(resetRewards.all);
  if (els.resetMenuOne) els.resetMenuOne.textContent = String(resetRewards.one);
  if (els.resetMenuLine) els.resetMenuLine.textContent = String(resetRewards.line);
  if (els.resetMenuAll) els.resetMenuAll.textContent = String(resetRewards.all);
  if (els.standardScoreStrip) els.standardScoreStrip.hidden = isResetBingo;
  if (els.resetScoreMenu) els.resetScoreMenu.hidden = !isResetBingo;
  if (els.maxBingoCount) els.maxBingoCount.textContent = currentState.size * 2 + 2;
  if (els.bingoBoard) els.bingoBoard.style.setProperty("--cell-size", currentState.size);

  renderMemoState();
  updateAdminPanelSections();
  renderAdminLock();
  renderEditModeState();
  updateBountyPanelState();
  updateResetMenuAdminState();
  renderBoard();
  renderLines();
  maybePlayBingoEffect();
}

function getViewTitle() {
  const roomName = currentState.roomName || getRoomLabel(activeRoomId);
  if (activeView === "obs") return `${roomName} 송출용`;
  return roomName;
}

function renderAdminLock() {
  const locked = activeView !== "obs" && !isAdmin;
  $$('[data-admin-only]').forEach((item) => {
    item.style.opacity = locked ? ".45" : "1";
    item.style.pointerEvents = locked ? "none" : "auto";
  });

  const shouldDisable = activeView !== "obs" && !isAdmin;
  [
    els.titleInput,
    els.typeSelect,
    els.createBoardBtn,
    els.shuffleBtn,
    els.resetChecksBtn,
    els.bountyNumberInput,
    els.bountyAmountInput,
    els.bountyAddBtn,
    els.bountyClearBtn,
    els.chickenInput,
    els.chickenMinusBtn,
    els.chickenPlusBtn,
    els.resetRewardOne,
    els.resetRewardLine,
    els.resetRewardAll,
    els.bulkText,
    els.applyBulkBtn,
    els.clearBulkBtn,
    els.hardResetBtn,
    els.editModeToggleBtn
  ].forEach((el) => {
    if (el) el.disabled = shouldDisable;
  });

  if (els.sizeSelect) {
    els.sizeSelect.disabled = shouldDisable || getAllowedSizesForType(els.typeSelect?.value || currentState.contentType).length === 1;
  }
}

function renderBoard() {
  if (!els.bingoBoard) return;
  els.bingoBoard.innerHTML = "";
  const completedCellIndexes = new Set(
    Object.values(currentState.completedLines || {}).flatMap((line) => line.cells)
  );
  const bounties = normalizeBounties(currentState.bounties, currentState.bountyNumbers);

  currentState.cells.forEach((cell, index) => {
    const cellEl = document.createElement("div");
    const numberDigitClass = currentState.contentType === "number" ? getNumberDigitClass(cell.text) : "";
    cellEl.className = `cell ${getTextLengthClass(cell.text)} ${numberDigitClass}`.trim();
    cellEl.dataset.index = String(index);
    cellEl.classList.toggle("cleared", Boolean(cell.cleared));
    cellEl.classList.toggle("line-completed", completedCellIndexes.has(index));
    const bountyTarget = normalizeBountyTarget(cell.text);
    const bountyAmount = bountyTarget ? bounties[bountyTarget] : null;
    const hasBounty = Number.isFinite(Number(bountyAmount)) && Number(bountyAmount) > 0;
    cellEl.classList.toggle("bounty", hasBounty);

    const text = document.createElement("div");
    text.className = "cell-text";
    text.textContent = cell.text;
    cellEl.append(text);

    if (hasBounty) {
      const amount = document.createElement("div");
      amount.className = `bounty-amount ${getBountyAmountClass(bountyAmount)}`;
      amount.textContent = formatBountyAmount(bountyAmount);
      cellEl.append(amount);
    }

    if (activeView !== "obs" && isAdmin) {
      cellEl.classList.add("admin-clickable");
      cellEl.classList.toggle("edit-clickable", isEditMode);
      cellEl.title = isEditMode
        ? "수정 모드: 클릭하면 내용을 바꿉니다."
        : (cell.cleared ? "클릭하면 복구됩니다." : "클릭하면 지워집니다.");
      cellEl.addEventListener("click", () => {
        if (isEditMode) {
          openCellEditModal(index);
          return;
        }
        toggleCell(index);
      });
    }

    els.bingoBoard.append(cellEl);
  });
}

function renderLines() {
  if (!els.lineLayer) return;
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
  if (!els.bingoOverlay) return;
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

function getResetLineIndexes(lineType, lineIndex, size = currentState.size) {
  const safeSize = Number(size || 5);
  const safeIndex = Number(lineIndex);
  if (!Number.isInteger(safeIndex) || safeIndex < 0 || safeIndex >= safeSize) return [];

  if (lineType === "row") {
    return Array.from({ length: safeSize }, (_, col) => safeIndex * safeSize + col);
  }

  if (lineType === "col") {
    return Array.from({ length: safeSize }, (_, row) => row * safeSize + safeIndex);
  }

  if (lineType === "diag" && safeIndex === 0) {
    return Array.from({ length: safeSize }, (_, index) => index * safeSize + index);
  }

  if (lineType === "diag" && safeIndex === 1) {
    return Array.from({ length: safeSize }, (_, index) => index * safeSize + (safeSize - 1 - index));
  }

  return [];
}

function releaseResetLine(lineType, lineIndex) {
  if (currentState.contentType !== "reset") {
    alert("리셋빙고에서만 사용할 수 있습니다.");
    return;
  }

  const indexes = getResetLineIndexes(lineType, lineIndex, currentState.size);
  if (!indexes.length) return;

  commitState((draft) => {
    indexes.forEach((index) => {
      if (draft.cells[index]) draft.cells[index].cleared = false;
    });
  });
}

function releaseAllResetChecks() {
  if (currentState.contentType !== "reset") {
    alert("리셋빙고에서만 사용할 수 있습니다.");
    return;
  }

  if (!confirm("리셋빙고 전체 체크를 해제할까요?")) return;

  commitState((draft) => {
    draft.cells = draft.cells.map((cell) => ({ ...cell, cleared: false }));
  });
}

async function commitState(mutator) {
  if (!isAdmin) {
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

  // Firebase 저장이 실패하더라도 화면에서 버튼 반응이 바로 보이도록 먼저 렌더링합니다.
  render();

  if (isFirebaseEnabled) {
    if (!roomRef) {
      alert("방이 선택되지 않아 저장할 수 없습니다.");
      return;
    }

    try {
      currentState.updatedAt = Date.now();
      await set(roomRef, prepareStateForStorage(currentState));
    } catch (error) {
      console.error("Firebase 저장 실패", error);
      alert("Firebase 저장에 실패했습니다. Realtime Database URL, Database 생성 여부, Rules 권한을 확인해 주세요. 화면에는 임시로 반영됐지만 새로고침하면 사라질 수 있습니다.");
    }
    return;
  }

  localStorage.setItem(getLocalStorageKey(activeRoomId), JSON.stringify(currentState));
}

function prepareStateForStorage(state) {
  const prepared = {
    ...state,
    roomId: state.roomId || activeRoomId || "",
    roomName: state.roomName || getRoomLabel(activeRoomId),
    accessCode: state.accessCode || currentState.accessCode || "",
    updatedAt: Date.now(),
    bounties: encodeBountiesForStorage(state.bounties),
    bountyNumbers: Object.keys(normalizeBounties(state.bounties))
  };

  delete prepared.drawnNumbers;
  delete prepared.lastDrawnNumber;
  delete prepared.lastDrawMatched;

  return prepared;
}

function makeInitialState(roomId = activeRoomId) {
  const base = structuredClone(stateDefaults);
  base.roomId = roomId || "";
  base.roomName = roomId ? getRoomLabel(roomId) : "";
  base.cells = buildCells(base.size, base.contentType);
  return applyBingoCalculation(base, {});
}

function normalizeState(raw) {
  const contentType = BINGO_TYPES.includes(raw?.contentType) ? raw.contentType : "mission";
  const size = getValidSizeForType(contentType, Number(raw?.size));
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
    roomId: String(raw?.roomId || activeRoomId || ""),
    roomName: String(raw?.roomName || getRoomLabel(activeRoomId)),
    accessCode: String(raw?.accessCode || ""),
    createdAt: Number(raw?.createdAt || 0),
    updatedAt: Number(raw?.updatedAt || 0),
    title: String(raw?.title || "오늘의 빙고"),
    size,
    contentType,
    chickenCount: Math.max(0, Number(raw?.chickenCount || 0)),
    resetRewards: normalizeResetRewards(raw?.resetRewards),
    bounties: normalizeBounties(raw?.bounties, raw?.bountyNumbers),
    effectNonce: Number(raw?.effectNonce || 0),
    lastNewLines: Array.isArray(raw?.lastNewLines) ? raw.lastNewLines : [],
    bountyNumbers: Object.keys(normalizeBounties(raw?.bounties, raw?.bountyNumbers)),
    memoText: String(raw?.memoText || ""),
    cells
  }, raw?.completedLines || {});
}

function buildCells(size, contentType) {
  const validSize = getValidSizeForType(contentType, size);
  const count = validSize * validSize;
  const presetTexts = contentType === "number"
    ? makeNumberTexts(count, validSize)
    : (contentType === "alphabet" || contentType === "reset")
      ? makeRandomAlphabetTexts(count)
      : null;

  return Array.from({ length: count }, (_, index) => ({
    id: `cell_${index}`,
    index,
    text: presetTexts ? presetTexts[index] : makeCellText(index, contentType),
    cleared: false
  }));
}

function makeCellText(index, contentType) {
  if (contentType === "number") return String(index + 1);
  if (contentType === "alphabet") return String.fromCharCode(65 + (index % 26));
  if (contentType === "reset") return makeRandomAlphabetTexts(25)[index] || "A";
  return `미션 ${index + 1}`;
}

function makeNumberTexts(count, size) {
  if (size === 10 && count === 100) {
    return Array.from({ length: 100 }, (_, index) => String(index + 1));
  }

  return makeRandomNumberTexts(count);
}

function makeRandomNumberTexts(count) {
  return shuffleArray(Array.from({ length: 100 }, (_, index) => String(index + 1))).slice(0, count);
}

function makeRandomAlphabetTexts(count) {
  return shuffleArray(Array.from({ length: 26 }, (_, index) => String.fromCharCode(65 + index))).slice(0, count);
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

function getInitialObsScale() {
  const params = new URLSearchParams(location.search);
  const fromQuery = Number(params.get("scale"));
  const fromStorage = Number(localStorage.getItem(OBS_SCALE_STORAGE_KEY));
  const value = Number.isFinite(fromQuery) && fromQuery > 0 ? fromQuery : fromStorage;
  return normalizeObsScale(value || 1);
}

function normalizeObsScale(value) {
  const allowed = [1, 0.8, 0.67, 0.5];
  const number = Number(value);
  return allowed.find((scale) => Math.abs(scale - number) < 0.01) || 1;
}

function applyObsScale(value) {
  obsScale = normalizeObsScale(value);
  document.documentElement.style.setProperty("--obs-scale", String(obsScale));
  els.obsScaleButtons?.forEach((button) => {
    const scale = Number(button.dataset.obsScale || 1);
    button.classList.toggle("active", Math.abs(scale - obsScale) < 0.01);
  });
}


/* Battle number-bingo rooms */
const battleStateDefaults = {
  roomId: "",
  roomName: "",
  accessCode: "",
  createdAt: 0,
  updatedAt: 0,
  battle: {
    title: "숫자빙고 대결",
    playerCount: 2,
    size: 5,
    players: []
  }
};

function makeInitialBattleState(roomId = activeBattleRoomId) {
  const base = structuredClone(battleStateDefaults);
  base.roomId = roomId || "";
  base.roomName = roomId ? getBattleRoomLabel(roomId) : "";
  base.battle.players = buildBattlePlayers(2, 5);
  return normalizeBattleState(base);
}

function normalizeBattleState(raw) {
  const playerCount = [2, 3].includes(Number(raw?.battle?.playerCount)) ? Number(raw.battle.playerCount) : 2;
  const size = NUMBER_BINGO_SIZES.includes(Number(raw?.battle?.size)) ? Number(raw.battle.size) : 5;
  const total = size * size;
  const rawPlayers = Array.isArray(raw?.battle?.players) ? raw.battle.players : [];
  const players = Array.from({ length: playerCount }, (_, index) => {
    const source = rawPlayers[index] || {};
    const numbers = Array.isArray(source.numbers) && source.numbers.length === total
      ? source.numbers.map((value) => String(value))
      : makeBattleNumberTexts(total, size);
    const checked = Array.isArray(source.checked) && source.checked.length === total
      ? source.checked.map(Boolean)
      : Array.from({ length: total }, () => false);
    return {
      id: source.id || `p${index + 1}`,
      name: String(source.name || `팀 ${index + 1}`),
      numbers,
      checked,
      chicken: Math.max(0, Number(source.chicken || 0))
    };
  });

  return {
    ...battleStateDefaults,
    ...raw,
    roomId: String(raw?.roomId || activeBattleRoomId || ""),
    roomName: String(raw?.roomName || getBattleRoomLabel(activeBattleRoomId)),
    accessCode: String(raw?.accessCode || ""),
    createdAt: Number(raw?.createdAt || 0),
    updatedAt: Number(raw?.updatedAt || 0),
    battle: {
      title: String(raw?.battle?.title || "숫자빙고 대결"),
      playerCount,
      size,
      players
    }
  };
}

function prepareBattleStateForStorage(state) {
  return {
    ...state,
    roomId: state.roomId || activeBattleRoomId || "",
    roomName: state.roomName || getBattleRoomLabel(activeBattleRoomId),
    accessCode: state.accessCode || currentBattleState?.accessCode || "",
    updatedAt: Date.now()
  };
}

function makeBattleNumberTexts(count, size) {
  if (size === 10 && count === 100) {
    return Array.from({ length: 100 }, (_, index) => String(index + 1));
  }
  return makeRandomNumberTexts(count);
}

function buildBattlePlayers(playerCount, size, oldPlayers = []) {
  const total = size * size;
  return Array.from({ length: playerCount }, (_, index) => ({
    id: `p${index + 1}`,
    name: oldPlayers[index]?.name || `팀 ${index + 1}`,
    numbers: makeBattleNumberTexts(total, size),
    checked: Array.from({ length: total }, () => false),
    chicken: Math.max(0, Number(oldPlayers[index]?.chicken || 0))
  }));
}

function computeBattleStats(player, size) {
  const total = size * size;
  const checkedCount = player.checked.filter(Boolean).length;
  const percent = total ? Math.round((checkedCount / total) * 100) : 0;
  const completedLines = computeCompletedLines(player.checked.map((checked, index) => ({ id: `cell_${index}`, cleared: checked })), size);
  return { total, checkedCount, percent, bingoCount: Object.keys(completedLines).length, completedLines };
}

function getBattleLineCoords(line, size) {
  return getLineCoords(line, size);
}

async function createOrResetBattleRoom(roomId) {
  const room = BATTLE_ROOM_OPTIONS.find((item) => item.id === roomId);
  if (!room) return;

  const alreadyExists = Boolean(battleRoomSummaries?.[roomId]?.accessCode);
  const approved = await requestRoomAdminApproval(room.label, alreadyExists);
  if (!approved) return;
  if (alreadyExists && !confirm(`${room.label}이 이미 있습니다. 새 입장 코드로 초기화할까요? 기존 대결 데이터가 초기화됩니다.`)) return;

  const code = generateRoomCode();
  const fresh = makeInitialBattleState(roomId);
  fresh.roomId = roomId;
  fresh.roomName = room.label;
  fresh.accessCode = code;
  fresh.createdAt = Date.now();
  fresh.updatedAt = Date.now();

  try {
    if (isFirebaseEnabled && db) {
      await set(ref(db, `${BATTLE_ROOMS_PATH}/${roomId}`), prepareBattleStateForStorage(fresh));
    } else {
      localStorage.setItem(getBattleLocalStorageKey(roomId), JSON.stringify(fresh));
    }
    storeBattleRoomCode(roomId, code);
    alert(`${room.label} 생성 완료!\n입장 코드: ${code}`);
    location.href = `?battleRoom=${encodeURIComponent(roomId)}&view=public`;
  } catch (error) {
    console.error("대결방 생성 실패", error);
    alert("대결방 생성에 실패했습니다. Firebase Rules 또는 DB 연결을 확인해 주세요.");
  }
}

function promptEnterBattleRoom(roomId, view = "public") {
  const room = battleRoomSummaries?.[roomId];
  const label = getBattleRoomLabel(roomId);
  if (!room?.accessCode) {
    alert("아직 생성되지 않은 대결방입니다. 먼저 방 생성을 해주세요.");
    return;
  }
  const cached = getStoredBattleRoomCode(roomId);
  if (cached && cached === String(room.accessCode)) {
    location.href = `?battleRoom=${encodeURIComponent(roomId)}&view=${encodeURIComponent(view)}`;
    return;
  }
  const code = prompt(`${label} 입장 코드 5자리를 입력해 주세요.`);
  if (code == null) return;
  if (String(code).trim() !== String(room.accessCode)) {
    alert("입장 코드가 맞지 않습니다.");
    return;
  }
  storeBattleRoomCode(roomId, String(code).trim());
  location.href = `?battleRoom=${encodeURIComponent(roomId)}&view=${encodeURIComponent(view)}`;
}

async function initBattle() {
  setupBattleView();
  bindBattleEvents();
  setupBattleFirebaseIfAvailable();
  await loadInitialBattleState();
  renderBattle();
}

function setupBattleView() {
  document.body.classList.toggle("view-battle", true);
  document.body.classList.toggle("view-battle-obs", activeView === "battleObs");
  document.body.classList.toggle("view-public", activeView !== "battleObs");
  document.body.classList.toggle("view-obs", false);
  if (els.homeScreen) els.homeScreen.hidden = true;
  if (els.memoOpenBtn) els.memoOpenBtn.hidden = true;
  if (els.adminToggleRow) els.adminToggleRow.hidden = activeView === "battleObs";
  if (els.adminToggle) els.adminToggle.textContent = "관리자 패널 접기";
  if (els.pageTitle) els.pageTitle.textContent = getBattleRoomLabel(activeBattleRoomId);

  const nav = document.querySelector(".view-tabs");
  if (nav) {
    nav.innerHTML = `
      <a href="?battleRoom=${encodeURIComponent(activeBattleRoomId)}&view=public" class="${activeView !== "battleObs" ? "active" : ""}">대결 관리</a>
      <a href="?battleRoom=${encodeURIComponent(activeBattleRoomId)}&view=battleObs" class="${activeView === "battleObs" ? "active" : ""}">송출용</a>
    `;
  }

  const layout = document.querySelector(".layout");
  if (!layout) return;
  layout.hidden = false;
  layout.innerHTML = `
    <aside class="admin-panel battle-admin-panel" id="battleAdminPanel" ${activeView === "battleObs" ? "hidden" : ""}>
      <section class="panel-card">
        <div class="panel-head"><h2>방 권한</h2><span id="battleLoginStatus" class="status-pill">확인 중</span></div>
        <div class="login-box room-info-box">
          <div class="room-info-line"><span>현재 방</span><strong id="battleCurrentRoomName">-</strong></div>
          <div class="room-info-line"><span>입장 코드</span><strong id="battleCurrentRoomCode">-</strong></div>
          <div class="row-buttons"><button id="battleCopyCodeBtn" class="primary-btn" type="button">코드 복사</button><button id="battleLeaveRoomBtn" class="ghost-btn" type="button">방 나가기</button></div>
        </div>
      </section>
      <section class="panel-card battle-admin-only" data-battle-admin-only>
        <div class="panel-head"><h2>대결 생성</h2><span class="status-pill">숫자 전용</span></div>
        <label>대결 제목<input id="battleTitleInput" type="text" maxlength="40" /></label>
        <div class="two-col">
          <label>참가 팀 수<select id="battlePlayerCountSelect"><option value="2">2팀</option><option value="3">3팀</option></select></label>
          <label>빙고 크기<select id="battleSizeSelect"><option value="5">5 × 5</option><option value="7">7 × 7</option><option value="10">10 × 10</option></select></label>
        </div>
        <div class="row-buttons wrap"><button id="battleSaveSettingsBtn" class="primary-btn" type="button">설정 저장</button><button id="battleGenerateBtn" class="ghost-btn" type="button">대결판 새로 생성</button></div>
        <p class="help-text">5×5/7×7은 팀별 랜덤 숫자판, 10×10은 모든 팀이 1~100 순서판으로 생성됩니다.</p>
      </section>
      <section class="panel-card battle-admin-only" data-battle-admin-only>
        <div class="panel-head"><h2>참가자 설정</h2></div>
        <div id="battlePlayerNameInputs"></div>
        <button id="battleSaveNamesBtn" class="primary-btn" type="button">팀 이름 저장</button>
      </section>
      <section class="panel-card battle-admin-only" data-battle-admin-only>
        <div class="panel-head"><h2>치킨 수</h2></div>
        <div id="battleChickenControls" class="battle-chicken-controls"></div>
      </section>
      <section class="panel-card battle-admin-only" data-battle-admin-only>
        <div class="panel-head"><h2>전체 관리</h2></div>
        <div class="row-buttons wrap"><button id="battleResetChecksBtn" class="ghost-btn danger-soft" type="button">체크 전체 초기화</button><button id="battleHardResetBtn" class="danger-btn" type="button">대결방 전체 초기화</button></div>
      </section>
    </aside>
    <section class="stage battle-stage" id="battleStage">
      <div class="board-title-block battle-title-block"><p class="board-kicker">NUMBER BATTLE</p><h2 id="battleTitleText">숫자빙고 대결</h2></div>
      <div id="battleTeamTabs" class="battle-team-tabs"></div>
      <div id="battlePlayerView" class="battle-player-view"></div>
    </section>
    <aside class="obs-scale-panel" id="battleObsScalePanel" aria-label="송출용 화면 확대 축소" ${activeView === "battleObs" ? "" : "hidden"}>
      <p>OBS 비율</p>
      <button type="button" data-battle-obs-scale="1">100%</button>
      <button type="button" data-battle-obs-scale="0.8">80%</button>
      <button type="button" data-battle-obs-scale="0.67">67%</button>
      <button type="button" data-battle-obs-scale="0.5">50%</button>
    </aside>
  `;

  applyObsScale(obsScale);
}

function bindBattleEvents() {
  document.addEventListener("click", async (event) => {
    const target = event.target;
    if (!target) return;

    if (target.id === "battleCopyCodeBtn") {
      const code = currentBattleState.accessCode || "";
      if (!code) return;
      try { await navigator.clipboard.writeText(code); alert("입장 코드를 복사했어요."); }
      catch { prompt("입장 코드를 복사하세요.", code); }
    }

    if (target.id === "battleLeaveRoomBtn") {
      clearBattleRoomCode(activeBattleRoomId);
      location.href = "./";
    }

    if (target.id === "battleSaveSettingsBtn") saveBattleSettings(false);
    if (target.id === "battleGenerateBtn") saveBattleSettings(true);
    if (target.id === "battleSaveNamesBtn") saveBattleNames();
    if (target.id === "battleResetChecksBtn") resetBattleChecks();
    if (target.id === "battleHardResetBtn") hardResetBattleRoom();

    const tab = target.closest?.("[data-battle-team-tab]");
    if (tab) {
      battleActiveTeamIndex = Number(tab.dataset.battleTeamTab || 0);
      renderBattle();
    }

    const cell = target.closest?.("[data-battle-cell]");
    if (cell && activeView !== "battleObs") {
      const playerIndex = Number(cell.dataset.playerIndex);
      const cellIndex = Number(cell.dataset.battleCell);
      toggleBattleCell(playerIndex, cellIndex);
    }

    const chickenButton = target.closest?.("[data-battle-chicken]");
    if (chickenButton) {
      updateBattleChicken(Number(chickenButton.dataset.playerIndex), Number(chickenButton.dataset.battleChicken));
    }

    const scaleButton = target.closest?.("[data-battle-obs-scale]");
    if (scaleButton) {
      const scale = Number(scaleButton.dataset.battleObsScale || 1);
      applyObsScale(scale);
      localStorage.setItem(OBS_SCALE_STORAGE_KEY, String(scale));
      renderBattleObsScaleButtons();
    }
  });
}

function setupBattleFirebaseIfAvailable() {
  if (!isFirebaseEnabled) return;
  firebaseApp = initializeApp(firebaseConfig);
  db = getDatabase(firebaseApp);
  auth = getAuth(firebaseApp);
  battleRoomsRef = ref(db, BATTLE_ROOMS_PATH);
  battleRoomRef = ref(db, `${BATTLE_ROOMS_PATH}/${activeBattleRoomId}`);

  onValue(battleRoomRef, (snapshot) => {
    if (!snapshot.exists()) {
      alert("아직 생성되지 않은 대결방입니다. 방 선택 화면으로 이동합니다.");
      location.href = "./";
      return;
    }
    currentBattleState = normalizeBattleState(snapshot.val());
    updateBattleAccessState();
    renderBattle();
  }, (error) => {
    console.error("대결방 Firebase 수신 실패", error);
  });
}

async function loadInitialBattleState() {
  if (isFirebaseEnabled) {
    try {
      const snapshot = await get(battleRoomRef);
      currentBattleState = snapshot.exists() ? normalizeBattleState(snapshot.val()) : makeInitialBattleState(activeBattleRoomId);
      updateBattleAccessState();
    } catch (error) {
      console.error("대결방 초기 불러오기 실패", error);
      currentBattleState = makeInitialBattleState(activeBattleRoomId);
      updateBattleAccessState();
    }
    return;
  }

  const saved = localStorage.getItem(getBattleLocalStorageKey(activeBattleRoomId));
  currentBattleState = saved ? normalizeBattleState(JSON.parse(saved)) : makeInitialBattleState(activeBattleRoomId);
  updateBattleAccessState();
}

function updateBattleAccessState() {
  isBattleAdmin = activeView === "battleObs" || Boolean(currentBattleState.accessCode && getStoredBattleRoomCode(activeBattleRoomId) === String(currentBattleState.accessCode));
  if (activeView !== "battleObs" && !isBattleAdmin) {
    setTimeout(() => {
      const code = prompt(`${getBattleRoomLabel(activeBattleRoomId)} 입장 코드 5자리를 입력해 주세요.`);
      if (code && String(code).trim() === String(currentBattleState.accessCode || "")) {
        storeBattleRoomCode(activeBattleRoomId, String(code).trim());
        updateBattleAccessState();
        renderBattle();
      } else {
        alert("입장 코드가 맞지 않습니다.");
        location.href = "./";
      }
    }, 0);
  }
}

function renderBattle() {
  if (!activeBattleRoomId) return;
  const battle = currentBattleState.battle;
  const players = battle.players || [];
  const size = battle.size || 5;
  battleActiveTeamIndex = Math.max(0, Math.min(players.length - 1, battleActiveTeamIndex));

  document.documentElement.style.setProperty("--battle-cell-size", String(size));
  document.body.classList.toggle("battle-size-10", size === 10);
  document.body.classList.toggle("battle-size-7", size === 7);
  document.body.classList.toggle("battle-size-5", size === 5);

  const titleText = document.getElementById("battleTitleText");
  if (titleText) titleText.textContent = battle.title || "숫자빙고 대결";
  if (els.pageTitle) els.pageTitle.textContent = currentBattleState.roomName || getBattleRoomLabel(activeBattleRoomId);

  const loginStatus = document.getElementById("battleLoginStatus");
  if (loginStatus) {
    loginStatus.textContent = isBattleAdmin ? "방 입장 완료" : "입장 코드 필요";
    loginStatus.classList.toggle("ok", isBattleAdmin);
    loginStatus.classList.toggle("warn", !isBattleAdmin);
  }
  const roomName = document.getElementById("battleCurrentRoomName");
  const roomCode = document.getElementById("battleCurrentRoomCode");
  if (roomName) roomName.textContent = currentBattleState.roomName || getBattleRoomLabel(activeBattleRoomId);
  if (roomCode) roomCode.textContent = currentBattleState.accessCode || "-";

  document.querySelectorAll("[data-battle-admin-only]").forEach((node) => {
    node.hidden = activeView === "battleObs" || !isBattleAdmin;
  });

  const titleInput = document.getElementById("battleTitleInput");
  const countSelect = document.getElementById("battlePlayerCountSelect");
  const sizeSelect = document.getElementById("battleSizeSelect");
  if (titleInput && document.activeElement !== titleInput) titleInput.value = battle.title || "숫자빙고 대결";
  if (countSelect) countSelect.value = String(battle.playerCount || 2);
  if (sizeSelect) sizeSelect.value = String(size);

  renderBattleTeamTabs(players);
  renderBattlePlayerNameInputs(players);
  renderBattleChickenControls(players);
  renderBattlePlayerView(players[battleActiveTeamIndex], battleActiveTeamIndex);
  renderBattleObsScaleButtons();
}

function renderBattleTeamTabs(players) {
  const box = document.getElementById("battleTeamTabs");
  if (!box) return;
  box.innerHTML = players.map((player, index) => {
    const stats = computeBattleStats(player, currentBattleState.battle.size);
    return `<button type="button" data-battle-team-tab="${index}" class="${index === battleActiveTeamIndex ? "active" : ""}">${escapeHtml(player.name)} <span>${stats.percent}%</span></button>`;
  }).join("");
}

function renderBattlePlayerNameInputs(players) {
  const box = document.getElementById("battlePlayerNameInputs");
  if (!box) return;
  box.innerHTML = players.map((player, index) => `
    <label>팀 ${index + 1} 이름<input data-battle-player-name="${index}" type="text" maxlength="20" value="${escapeHtml(player.name)}" /></label>
  `).join("");
}

function renderBattleChickenControls(players) {
  const box = document.getElementById("battleChickenControls");
  if (!box) return;
  box.innerHTML = players.map((player, index) => `
    <div class="battle-chicken-row">
      <strong>${escapeHtml(player.name)}</strong>
      <button class="ghost-btn" type="button" data-player-index="${index}" data-battle-chicken="-1">-</button>
      <span>🍗 ${Number(player.chicken || 0)}</span>
      <button class="ghost-btn" type="button" data-player-index="${index}" data-battle-chicken="1">+</button>
    </div>
  `).join("");
}

function renderBattlePlayerView(player, playerIndex) {
  const view = document.getElementById("battlePlayerView");
  if (!view || !player) return;
  const size = currentBattleState.battle.size;
  const stats = computeBattleStats(player, size);
  const opponents = currentBattleState.battle.players
    .map((other, index) => ({ other, index, stats: computeBattleStats(other, size) }))
    .filter((item) => item.index !== playerIndex);
  const opponentHtml = opponents.length
    ? opponents.map(({ other, stats }) => `<span>${escapeHtml(other.name)} ${stats.checkedCount}/${stats.total} · ${stats.percent}%</span>`).join("")
    : `<span>상대 없음</span>`;

  const cells = player.numbers.map((number, index) => {
    const checked = Boolean(player.checked[index]);
    return `<button type="button" data-player-index="${playerIndex}" data-battle-cell="${index}" class="battle-cell ${checked ? "checked" : ""} number-digit-${String(number).length}"><span>${escapeHtml(number)}</span></button>`;
  }).join("");
  const lines = Object.values(stats.completedLines).map((line) => {
    const coords = getBattleLineCoords(line, size);
    return `<line class="bingo-line" x1="${coords.x1}" y1="${coords.y1}" x2="${coords.x2}" y2="${coords.y2}"></line>`;
  }).join("");

  view.innerHTML = `
    <div class="battle-player-card">
      <div class="battle-player-head">
        <div><p class="eyebrow">ACTIVE BOARD</p><h3>${escapeHtml(player.name)}</h3></div>
        <div class="battle-progress-main"><strong>${stats.checkedCount}/${stats.total}</strong><span>진행률 ${stats.percent}%</span></div>
      </div>
      <div class="battle-opponents"><b>상대 진행률</b>${opponentHtml}</div>
      <div class="battle-board-canvas">
        <div class="battle-board-grid">${cells}</div>
        <svg class="battle-line-layer" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">${lines}</svg>
      </div>
      <div class="battle-score-strip">
        <div class="score-box"><span class="score-label">BINGO</span><strong>${stats.bingoCount}</strong></div>
        <div class="score-box chicken-box"><span class="score-label">🍗</span><strong>${Number(player.chicken || 0)}</strong></div>
      </div>
    </div>
  `;
}

function renderBattleObsScaleButtons() {
  document.querySelectorAll("[data-battle-obs-scale]").forEach((button) => {
    const scale = Number(button.dataset.battleObsScale || 1);
    button.classList.toggle("active", Math.abs(scale - obsScale) < 0.01);
  });
}

function requireBattleAdmin() {
  if (!isBattleAdmin || activeView === "battleObs") {
    alert("대결방 입장 후 수정할 수 있습니다.");
    return false;
  }
  return true;
}

function saveBattleSettings(regenerate) {
  if (!requireBattleAdmin()) return;
  const title = String(document.getElementById("battleTitleInput")?.value || "숫자빙고 대결").trim() || "숫자빙고 대결";
  const playerCount = Number(document.getElementById("battlePlayerCountSelect")?.value || 2);
  const size = Number(document.getElementById("battleSizeSelect")?.value || 5);
  if (regenerate && !confirm("대결판을 새로 생성하면 체크 상태가 초기화됩니다. 계속할까요?")) return;

  commitBattleState((draft) => {
    const oldPlayers = draft.battle.players || [];
    const countChanged = Number(draft.battle.playerCount) !== playerCount;
    const sizeChanged = Number(draft.battle.size) !== size;
    draft.battle.title = title;
    draft.battle.playerCount = [2, 3].includes(playerCount) ? playerCount : 2;
    draft.battle.size = NUMBER_BINGO_SIZES.includes(size) ? size : 5;
    if (regenerate || countChanged || sizeChanged) {
      draft.battle.players = buildBattlePlayers(draft.battle.playerCount, draft.battle.size, oldPlayers);
      battleActiveTeamIndex = 0;
    }
  });
}

function saveBattleNames() {
  if (!requireBattleAdmin()) return;
  const inputs = [...document.querySelectorAll("[data-battle-player-name]")];
  commitBattleState((draft) => {
    inputs.forEach((input) => {
      const index = Number(input.dataset.battlePlayerName);
      if (draft.battle.players[index]) draft.battle.players[index].name = String(input.value || `팀 ${index + 1}`).trim() || `팀 ${index + 1}`;
    });
  });
}

function toggleBattleCell(playerIndex, cellIndex) {
  if (!requireBattleAdmin()) return;
  commitBattleState((draft) => {
    const player = draft.battle.players[playerIndex];
    if (!player || typeof player.checked[cellIndex] === "undefined") return;
    player.checked[cellIndex] = !player.checked[cellIndex];
  });
}

function updateBattleChicken(playerIndex, delta) {
  if (!requireBattleAdmin()) return;
  commitBattleState((draft) => {
    const player = draft.battle.players[playerIndex];
    if (!player) return;
    player.chicken = Math.max(0, Number(player.chicken || 0) + Number(delta || 0));
  });
}

function resetBattleChecks() {
  if (!requireBattleAdmin()) return;
  if (!confirm("모든 팀의 체크를 초기화할까요?")) return;
  commitBattleState((draft) => {
    draft.battle.players.forEach((player) => {
      player.checked = player.checked.map(() => false);
    });
  });
}

function hardResetBattleRoom() {
  if (!requireBattleAdmin()) return;
  if (!confirm("대결방을 기본 상태로 초기화할까요? 입장 코드는 유지됩니다.")) return;
  commitBattleState((draft) => {
    const code = draft.accessCode;
    const createdAt = draft.createdAt;
    const roomName = draft.roomName;
    const fresh = makeInitialBattleState(activeBattleRoomId);
    Object.assign(draft, fresh, { accessCode: code, createdAt, roomName });
    battleActiveTeamIndex = 0;
  });
}

async function commitBattleState(mutator) {
  const before = normalizeBattleState(currentBattleState);
  const draft = structuredClone(before);
  mutator(draft);
  await saveWholeBattleState(draft);
}

async function saveWholeBattleState(nextState) {
  currentBattleState = normalizeBattleState(nextState);
  renderBattle();
  if (isFirebaseEnabled) {
    if (!battleRoomRef) {
      alert("대결방이 선택되지 않아 저장할 수 없습니다.");
      return;
    }
    try {
      currentBattleState.updatedAt = Date.now();
      await set(battleRoomRef, prepareBattleStateForStorage(currentBattleState));
    } catch (error) {
      console.error("대결방 Firebase 저장 실패", error);
      alert("Firebase 저장에 실패했습니다. Rules 권한을 확인해 주세요.");
    }
    return;
  }
  localStorage.setItem(getBattleLocalStorageKey(activeBattleRoomId), JSON.stringify(currentBattleState));
}

function setLoginStatus(text, mode) {
  els.loginStatus.textContent = text;
  els.loginStatus.classList.remove("ok", "warn");
  if (mode) els.loginStatus.classList.add(mode);
}


async function startApp() {
  try {
    if (activeBattleRoomId) await initBattle();
    else await init();
  } catch (error) {
    console.error("앱 시작 실패", error);
    // 어떤 오류가 나도 첫 화면은 방 선택 목록을 보여주도록 안전하게 복구합니다.
    try {
      activeRoomId = null;
      activeBattleRoomId = null;
      activeView = "public";
      setupView();
      renderRoomCards();
    } catch (fallbackError) {
      console.error("방 선택 화면 복구 실패", fallbackError);
    }
  }
}

startApp();
