// Yazım Ustası — uygulama mantığı

import { defaultQuestions, defaultSettings } from "./data.js";
import { store, KEYS } from "./store.js";
import {
  saveResultToFirebase,
  observeAuth,
  signInWithGoogle,
  signOutUser,
  fetchPlayer,
  savePlayerProfile,
  fetchPlayerTable,
  fetchOwnSchoolNo,
  fetchVisuals,
} from "./firebase.js";
import { saveRound, localProgress, todayKey } from "./progress.js";
import { nameIsBad } from "./moderation.js";
import { TEAMS } from "./teams.js";

const $ = (sel, root = document) => root.querySelector(sel);

// Her soru için cevap süresi (saniye).
const QUESTION_SECONDS = 10;

const settings = { ...defaultSettings, ...(store.get(KEYS.settings, {}) || {}) };

const state = {
  user: null,        // Google hesabı { uid, email, displayName }
  banned: false,
  profile: null,     // { uid, name, className, schoolNo }
  questions: [],
  index: 0,
  score: 0,
  correct: 0,
  answered: false,
  feedbackTimer: 0,
  buttons: [],
  timeLeft: QUESTION_SECONDS,
  timer: 0,
};

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
  el.textContent = message;
  el.classList.add("show");
  clearTimeout(toast._t);
  toast._t = setTimeout(() => el.classList.remove("show"), ms);
}

function showView(name) {
  ["login", "quiz", "result"].forEach((view) => {
    const section = $(`#view-${view}`);
    section.hidden = view !== name;
  });
  const chip = $("#scoreChip");
  if (name === "login") chip.hidden = true;
}

function loadBank() {
  const custom = store.get(KEYS.questions, null);
  const raw = Array.isArray(custom) && custom.length ? custom : defaultQuestions;
  return raw.filter(
    (q) =>
      q &&
      typeof q.question === "string" &&
      Array.isArray(q.options) &&
      q.options.length >= 2 &&
      typeof q.answer === "string" &&
      q.options.includes(q.answer)
  );
}

// ---------- Giriş (Google + sınıf + okul numarası) ----------

function setFieldsEnabled(enabled) {
  $("#profileFields").disabled = !enabled;
}

function setTeam(value) {
  document.querySelectorAll('input[name="team"]').forEach((input) => {
    input.checked = input.value === value;
  });
}

async function refreshAuthUi() {
  const btn = $("#googleBtn");
  const hint = $("#loginHint");
  const user = state.user;

  if (!user) {
    btn.textContent = "Google ile giriş yap";
    btn.className = "btn primary block";
    $("#authState").textContent =
      "Başlamak için Google hesabınla giriş yap. Puanın hesabına bağlı kalır.";
    setFieldsEnabled(false);
    state.banned = false;
    return;
  }

  btn.textContent = `${user.email} · çıkış yap`;
  btn.className = "btn ghost block";
  $("#authState").textContent = "";
  hint.textContent = "";
  hint.classList.remove("error");

  const player = await fetchPlayer(user.uid);
  if (player?.banned) {
    state.banned = true;
    setFieldsEnabled(false);
    hint.textContent = "Bu hesap yönetici tarafından kapatıldı. Sorular için yöneticine yaz.";
    hint.classList.add("error");
    return;
  }

  state.banned = false;
  setFieldsEnabled(true);
  if (player) {
    $("#playerName").value = player.name || user.displayName || "";
    $("#playerClass").value = player.className || "";
    setTeam(player.team || "");
    $("#playerNo").value = await fetchOwnSchoolNo(user.uid);
  } else {
    $("#playerName").value = user.displayName || "";
  }
}

async function onGoogleClick() {
  const hint = $("#loginHint");
  hint.classList.remove("error");
  if (state.user) {
    await signOutUser();
    state.profile = null;
    return;
  }
  hint.textContent = "Google penceresi açılıyor…";
  try {
    await signInWithGoogle();
    hint.textContent = "";
  } catch (err) {
    hint.textContent = "Google girişi tamamlanamadı. Açılır pencereye izin verip tekrar dene.";
    hint.classList.add("error");
    console.warn(err);
  }
}

async function validateLogin(event) {
  event.preventDefault();
  const hint = $("#loginHint");
  const nameInput = $("#playerName");
  const classInput = $("#playerClass");
  const noInput = $("#playerNo");

  if (!state.user) {
    hint.textContent = "Önce Google ile giriş yap.";
    hint.classList.add("error");
    return;
  }
  if (state.banned) return;

  const name = nameInput.value.trim().replace(/\s+/g, " ");
  const className = classInput.value.trim().replace(/\s+/g, " ").toLocaleUpperCase("tr-TR");
  const no = noInput.value.trim();

  [nameInput, classInput, noInput].forEach((el) => el.removeAttribute("aria-invalid"));

  if (name.length < 2) {
    nameInput.setAttribute("aria-invalid", "true");
    hint.textContent = "Lütfen adını ve soyadını yaz.";
    hint.classList.add("error");
    nameInput.focus();
    return;
  }
  if (!className || className.length > 12) {
    classInput.setAttribute("aria-invalid", "true");
    hint.textContent = "Sınıfını yaz (örneğin 11-A).";
    hint.classList.add("error");
    classInput.focus();
    return;
  }
  if (!/^\d{1,12}$/.test(no)) {
    noInput.setAttribute("aria-invalid", "true");
    hint.textContent = "Okul numarası yalnızca rakamlardan oluşmalı.";
    hint.classList.add("error");
    noInput.focus();
    return;
  }
  const team = document.querySelector('input[name="team"]:checked')?.value || "";
  if (!TEAMS[team]) {
    hint.textContent = "Takımını seç: Gürbüz Team ya da Süleyman Team.";
    hint.classList.add("error");
    return;
  }

  const consent = $("#consentBox");
  if (consent && !consent.checked) {
    hint.textContent = "Devam etmek için gizlilik iznini işaretle.";
    hint.classList.add("error");
    consent.focus();
    return;
  }

  hint.textContent = "Kaydediliyor…";
  hint.classList.remove("error");

  const flagged = nameIsBad(name);
  const saved = await savePlayerProfile(state.user.uid, {
    name,
    className,
    schoolNo: no,
    team,
    nameFlagged: flagged,
  });

  if (!saved.ok) {
    hint.textContent =
      `Hesap kaydedilemedi (${saved.code}). Sayfayı tam yenileyip (Ctrl+F5) tekrar dene; ` +
      "sürerse bu kodu yöneticine ilet.";
    hint.classList.add("error");
    return;
  }

  state.profile = { uid: state.user.uid, name, className, schoolNo: no, team };
  store.set(KEYS.profile, { name, className, schoolNo: no, team });
  hint.textContent = "";

  if (flagged) toast("Bu isim sıralamada görünmeyecek; yönetici inceleyecek.", 3200);

  startRound();
}

// ---------- Tur ----------

function startRound() {
  const bank = loadBank();
  if (!bank.length) {
    toast("Soru bankası boş. Yönetim panelinden soru ekle.");
    showView("login");
    return;
  }

  const size = Math.max(1, Math.min(Number(settings.roundSize) || 12, bank.length));
  state.questions = shuffle(bank).slice(0, size);
  state.index = 0;
  state.score = 0;
  state.correct = 0;
  state.answered = false;

  $("#scoreChip").hidden = false;
  $("#scoreChip").textContent = "0 puan";
  showView("quiz");
  renderQuestion();
}

function renderQuestion() {
  const q = state.questions[state.index];
  if (!q) return finishRound();

  state.answered = false;

  const card = $("#questionCard");
  card.style.animation = "none";
  void card.offsetWidth;
  card.style.animation = "";

  $("#qCategory").textContent = q.category || "Yazım kuralları";
  $("#qText").textContent = q.question;
  $("#progressLabel").textContent = `Soru ${state.index + 1} / ${state.questions.length}`;
  $("#explain").hidden = true;
  $("#verdict").textContent = "";
  $("#verdict").className = "verdict";
  $("#explainText").textContent = "";

  const last = state.index === state.questions.length - 1;
  $("#nextBtn").textContent = last ? "Sonuçları gör" : "Sonraki soru";

  updateProgress();

  const optionsBox = $("#qOptions");
  optionsBox.textContent = "";
  optionsBox.classList.toggle("two", q.options.length === 2);

  const options = shuffle(
    q.options.map((text) => ({ text, isCorrect: text === q.answer }))
  );

  const buttons = options.map(({ text }) => {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "option";
    btn.dataset.value = text;

    const label = document.createElement("span");
    label.textContent = text;

    const mark = document.createElement("span");
    mark.className = "mark";
    mark.setAttribute("aria-hidden", "true");

    btn.append(label, mark);
    btn.addEventListener("click", () => selectOption(btn, text, q));
    optionsBox.append(btn);
    return btn;
  });

  state.buttons = buttons;

  updateScoreLine();
  startTimer();

  $("#qText").setAttribute("tabindex", "-1");
}

function updateProgress() {
  const total = state.questions.length || 1;
  const done = state.index + (state.answered ? 1 : 0);
  const pct = Math.round((done / total) * 100);
  $("#progressFill").style.width = `${pct}%`;
  const bar = $("#progressBar");
  bar.setAttribute("aria-valuenow", String(pct));
  bar.setAttribute("aria-valuetext", `${done} / ${total} soru`);
}

function updateScoreLine() {
  const chip = $("#scoreChip");
  chip.textContent = `${state.score} puan`;
  $("#quizScore").textContent = `Puan: ${state.score} · Doğru: ${state.correct}`;
}

// ---------- Süre ----------

function stopTimer() {
  clearInterval(state.timer);
  state.timer = 0;
}

function updateTimerUi() {
  const left = Math.max(0, state.timeLeft);
  const text = $("#timerText");
  const bar = $("#timerBar");
  const pill = $("#timerPill");
  if (text) text.textContent = `${left} sn`;
  if (bar) {
    // Yeni soruda çubuk anında dolsun; sonraki saniyeler yumuşak azalsın.
    bar.style.transition = left === QUESTION_SECONDS ? "none" : "";
    bar.style.width = `${(left / QUESTION_SECONDS) * 100}%`;
  }
  if (pill) pill.classList.toggle("low", left <= 3);
}

function startTimer() {
  stopTimer();
  state.timeLeft = QUESTION_SECONDS;
  updateTimerUi();
  state.timer = setInterval(() => {
    state.timeLeft -= 1;
    updateTimerUi();
    if (state.timeLeft <= 0) {
      stopTimer();
      timeoutQuestion();
    }
  }, 1000);
}

function timeoutQuestion() {
  if (state.answered) return;
  const q = state.questions[state.index];
  if (!q) return;

  state.answered = true;

  for (const b of state.buttons) {
    b.disabled = true;
    if (b.dataset.value === q.answer) {
      b.classList.add("correct");
      b.querySelector(".mark").textContent = "✓";
    } else {
      b.classList.add("dimmed");
    }
  }

  updateScoreLine();
  updateProgress();
  showFeedback(false);

  const verdict = $("#verdict");
  verdict.textContent = "Süre doldu. Doğrusu: " + q.answer;
  verdict.className = "verdict bad";
  $("#explainText").textContent = q.explanation || "";
  $("#explain").hidden = false;
  $("#nextBtn").focus({ preventScroll: true });

  clearTimeout(state.feedbackTimer);
  state.feedbackTimer = setTimeout(hideFeedback, 2100);
}

function selectOption(btn, text, q) {
  if (state.answered) return;
  state.answered = true;
  stopTimer();

  const isCorrect = text === q.answer;
  if (isCorrect) {
    state.score += Number(settings.pointsPerCorrect) || 10;
    state.correct += 1;
  }

  for (const b of state.buttons) {
    b.disabled = true;
    if (b.dataset.value === q.answer) {
      b.classList.add("correct");
      b.querySelector(".mark").textContent = "✓";
    } else if (b === btn) {
      b.classList.add("wrong");
      b.querySelector(".mark").textContent = "✕";
    } else {
      b.classList.add("dimmed");
    }
  }

  updateScoreLine();
  updateProgress();
  showFeedback(isCorrect);
  showExplanation(isCorrect, q);

  const hold = isCorrect ? 1500 : 2100;
  clearTimeout(state.feedbackTimer);
  state.feedbackTimer = setTimeout(hideFeedback, hold);
}

function showExplanation(isCorrect, q) {
  const block = $("#explain");
  const verdict = $("#verdict");

  verdict.textContent = isCorrect
    ? "Tam isabet. +" + (Number(settings.pointsPerCorrect) || 10) + " puan."
    : "Kırmızı kalem. Doğrusu: " + q.answer;
  verdict.className = "verdict " + (isCorrect ? "good" : "bad");
  $("#explainText").textContent = q.explanation || "";
  block.hidden = false;

  $("#nextBtn").focus({ preventScroll: true });
}

// ---------- Görsel geri bildirim ----------

const feedback = $("#feedback");
const feedbackCard = $("#feedbackCard");
const feedbackImg = $("#feedbackImg");
const feedbackCaption = $("#feedbackCaption");

// Eski varsayılan görseller tarayıcılarda kayıtlı kalmış olabilir; yenisine çevrilir.
const LEGACY_IMAGES = {
  "assets/correct.svg": defaultSettings.correctImage,
  "assets/wrong.svg": defaultSettings.wrongImage,
};

function upgradeImage(src) {
  return LEGACY_IMAGES[src] || src;
}

// Doğru ya da yanlış için listedeki görsellerden rastgele biri seçilir.
function pickImage(isCorrect) {
  const list = isCorrect ? settings.correctImages : settings.wrongImages;
  const pool = Array.isArray(list) ? list.filter(Boolean).map(upgradeImage) : [];
  if (pool.length) return pool[Math.floor(Math.random() * pool.length)];
  return upgradeImage(
    isCorrect
      ? settings.correctImage || defaultSettings.correctImage
      : settings.wrongImage || defaultSettings.wrongImage
  );
}

function showFeedback(isCorrect) {
  const src = pickImage(isCorrect);

  feedbackCard.classList.toggle("good", isCorrect);
  feedbackCard.classList.toggle("bad", !isCorrect);

  const fallback = isCorrect ? defaultSettings.correctImage : defaultSettings.wrongImage;
  feedbackImg.alt = isCorrect ? "Doğru cevap görseli" : "Yanlış cevap görseli";
  feedbackImg.onerror = () => {
    feedbackImg.onerror = null;
    feedbackImg.src = fallback;
  };
  feedbackImg.src = src;

  feedbackCaption.textContent = isCorrect ? "Tam isabet!" : "Kırmızı kalem!";

  feedback.hidden = false;
  requestAnimationFrame(() => {
    requestAnimationFrame(() => feedback.classList.add("show"));
  });
}

function hideFeedback() {
  clearTimeout(state.feedbackTimer);
  feedback.classList.remove("show");
  setTimeout(() => {
    if (!feedback.classList.contains("show")) feedback.hidden = true;
  }, 320);
}

// ---------- Tur sonu ----------

function nextQuestion() {
  if (!state.answered) return;
  stopTimer();
  hideFeedback();
  state.index += 1;
  if (state.index >= state.questions.length) finishRound();
  else renderQuestion();
}

function finishRound() {
  stopTimer();
  const total = state.questions.length || 0;
  const wrong = Math.max(total - state.correct, 0);
  const pct = total ? Math.round((state.correct / total) * 100) : 0;

  $("#resScore").textContent = String(state.score);
  $("#resCorrect").textContent = String(state.correct);
  $("#resWrong").textContent = String(wrong);
  $("#resPct").textContent = `${pct}%`;

  let msg = "Kırmızı kalem bugün biraz yoruldu. Bir sayfa daha, kurallar oturacak.";
  if (pct >= 90) msg = "Kalemine sağlık. Bu sayfada düzeltecek tek harf yok.";
  else if (pct >= 70) msg = "Çok iyi. Birkaç boşluk daha yerine otursun, tam puan senin.";
  else if (pct >= 50) msg = "Yolun yarısı geçti. Açıklamaları bir kez daha oku, fark hemen görünür.";

  $("#resMsg").textContent = msg;
  $("#scoreChip").hidden = false;
  $("#scoreChip").textContent = `${state.score} puan`;
  showView("result");

  const result = {
    name: state.profile?.name || "Öğrenci",
    className: state.profile?.className || "-",
    schoolNo: state.profile?.schoolNo || "-",
    uid: state.profile?.uid || "",
    mode: "kisisel",
    team: state.profile?.team || "",
    score: state.score,
    correct: state.correct,
    total,
    percent: pct,
    at: new Date().toISOString(),
  };

  const list = store.get(KEYS.results, []);
  const arr = Array.isArray(list) ? list : [];
  arr.unshift(result);
  store.set(KEYS.results, arr.slice(0, 300));

  // Okul numarası yalnızca players/{uid}/private/info içinde tutulur; ortak
  // sonuç kaydına gitmez. Kural alanı istediği için "-" yazılır.
  saveResultToFirebase({ ...result, schoolNo: "-" }).then((saved) => {
    if (saved) console.info("Sonuç Firebase'e kaydedildi.");
  });

  showRoundTotals(result);
}

async function showRoundTotals(result) {
  const line = $("#resTotals");
  if (!result.uid) {
    line.textContent = "Puanın kaydedilmedi: bu oturumda Google hesabı yok.";
    return;
  }

  const local = localProgress(result.uid, todayKey());
  line.textContent = `Bugün ${local.today} puan · Toplam ${local.total} puan`;

  const progress = await saveRound(state.profile, {
    score: result.score,
    correct: result.correct,
    total: result.total,
  });
  line.textContent =
    `Bugün ${progress.today} puan · Toplam ${progress.total} puan` +
    (progress.remote ? "" : " (yalnızca bu tarayıcıda)");
}

// ---------- Genel sıralama ----------

// Ad soyadı kısaltır: "Yusuf Önal" -> "Yusuf Ö."
function maskName(name) {
  const parts = String(name || "").trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return "Öğrenci";
  if (parts.length === 1) return parts[0];
  const last = parts[parts.length - 1];
  return `${parts[0]} ${last[0].toLocaleUpperCase("tr-TR")}.`;
}

async function loadBoard() {
  const list = $("#boardList");
  list.textContent = "";
  const loading = document.createElement("li");
  loading.className = "board-empty";
  loading.textContent = "Yükleniyor…";
  list.append(loading);

  const rows = await fetchPlayerTable(10);
  list.textContent = "";
  if (rows === null) {
    $("#boardCount").textContent = "";
    const li = document.createElement("li");
    li.className = "board-empty";
    li.textContent = "Sıralama şu an yüklenemedi.";
    list.append(li);
    return;
  }

  $("#boardCount").textContent = rows.length ? `İlk ${rows.length}` : "";

  if (!rows.length) {
    const li = document.createElement("li");
    li.className = "board-empty";
    li.textContent = "Sayfa boş. İlk satırı sen yaz.";
    list.append(li);
    return;
  }

  const day = todayKey();
  rows.forEach((row, index) => {
    const li = document.createElement("li");

    const rank = document.createElement("span");
    rank.className = "board-rank";
    rank.textContent = String(index + 1);

    const who = document.createElement("div");
    who.className = "board-who";
    const team = TEAMS[row.team];
    if (team) {
      const avatar = document.createElement("img");
      avatar.className = "board-avatar";
      avatar.src = team.img;
      avatar.alt = team.name;
      avatar.title = team.name;
      avatar.width = 36;
      avatar.height = 36;
      who.append(avatar);
    }
    const text = document.createElement("div");
    text.style.minWidth = "0";
    const name = document.createElement("span");
    name.className = "board-name";
    name.textContent = maskName(row.name);
    const sub = document.createElement("span");
    sub.className = "board-sub";
    const parts = [];
    if (team) parts.push(team.name);
    if (row.className) parts.push(row.className);
    parts.push(`Bugün ${Number(row.days?.[day]?.score) || 0} puan`);
    sub.textContent = parts.join(" · ");
    text.append(name, sub);
    who.append(text);

    const pts = document.createElement("span");
    pts.className = "board-pts";
    pts.textContent = `${row.total} puan`;

    li.append(rank, who, pts);
    list.append(li);
  });
}

// ---------- Olaylar ----------

function bindEvents() {
  $("#loginForm").addEventListener("submit", validateLogin);
  $("#googleBtn").addEventListener("click", onGoogleClick);

  $("#nextBtn").addEventListener("click", nextQuestion);

  $("#quitBtn").addEventListener("click", () => {
    stopTimer();
    clearTimeout(state.feedbackTimer);
    hideFeedback();
    showView("login");
    fillLogin();
    loadBoard();
    toast("Tur kaydedilmeden kapatıldı.", 1800);
  });

  $("#againBtn").addEventListener("click", () => {
    stopTimer();
    startRound();
  });
  $("#homeBtn").addEventListener("click", () => {
    stopTimer();
    showView("login");
    fillLogin();
    loadBoard();
  });

  feedback.addEventListener("click", (event) => {
    if (event.target.closest("[data-dismiss]")) hideFeedback();
  });

  document.addEventListener("keydown", (event) => {
    if (!feedback.hidden && (event.key === "Escape" || event.key === "Enter")) {
      hideFeedback();
    }
  });
}

function fillLogin() {
  refreshAuthUi();
}

// ---------- Başlat ----------

function init() {
  store.set(KEYS.settings, settings);
  bindEvents();
  showView("login");
  setFieldsEnabled(false);

  observeAuth((user) => {
    state.user = user;
    state.profile = null;
    refreshAuthUi();
  });
  loadBoard();

  // Yöneticinin seçtiği ortak görsel listesi (bütün öğrencilerde aynı).
  fetchVisuals().then((shared) => {
    if (!shared) return;
    if (Array.isArray(shared.correctImages) && shared.correctImages.length) {
      settings.correctImages = shared.correctImages;
    }
    if (Array.isArray(shared.wrongImages) && shared.wrongImages.length) {
      settings.wrongImages = shared.wrongImages;
    }
  });
}

init();
