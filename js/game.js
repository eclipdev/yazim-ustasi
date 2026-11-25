// Doğru Yazarım İyi Oynarım — arayüz ve oyun akışı

import {
  defaultBoard,
  defaultPenalties,
  defaultQuestions,
  defaultSettings,
  categoryInfo,
  MIXED_ID,
  CATEGORY_ORDER,
  BOARD_LENGTH,
} from "./data.js";
import { store, KEYS } from "./store.js";
import {
  answerBoard,
  answerPenalty,
  categoryForSquare,
  createGame,
  currentPlayer,
  endTurn,
  isValidGame,
  markUsed,
  nextSquare,
  pickQuestion,
  saveGameResult,
  PLAYER_COLORS,
  MAX_SQUARE,
} from "./game-core.js";
import { fetchVisuals, saveResultToFirebase } from "./firebase.js";
import { TEAMS } from "./teams.js";

const $ = (sel, root = document) => root.querySelector(sel);

// Takım modunda hazır gelen adlar: ilk sürümdeki Gürbüz Team ve Süleyman Team.
const DEFAULT_TEAM_NAMES = [TEAMS.gurbuz.name, TEAMS.suleyman.name, "Takım 3", "Takım 4"];

const settings = { ...defaultSettings, ...(store.get(KEYS.settings, {}) || {}) };

let bank = [];
let penaltyBank = [];
let game = null;
let pending = null; // { kind: "board" | "penalty", question, categoryId, square }
let last = null; // { kind, isCorrect, needsPenalty, won }
let setupCount = 2;
let setupMode = "kisi";
const setupNamesByMode = { kisi: [], takim: [] };
let closeTimer = 0;

// ---------- Yardımcılar ----------

function shuffle(list) {
  const arr = [...list];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

function toast(message, ms = 2200) {
  const el = $("#toast");
  if (!el) return;
  el.textContent = message;
  el.classList.add("show");
  clearTimeout(toast._t);
  toast._t = setTimeout(() => el.classList.remove("show"), ms);
}

function initial(name) {
  const letter = String(name || "?").trim().charAt(0);
  return letter.toLocaleUpperCase("tr-TR");
}

function loadBank(fallback, key) {
  const custom = store.get(key, null);
  const raw = Array.isArray(custom) && custom.length ? custom : fallback;
  return raw.filter(
    (question) =>
      question &&
      typeof question.question === "string" &&
      Array.isArray(question.options) &&
      question.options.length >= 2 &&
      typeof question.answer === "string" &&
      question.options.includes(question.answer)
  );
}

function setView(name) {
  ["menu", "setup", "game", "finish"].forEach((view) => {
    const section = $(`#view-${view}`);
    if (section) section.hidden = view !== name;
  });
}

function showMenu() {
  setView("menu");
  const chip = $("#roundChip");
  if (chip) chip.hidden = true;
}

function openSetup() {
  setView("setup");
  renderSetup();
  const chip = $("#roundChip");
  if (chip) chip.hidden = true;
}

function boardOf(current) {
  return Array.isArray(current.board) && current.board.length === BOARD_LENGTH
    ? current.board
    : defaultBoard;
}

// ---------- Kurulum ----------

function readSetupInputs() {
  return [...document.querySelectorAll("#playerSetup input")].map((input) => input.value);
}

function renderSetup() {
  const isTeam = setupMode === "takim";
  const remembered = setupNamesByMode[setupMode] || [];
  const count = Math.max(2, Math.min(4, setupCount));
  const wrap = $("#playerSetup");
  wrap.textContent = "";

  for (let index = 0; index < count; index++) {
    const color = PLAYER_COLORS[index];

    const label = document.createElement("label");
    label.className = "field";

    const caption = document.createElement("span");
    const dot = document.createElement("i");
    dot.className = "dot";
    dot.style.setProperty("--p", color.ink);
    caption.append(dot, document.createTextNode(` ${index + 1}. ${isTeam ? "takım" : "oyuncu"}`));

    const fallback = isTeam ? DEFAULT_TEAM_NAMES[index] || `Takım ${index + 1}` : "";
    const input = document.createElement("input");
    input.type = "text";
    input.maxLength = 28;
    input.autocomplete = "off";
    input.value = String(remembered[index] || fallback || "").slice(0, 28);
    input.placeholder = isTeam
      ? DEFAULT_TEAM_NAMES[index] || `Takım ${index + 1}`
      : index === 0
        ? "Örneğin Ali"
        : index === 1
          ? "Örneğin Ece"
          : `Oyuncu ${index + 1}`;
    input.setAttribute("aria-label", `${index + 1}. ${isTeam ? "takımın" : "oyuncunun"} adı`);

    label.append(caption, input);
    wrap.append(label);
  }

  document.querySelectorAll("#countPick button").forEach((btn) => {
    btn.setAttribute("aria-pressed", String(Number(btn.dataset.count) === count));
  });

  document.querySelectorAll("#modePick button").forEach((btn) => {
    btn.setAttribute("aria-pressed", String(btn.dataset.mode === setupMode));
  });

  updateResume();
}

function bindSetup() {
  $("#modePick").addEventListener("click", (event) => {
    const btn = event.target.closest("button[data-mode]");
    if (!btn) return;
    const mode = btn.dataset.mode === "takim" ? "takim" : "kisi";
    if (mode === setupMode) return;
    setupNamesByMode[setupMode] = readSetupInputs();
    setupMode = mode;
    store.set(KEYS.mode, setupMode);
    $("#setupHint").textContent = "";
    $("#setupHint").classList.remove("error");
    renderSetup();
  });

  $("#countPick").addEventListener("click", (event) => {
    const btn = event.target.closest("button[data-count]");
    if (!btn) return;
    setupNamesByMode[setupMode] = readSetupInputs();
    setupCount = Number(btn.dataset.count);
    setupNamesByMode[setupMode] = setupNamesByMode[setupMode].slice(0, setupCount);
    renderSetup();
  });

  $("#setupForm").addEventListener("submit", (event) => {
    event.preventDefault();
    const hint = $("#setupHint");
    hint.textContent = "";
    hint.classList.remove("error");

    const isTeam = setupMode === "takim";
    const raw = readSetupInputs().slice(0, setupCount);
    const names = raw.map((value, index) => {
      const clean = value.trim().replace(/\s+/g, " ");
      if (clean) return clean;
      return isTeam ? DEFAULT_TEAM_NAMES[index] || `Takım ${index + 1}` : `Oyuncu ${index + 1}`;
    });

    const seen = new Set();
    for (let index = 0; index < names.length; index++) {
      const key = names[index].toLocaleLowerCase("tr-TR");
      if (seen.has(key)) {
        hint.textContent = `İki ${isTeam ? "takımın" : "oyuncunun"} adı aynı olamaz; adları ayır.`;
        hint.classList.add("error");
        document.querySelectorAll("#playerSetup input")[index].focus();
        return;
      }
      seen.add(key);
    }

    setupNamesByMode[setupMode] = names;
    store.set(isTeam ? KEYS.teamNames : KEYS.names, names);
    store.set(KEYS.mode, setupMode);
    beginGame(names, setupMode);
  });

  $("#resumeBtn").addEventListener("click", () => {
    const saved = store.get(KEYS.game, null);
    if (!isValidGame(saved)) {
      toast("Kayıtlı oyun bulunamadı.");
      updateResume();
      return;
    }
    game = saved;
    showGame();
  });

  $("#resumeDrop").addEventListener("click", () => {
    store.remove(KEYS.game);
    updateResume();
  });
}

function updateResume() {
  const card = $("#resumeCard");
  const saved = store.get(KEYS.game, null);

  if (!isValidGame(saved) || saved.over) {
    card.hidden = true;
    return;
  }

  const line = saved.players
    .map((player) => `${player.name} ${player.pos}/${MAX_SQUARE}`)
    .join(" · ");
  $("#resumeText").textContent = line;
  card.hidden = false;
}

function beginGame(names, mode = setupMode) {
  setupMode = mode === "takim" ? "takim" : "kisi";
  game = createGame({
    names,
    board: [...defaultBoard],
    mode: setupMode,
    at: new Date().toISOString(),
  });
  pending = null;
  last = null;
  saveState();
  showGame();
}

function showGame() {
  if (!game) return;
  if (!Array.isArray(game.board) || game.board.length !== BOARD_LENGTH) {
    game.board = [...defaultBoard];
  }
  setView("game");
  renderAll();
  saveState();
  $("#drawBtn")?.focus({ preventScroll: true });
}

// ---------- Oyun ekranı ----------

function saveState() {
  if (game) store.set(KEYS.game, game);
}

function renderAll() {
  renderBoard();
  renderPlayers();
  renderTurn();
}

function playerColor(player) {
  return PLAYER_COLORS.find((color) => color.key === player.color) || PLAYER_COLORS[0];
}

function makePlayerPin(player) {
  const color = playerColor(player);
  const isTurn = game.players[game.turn] === player;
  const pin = document.createElement("span");
  pin.className = `pin${isTurn ? " is-turn" : ""}`;
  pin.style.setProperty("--p", color.ink);
  pin.style.setProperty("--p-wash", color.wash);
  pin.textContent = initial(player.name);
  pin.title = `${player.name} · kare ${player.pos}`;
  return pin;
}

function renderBoard() {
  const grid = $("#boardGrid");
  grid.textContent = "";

  const board = boardOf(game);
  const target = nextSquare(game);
  const startPins = $("#startPins");
  startPins.textContent = "";

  // Yılan düzeni: tek satırlar soldan sağa, çift satırlar sağdan sola.
  const order = [];
  for (let row = 0; row < Math.ceil(BOARD_LENGTH / 5); row++) {
    for (let col = 0; col < 5; col++) {
      const square = row % 2 === 0 ? row * 5 + col + 1 : row * 5 + (4 - col) + 1;
      if (square <= BOARD_LENGTH) order.push(square);
    }
  }

  for (const square of order) {
    const categoryId = board[square - 1] || "karisik";
    const info = categoryInfo(categoryId);

    const cell = document.createElement("div");
    cell.className = "cell";
    cell.style.setProperty("--cat", info.color);
    cell.dataset.square = String(square);
    if (square === target) cell.classList.add("is-next");
    if (square === BOARD_LENGTH) cell.classList.add("finish");
    cell.setAttribute("role", "img");
    cell.setAttribute(
      "aria-label",
      `${square}. kare: ${info.name}${square === BOARD_LENGTH ? ", bitiş" : ""}`
    );
    cell.title = `${square}. kare · ${info.name}`;

    const number = document.createElement("span");
    number.className = "cell-no";
    number.textContent = String(square);

    const dot = document.createElement("span");
    dot.className = "cell-cat";

    const pins = document.createElement("span");
    pins.className = "cell-pins";

    game.players.forEach((player) => {
      if (player.pos === square) pins.append(makePlayerPin(player));
    });

    cell.append(number, dot, pins);
    grid.append(cell);
  }

  game.players.forEach((player) => {
    if (player.pos === 0) startPins.append(makePlayerPin(player));
  });
  startPins.hidden = !startPins.children.length;

  // Renk anahtarı
  const legend = $("#legend");
  legend.textContent = "";
  const ids = [...CATEGORY_ORDER, MIXED_ID];
  ids.forEach((id) => {
    const info = categoryInfo(id);
    const item = document.createElement("span");
    item.className = "legend-item";
    const swatch = document.createElement("i");
    swatch.style.setProperty("--cat", info.color);
    item.append(swatch, document.createTextNode(info.name));
    legend.append(item);
  });
}

function renderPlayers() {
  const panel = $("#playersPanel");
  panel.textContent = "";

  game.players.forEach((player, index) => {
    const color = playerColor(player);
    const card = document.createElement("div");
    card.className = `player-card${index === game.turn && !game.over ? " is-turn" : ""}`;
    card.style.setProperty("--p", color.ink);
    card.style.setProperty("--p-wash", color.wash);

    const pin = document.createElement("span");
    pin.className = "pin";
    pin.textContent = initial(player.name);
    pin.setAttribute("aria-hidden", "true");

    const meta = document.createElement("div");
    meta.className = "player-meta";

    const name = document.createElement("span");
    name.className = "nm";
    name.textContent = player.name;

    const stats = document.createElement("span");
    stats.className = "ps";
    const place = player.pos === 0 ? "Başlangıç" : `Kare ${player.pos}`;
    stats.textContent = `${place} · ${player.correct} doğru · ${player.wrong} yanlış`;

    meta.append(name, stats);
    card.append(pin, meta);
    panel.append(card);
  });
}

function renderTurn() {
  const player = currentPlayer(game);
  const square = nextSquare(game);
  const categoryId = categoryForSquare(boardOf(game), square);
  const info = categoryInfo(categoryId);
  const color = playerColor(player);

  const banner = $("#turnBanner");
  banner.style.setProperty("--p", color.ink);
  banner.style.setProperty("--p-wash", color.wash);

  $("#turnPin").textContent = initial(player.name);
  $("#turnName").textContent = player.name;
  $("#turnSub").textContent = game.over
    ? "yarışı tamamladı"
    : `sırası · Kare ${square} · ${info.name} kartı`;

  const draw = $("#drawBtn");
  draw.disabled = game.over;
  draw.textContent = game.over ? "Oyun bitti" : "Kart çek";

  const chip = $("#roundChip");
  if (chip) {
    chip.hidden = false;
    chip.textContent = `Kare ${Math.max(1, square)} / ${MAX_SQUARE}`;
  }

  const counter = $("#gameCounter");
  if (counter) {
    const who = game.mode === "takim" ? "takım" : "oyuncu";
    counter.textContent = `${game.cards} kart oynandı · ${game.players.length} ${who}`;
  }
}

// ---------- Kart ----------

function pickImage(isCorrect) {
  const legacy = {
    "assets/correct.svg": defaultSettings.correctImage,
    "assets/wrong.svg": defaultSettings.wrongImage,
  };
  const upgrade = (src) => legacy[src] || src;
  const list = isCorrect ? settings.correctImages : settings.wrongImages;
  const pool = Array.isArray(list) ? list.filter(Boolean).map(upgrade) : [];
  if (pool.length) return pool[Math.floor(Math.random() * pool.length)];
  return upgrade(
    isCorrect
      ? settings.correctImage || defaultSettings.correctImage
      : settings.wrongImage || defaultSettings.wrongImage
  );
}

function openLayer() {
  const layer = $("#playLayer");
  clearTimeout(closeTimer);
  layer.hidden = false;
  requestAnimationFrame(() => {
    requestAnimationFrame(() => layer.classList.add("show"));
  });
}

function closeLayer() {
  const layer = $("#playLayer");
  layer.classList.remove("show");
  clearTimeout(closeTimer);
  closeTimer = setTimeout(() => {
    if (!layer.classList.contains("show")) layer.hidden = true;
  }, 230);
  if (game && !game.over) $("#drawBtn")?.focus({ preventScroll: true });
}

function renderCard(cardData) {
  const { kind, question, categoryId, square } = cardData;
  const player = currentPlayer(game);
  const info = kind === "penalty" ? { name: "Ceza kartı", color: "#c8382c" } : categoryInfo(categoryId);

  const card = $("#playCard");
  card.classList.toggle("penalty", kind === "penalty");

  const chip = $("#playChip");
  chip.style.setProperty("--cat", info.color);
  chip.textContent = info.name;

  $("#playWhere").textContent = kind === "penalty" ? "ceza destesi" : `Kare ${square}`;
  $("#playKicker").textContent =
    kind === "penalty"
      ? `${player.name} · cezadan kurtulmak için doğru cevabı seç`
      : `${player.name} · doğru cevap bir kare ilerletir`;

  $("#playQuestion").textContent = question.question;

  const options = $("#playOptions");
  options.textContent = "";
  options.classList.toggle("two", question.options.length === 2);

  shuffle(question.options).forEach((text) => {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "option";
    btn.dataset.correct = text === question.answer ? "1" : "0";

    const label = document.createElement("span");
    label.textContent = text;

    const mark = document.createElement("span");
    mark.className = "mark";
    mark.setAttribute("aria-hidden", "true");

    btn.append(label, mark);
    btn.addEventListener("click", () => chooseOption(btn, text));
    options.append(btn);
  });

  const explain = $("#playExplain");
  explain.hidden = true;
  $("#playImg").hidden = true;
  $("#playImg").removeAttribute("src");

  openLayer();
  requestAnimationFrame(() => options.querySelector("button")?.focus({ preventScroll: true }));
}

function drawBoardCard() {
  if (!game || game.over || $("#playLayer").classList.contains("show")) return;

  const square = nextSquare(game);
  const categoryId = categoryForSquare(boardOf(game), square);
  const question = pickQuestion({ bank, category: categoryId, used: game.used });

  if (!question) {
    toast("Bu renkte kart kalmadı. Soru bankasını panelden genişletebilirsin.");
    return;
  }

  markUsed(game.used, question);
  pending = { kind: "board", question, categoryId, square };
  last = null;
  renderCard(pending);
}

function drawPenaltyCard() {
  const question = pickQuestion({ bank: penaltyBank, category: null, used: game.penaltyUsed });
  if (!question) {
    // Ceza destesi boşsa ceza uygulanmaz; oyuncu yerinde kalır.
    last = null;
    endTurn(game);
    saveState();
    closeLayer();
    renderAll();
    toast("Ceza destesi boş; ceza uygulanmadı.");
    return;
  }

  markUsed(game.penaltyUsed, question);
  pending = { kind: "penalty", question, categoryId: null, square: nextSquare(game) };
  last = null;
  renderCard(pending);
}

function chooseOption(button, text) {
  if (!pending || last) return;

  const { kind, question } = pending;
  const isCorrect = text === question.answer;

  [...$("#playOptions").children].forEach((btn) => {
    btn.disabled = true;
    if (btn.dataset.correct === "1") {
      btn.classList.add("correct");
      btn.querySelector(".mark").textContent = "✓";
    } else if (btn === button) {
      btn.classList.add("wrong");
      btn.querySelector(".mark").textContent = "✕";
    } else {
      btn.classList.add("dimmed");
    }
  });

  let verdict = "";
  const note = question.explanation || "";
  const next = $("#playNext");

  if (kind === "board") {
    const result = answerBoard(game, isCorrect);
    last = { kind, isCorrect, needsPenalty: result.needsPenalty, won: result.won };

    if (isCorrect) {
      verdict = result.won
        ? "Doğru ve 30. kare. Oyunu bitirdin."
        : "Doğru. Bir kare ilerledin.";
    } else {
      verdict = "Yanlış. Ceza kartı çekiyorsun.";
    }

    next.textContent = result.won
      ? "Sonucu gör"
      : result.needsPenalty
        ? "Ceza kartını çek"
        : "Sırayı devret";
  } else {
    const result = answerPenalty(game, isCorrect);
    last = { kind, isCorrect, needsPenalty: false, won: false };

    verdict = isCorrect
      ? "Cezadan kurtuldun. Yerinde kalıyorsun."
      : "Bir kare geri gidiyorsun.";
    next.textContent = "Sırayı devret";
  }

  const verdictEl = $("#playVerdict");
  verdictEl.textContent = verdict;
  verdictEl.className = `verdict ${isCorrect ? "good" : "bad"}`;
  $("#playNote").textContent = note;

  const img = $("#playImg");
  const fallback = isCorrect ? defaultSettings.correctImage : defaultSettings.wrongImage;
  img.alt = isCorrect ? "Doğru cevap görseli" : "Yanlış cevap görseli";
  img.onerror = () => {
    img.onerror = null;
    img.src = fallback;
  };
  img.src = pickImage(isCorrect);
  img.hidden = false;

  $("#playExplain").hidden = false;
  $("#playExplain").scrollIntoView({ block: "nearest" });

  renderBoard();
  renderPlayers();
  saveState();

  next.focus({ preventScroll: true });
}

function continueFlow() {
  if (!game || !last) return;

  if (last.kind === "board" && last.won) {
    closeLayer();
    finishGame();
    return;
  }

  if (last.kind === "board" && last.needsPenalty) {
    drawPenaltyCard();
    return;
  }

  endTurn(game);
  saveState();
  closeLayer();
  renderAll();
}

// ---------- Oyun sonu ----------

function finishGame() {
  if (!game) return;

  if (!game.resultSaved) {
    const rows = saveGameResult(game).map((row) => ({
      ...row,
      at: new Date().toISOString(),
    }));
    const list = store.get(KEYS.results, []);
    const arr = Array.isArray(list) ? list : [];
    store.set(KEYS.results, [...rows, ...arr].slice(0, 300));

    if (typeof saveResultToFirebase === "function") {
      rows.forEach((row) => {
        saveResultToFirebase(row).catch(() => {});
      });
    }

    game.resultSaved = true;
  }

  store.remove(KEYS.game);
  renderFinish();
  setView("finish");
}

function renderFinish() {
  const winner = game.players[game.winner] || game.players[0];

  $("#finishName").textContent = `${winner.name} kazandı`;
  $("#finishSub").textContent =
    `${game.cards} kart cevaplandı, ${game.penaltyCards} ceza kartı çekildi. ` +
    `Tahtadaki ${MAX_SQUARE} kareyi ilk tamamlayan ${winner.name} oldu.`;

  const table = $("#finishTable");
  table.textContent = "";

  const thead = document.createElement("thead");
  const headRow = document.createElement("tr");
  [game.mode === "takim" ? "Takım" : "Oyuncu", "Kare", "Doğru", "Yanlış", "Kurtulma"].forEach((label) => {
    const th = document.createElement("th");
    th.scope = "col";
    th.textContent = label;
    headRow.append(th);
  });
  thead.append(headRow);
  table.append(thead);

  const tbody = document.createElement("tbody");
  game.players.forEach((player, index) => {
    const tr = document.createElement("tr");
    if (index === game.winner) tr.className = "is-winner";

    const name = document.createElement("td");
    const color = playerColor(player);
    const dot = document.createElement("i");
    dot.className = "dot";
    dot.style.setProperty("--p", color.ink);
    name.append(dot, document.createTextNode(` ${player.name}`));
    if (index === game.winner) {
      const badge = document.createElement("span");
      badge.className = "win-badge";
      badge.textContent = "Kazanan";
      name.append(" ", badge);
    }

    tr.append(name);
    [player.pos, player.correct, player.wrong, player.escapes].forEach((value) => {
      const td = document.createElement("td");
      td.className = "num";
      td.textContent = String(value);
      tr.append(td);
    });
    tbody.append(tr);
  });
  table.append(tbody);

  const chip = $("#roundChip");
  if (chip) chip.hidden = true;
}

// ---------- Olaylar ----------

function bindGameEvents() {
  $("#menuGameBtn").addEventListener("click", openSetup);
  $("#menuBackBtn").addEventListener("click", showMenu);
  $("#menuFinishBtn").addEventListener("click", showMenu);

  $("#drawBtn").addEventListener("click", drawBoardCard);
  $("#playNext").addEventListener("click", continueFlow);

  $("#quitBtn").addEventListener("click", () => {
    setView("setup");
    if (game) {
      setupMode = game.mode === "takim" ? "takim" : "kisi";
      setupNamesByMode[setupMode] = game.players.map((player) => player.name);
      setupCount = game.players.length;
    }
    renderSetup();
    const chip = $("#roundChip");
    if (chip) chip.hidden = true;
    toast("Oyun kaydedildi; aşağıdan devam edebilirsin.", 2600);
  });

  $("#againBtn").addEventListener("click", () => {
    const mode = game ? game.mode : setupMode;
    const names = game ? game.players.map((player) => player.name) : setupNamesByMode[setupMode];
    beginGame(names, mode);
  });

  $("#setupBtn").addEventListener("click", () => {
    setView("setup");
    if (game) {
      setupMode = game.mode === "takim" ? "takim" : "kisi";
      setupNamesByMode[setupMode] = game.players.map((player) => player.name);
      setupCount = game.players.length;
    }
    renderSetup();
  });
}

// ---------- Başlat ----------

function init() {
  bank = loadBank(defaultQuestions, KEYS.questions);
  penaltyBank = loadBank(defaultPenalties, KEYS.penalties);

  setupMode = store.get(KEYS.mode, "kisi") === "takim" ? "takim" : "kisi";

  const rememberedPeople = store.get(KEYS.names, null);
  const rememberedTeams = store.get(KEYS.teamNames, null);
  setupNamesByMode.kisi = Array.isArray(rememberedPeople) ? rememberedPeople.slice(0, 4) : [];
  setupNamesByMode.takim = Array.isArray(rememberedTeams) ? rememberedTeams.slice(0, 4) : [];

  const saved = store.get(KEYS.game, null);
  if (isValidGame(saved) && !saved.over) {
    setupMode = saved.mode === "takim" ? "takim" : "kisi";
    setupCount = saved.players.length;
    setupNamesByMode[setupMode] = saved.players.map((player) => player.name);
  }

  bindSetup();
  bindGameEvents();
  renderSetup();
  setView("menu");

  // Yöneticinin ortak görsel listesi varsa doğru/yanlış görselleri oradan gelir.
  fetchVisuals()
    .then((shared) => {
      if (!shared) return;
      if (Array.isArray(shared.correctImages) && shared.correctImages.length) {
        settings.correctImages = shared.correctImages;
      }
      if (Array.isArray(shared.wrongImages) && shared.wrongImages.length) {
        settings.wrongImages = shared.wrongImages;
      }
    })
    .catch(() => {});
}

init();
