// Yazım Ustası — uygulama mantığı

import { defaultQuestions, defaultSettings } from "./data.js";
import { store, KEYS } from "./store.js";
import { saveResultToFirebase } from "./firebase.js";

const $ = (sel, root = document) => root.querySelector(sel);

const settings = { ...defaultSettings, ...(store.get(KEYS.settings, {}) || {}) };

const state = {
  profile: null,
  questions: [],
  index: 0,
  score: 0,
  correct: 0,
  answered: false,
  feedbackTimer: 0,
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

function applyTheme(theme, announce = false) {
  const root = document.documentElement;
  if (theme === "auto") delete root.dataset.theme;
  else root.dataset.theme = theme;

  const btn = $("#themeToggle");
  const label =
    theme === "auto" ? "otomatik" : theme === "light" ? "açık" : "koyu";
  btn.setAttribute("aria-label", `Tema: ${label}. Değiştirmek için dokun.`);
  btn.title = `Tema: ${label}`;

  if (announce) toast(`Tema: ${label}`, 1400);
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

// ---------- Giriş ----------

function fillLogin() {
  const profile = store.get(KEYS.profile, null);
  if (!profile) return;
  if (profile.name) $("#playerName").value = profile.name;
  if (profile.schoolNo) $("#playerNo").value = profile.schoolNo;
}

function validateLogin(event) {
  event.preventDefault();
  const nameInput = $("#playerName");
  const noInput = $("#playerNo");
  const name = nameInput.value.trim().replace(/\s+/g, " ");
  const no = noInput.value.trim();
  const hint = $("#loginHint");

  nameInput.removeAttribute("aria-invalid");
  noInput.removeAttribute("aria-invalid");

  if (name.length < 2) {
    nameInput.setAttribute("aria-invalid", "true");
    hint.textContent = "Lütfen adını ve soyadını yaz.";
    hint.classList.add("error");
    nameInput.focus();
    return;
  }

  if (!/^\d{1,12}$/.test(no)) {
    noInput.setAttribute("aria-invalid", "true");
    hint.textContent = "Okul numarası yalnızca rakamlardan oluşmalı.";
    hint.classList.add("error");
    noInput.focus();
    return;
  }

  const consent = $("#consentBox");
  if (consent && !consent.checked) {
    hint.textContent = "Devam etmek için gizlilik iznini işaretle.";
    hint.classList.add("error");
    consent.focus();
    return;
  }

  hint.textContent = "";
  hint.classList.remove("error");

  state.profile = { name, schoolNo: no };
  store.set(KEYS.profile, state.profile);
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

  // odak, ekran okuyucular için soruya taşınır ama görünür halka oluşmaz
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

function selectOption(btn, text, q) {
  if (state.answered) return;
  state.answered = true;

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

  // doğru yanıtta kısa, yanlışta öğrenmek için biraz daha uzun kal
  const hold = isCorrect ? 1500 : 2100;
  clearTimeout(state.feedbackTimer);
  state.feedbackTimer = setTimeout(hideFeedback, hold);
}

function showExplanation(isCorrect, q) {
  const block = $("#explain");
  const verdict = $("#verdict");

  verdict.textContent = isCorrect
    ? "Doğru! +" + (Number(settings.pointsPerCorrect) || 10) + " puan."
    : "Yanlış — doğrusu: " + q.answer;
  verdict.className = "verdict " + (isCorrect ? "good" : "bad");
  $("#explainText").textContent = q.explanation || "";
  block.hidden = false;

  // Açıklama görünür olduğunda odak "Sonraki soru"da olsun
  $("#nextBtn").focus({ preventScroll: true });
}

// ---------- Görsel geri bildirim ----------

const feedback = $("#feedback");
const feedbackCard = $("#feedbackCard");
const feedbackImg = $("#feedbackImg");
const feedbackCaption = $("#feedbackCaption");

function showFeedback(isCorrect) {
  const src = isCorrect
    ? settings.correctImage || defaultSettings.correctImage
    : settings.wrongImage || defaultSettings.wrongImage;

  feedbackCard.classList.toggle("good", isCorrect);
  feedbackCard.classList.toggle("bad", !isCorrect);

  const fallback = isCorrect ? defaultSettings.correctImage : defaultSettings.wrongImage;
  feedbackImg.alt = isCorrect ? "Doğru cevap görseli" : "Yanlış cevap görseli";
  feedbackImg.onerror = () => {
    feedbackImg.onerror = null;
    feedbackImg.src = fallback;
  };
  feedbackImg.src = src;

  feedbackCaption.textContent = isCorrect
    ? "Doğru!"
    : "Yanlış — doğrusunu öğren.";

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
  hideFeedback();
  state.index += 1;
  if (state.index >= state.questions.length) finishRound();
  else renderQuestion();
}

function finishRound() {
  const total = state.questions.length || 0;
  const wrong = Math.max(total - state.correct, 0);
  const pct = total ? Math.round((state.correct / total) * 100) : 0;

  $("#resScore").textContent = String(state.score);
  $("#resCorrect").textContent = String(state.correct);
  $("#resWrong").textContent = String(wrong);
  $("#resPct").textContent = `${pct}%`;

  let msg = "Tekrar denemeye değer — kurallar aklında kaldıkça hızlanacaksın.";
  if (pct >= 90) msg = "Kusursuz! TDK yazım kurallarına hâkimsin.";
  else if (pct >= 70) msg = "Çok iyi. Birkaç ayrıntı daha ve tam isabet.";
  else if (pct >= 50) msg = "İyi gidiyorsun. Açıklamaları tekrar oku, fark hemen görünecek.";

  $("#resMsg").textContent = msg;
  $("#scoreChip").hidden = false;
  $("#scoreChip").textContent = `${state.score} puan`;
  showView("result");

  const result = {
    name: state.profile?.name || "Öğrenci",
    schoolNo: state.profile?.schoolNo || "-",
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

  saveResultToFirebase(result).then((saved) => {
    if (saved) console.info("Sonuç Firebase'e kaydedildi.");
  });
}

// ---------- Olaylar ----------

function bindEvents() {
  $("#loginForm").addEventListener("submit", validateLogin);

  $("#nextBtn").addEventListener("click", nextQuestion);

  $("#quitBtn").addEventListener("click", () => {
    clearTimeout(state.feedbackTimer);
    hideFeedback();
    showView("login");
    fillLogin();
    toast("Tur kaydedilmeden kapatıldı.", 1800);
  });

  $("#againBtn").addEventListener("click", startRound);
  $("#homeBtn").addEventListener("click", () => {
    showView("login");
    fillLogin();
  });

  // Görsel katmanına tıklayınca erken kapanır
  feedback.addEventListener("click", (event) => {
    if (event.target.closest("[data-dismiss]")) hideFeedback();
  });

  // Enter / boşluk ile geri bildirimi geç
  document.addEventListener("keydown", (event) => {
    if (!feedback.hidden && (event.key === "Escape" || event.key === "Enter")) {
      hideFeedback();
    }
  });

  $("#themeToggle").addEventListener("click", () => {
    const current = store.get(KEYS.theme, "auto");
    const next = current === "auto" ? "light" : current === "light" ? "dark" : "auto";
    store.set(KEYS.theme, next);
    applyTheme(next, true);
  });
}

// ---------- Başlat ----------

function init() {
  store.set(KEYS.settings, settings);
  applyTheme(store.get(KEYS.theme, "auto"));
  bindEvents();
  fillLogin();
  showView("login");
}

init();
