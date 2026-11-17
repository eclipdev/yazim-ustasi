// Yazım Ustası — yönetim paneli

import {
  defaultQuestions,
  defaultSettings,
  defaultAdminPassword,
  defaultAdminPasswordHash,
} from "./data.js";
import { store, KEYS } from "./store.js";
import { todayKey } from "./progress.js";
import {
  testFirebase,
  firebaseStatus,
  fetchRemoteResults,
  fetchStudentTable,
  resetFirebaseCache,
  DEFAULT_FIREBASE_CONFIG,
} from "./firebase.js";

const $ = (sel, root = document) => root.querySelector(sel);

const IMAGE_FILE_LIMIT = 1.5 * 1024 * 1024; // 1,5 MB

// ---------- Yardımcılar ----------

function toast(message, ms = 2400) {
  const el = $("#toast");
  el.textContent = message;
  el.classList.add("show");
  clearTimeout(toast._t);
  toast._t = setTimeout(() => el.classList.remove("show"), ms);
}

function setStatus(el, text, kind = "") {
  el.textContent = text;
  el.classList.remove("ok", "err");
  if (kind) el.classList.add(kind);
}

function download(filename, text) {
  const blob = new Blob([text], { type: "application/json;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.append(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function applyTheme(theme, announce = false) {
  const root = document.documentElement;
  if (theme === "auto") delete root.dataset.theme;
  else root.dataset.theme = theme;

  const btn = $("#themeToggle");
  const label = theme === "auto" ? "otomatik" : theme === "light" ? "açık" : "koyu";
  btn.setAttribute("aria-label", `Tema: ${label}. Değiştirmek için dokun.`);
  if (announce) toast(`Tema: ${label}`, 1400);
}

// ---------- Durum ----------

let settings = { ...defaultSettings, ...(store.get(KEYS.settings, {}) || {}) };
const pending = {
  correctImage: settings.correctImage || defaultSettings.correctImage,
  wrongImage: settings.wrongImage || defaultSettings.wrongImage,
};

// ---------- Şifre kapısı ----------

const FAIL_KEY = "yazim.adminFailures";
const LOCK_KEY = "yazim.adminLock";

async function sha256Hex(text) {
  try {
    const data = new TextEncoder().encode(text);
    const digest = await crypto.subtle.digest("SHA-256", data);
    return [...new Uint8Array(digest)]
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");
  } catch {
    return null;
  }
}

// Şifre düz metin saklanmaz. Eski düz metin kayıtları ilk başarılı girişte hash'e taşınır.
async function passwordMatches(input) {
  const stored = store.get(KEYS.adminPass, null);

  if (stored === null) {
    const hash = await sha256Hex(input);
    if (hash) return hash === defaultAdminPasswordHash;
    return input === defaultAdminPassword;
  }

  if (stored === input) {
    const hash = await sha256Hex(input);
    if (hash) store.set(KEYS.adminPass, hash);
    return true;
  }

  if (/^[a-f0-9]{64}$/i.test(String(stored))) {
    const hash = await sha256Hex(input);
    return hash !== null && hash === String(stored).toLowerCase();
  }

  return false;
}

async function setPassword(newPassword) {
  const hash = await sha256Hex(newPassword);
  store.set(KEYS.adminPass, hash || newPassword);
}

function lockSecondsLeft() {
  const until = Number(store.sessionGet(LOCK_KEY) || 0);
  if (!Number.isFinite(until) || until <= Date.now()) return 0;
  return Math.ceil((until - Date.now()) / 1000);
}

function recordFailure() {
  const failures = Number(store.sessionGet(FAIL_KEY) || 0) + 1;
  if (failures >= 5) {
    store.sessionSet(LOCK_KEY, String(Date.now() + 30000));
    store.sessionSet(FAIL_KEY, "0");
  } else {
    store.sessionSet(FAIL_KEY, String(failures));
  }
}

function clearFailures() {
  store.sessionSet(FAIL_KEY, "0");
  store.sessionSet(LOCK_KEY, "0");
}

function unlockPanel() {
  $("#gate").hidden = true;
  $("#panel").hidden = false;
  hydrate();
}

function bindGate() {
  $("#gateForm").addEventListener("submit", async (event) => {
    event.preventDefault();
    const input = $("#gatePass");
    const hint = $("#gateHint");

    const wait = lockSecondsLeft();
    if (wait > 0) {
      hint.textContent = `Çok fazla deneme. ${wait} saniye sonra tekrar dene.`;
      hint.classList.add("error");
      return;
    }

    if (await passwordMatches(input.value)) {
      clearFailures();
      store.sessionSet(KEYS.adminUnlocked, "1");
      hint.textContent = "";
      hint.classList.remove("error");
      input.removeAttribute("aria-invalid");
      unlockPanel();
    } else {
      recordFailure();
      const locked = lockSecondsLeft();
      hint.textContent = locked
        ? `Çok fazla yanlış deneme. ${locked} saniye sonra tekrar dene.`
        : "Şifre yanlış. İlk şifre: kaptan";
      hint.classList.add("error");
      input.setAttribute("aria-invalid", "true");
      input.select();
    }
  });
}

// ---------- Sekmeler ----------

const TAB_IDS = ["settings", "questions", "results", "firebase"];

function showTab(name) {
  TAB_IDS.forEach((tab) => {
    const panel = $(`#tab-${tab}`);
    const btn = $(`#tabbtn-${tab}`);
    const active = tab === name;
    if (panel) panel.hidden = !active;
    if (btn) btn.setAttribute("aria-selected", active ? "true" : "false");
  });

  if (name === "results") renderLocalResults();
  if (name === "firebase") refreshFirebaseUi();
}

function bindTabs() {
  document.querySelectorAll(".segmented [role='tab']").forEach((btn) => {
    btn.addEventListener("click", () => showTab(btn.dataset.tab));
  });

  // klavye ile sekme gezinme
  document.querySelector(".segmented").addEventListener("keydown", (event) => {
    if (event.key !== "ArrowRight" && event.key !== "ArrowLeft") return;
    const tabs = [...document.querySelectorAll(".segmented [role='tab']")];
    const current = tabs.findIndex((t) => t.getAttribute("aria-selected") === "true");
    const delta = event.key === "ArrowRight" ? 1 : -1;
    const next = (current + delta + tabs.length) % tabs.length;
    tabs[next].focus();
    showTab(tabs[next].dataset.tab);
    event.preventDefault();
  });
}

// ---------- Görseller ----------

function previewImage(imgEl, src) {
  imgEl.onerror = () => {
    imgEl.onerror = null;
    imgEl.src = imgEl.id === "previewCorrect" ? defaultSettings.correctImage : defaultSettings.wrongImage;
  };
  imgEl.src = src;
}

function updatePreviews() {
  previewImage($("#previewCorrect"), pending.correctImage);
  previewImage($("#previewWrong"), pending.wrongImage);
}

function readImageFile(file, targetKey, inputEl) {
  if (!file) return;
  if (!file.type.startsWith("image/")) {
    toast("Lütfen bir görsel dosyası seç.");
    return;
  }
  if (file.size > IMAGE_FILE_LIMIT) {
    toast("Görsel 1,5 MB'tan büyük. Daha küçük bir dosya seç.");
    inputEl.value = "";
    return;
  }

  const reader = new FileReader();
  reader.onload = () => {
    pending[targetKey] = String(reader.result);
    updatePreviews();
    setStatus($("#imageStatus"), `“${file.name}” yüklendi. Kaydetmeyi unutma.`, "ok");
  };
  reader.onerror = () => toast("Dosya okunamadı.");
  reader.readAsDataURL(file);
}

function bindVisuals() {
  $("#correctUrl").value = settings.correctImage?.startsWith("data:") ? "" : settings.correctImage || "";
  $("#wrongUrl").value = settings.wrongImage?.startsWith("data:") ? "" : settings.wrongImage || "";
  updatePreviews();

  $("#correctUrl").addEventListener("input", (event) => {
    const value = event.target.value.trim();
    pending.correctImage = value || defaultSettings.correctImage;
    previewImage($("#previewCorrect"), pending.correctImage);
  });

  $("#wrongUrl").addEventListener("input", (event) => {
    const value = event.target.value.trim();
    pending.wrongImage = value || defaultSettings.wrongImage;
    previewImage($("#previewWrong"), pending.wrongImage);
  });

  $("#correctFile").addEventListener("change", (event) =>
    readImageFile(event.target.files?.[0], "correctImage", event.target)
  );
  $("#wrongFile").addEventListener("change", (event) =>
    readImageFile(event.target.files?.[0], "wrongImage", event.target)
  );

  $("#correctReset").addEventListener("click", () => {
    pending.correctImage = defaultSettings.correctImage;
    $("#correctUrl").value = defaultSettings.correctImage;
    $("#correctFile").value = "";
    previewImage($("#previewCorrect"), pending.correctImage);
  });

  $("#wrongReset").addEventListener("click", () => {
    pending.wrongImage = defaultSettings.wrongImage;
    $("#wrongUrl").value = defaultSettings.wrongImage;
    $("#wrongFile").value = "";
    previewImage($("#previewWrong"), pending.wrongImage);
  });

  $("#saveVisuals").addEventListener("click", () => {
    settings = {
      ...settings,
      correctImage: pending.correctImage,
      wrongImage: pending.wrongImage,
    };
    const ok = store.set(KEYS.settings, settings);
    if (!ok) {
      toast("Kaydedilemedi — görsel çok büyük olabilir. Daha küçük bir dosya dene.");
      return;
    }
    setStatus($("#imageStatus"), "Görseller kaydedildi.", "ok");
    toast("Görseller kaydedildi.");
  });
}

// ---------- Tur ayarları ----------

function bindRound() {
  $("#roundSize").value = String(settings.roundSize ?? defaultSettings.roundSize);
  $("#pointsPerCorrect").value = String(
    settings.pointsPerCorrect ?? defaultSettings.pointsPerCorrect
  );

  $("#saveRound").addEventListener("click", () => {
    const roundSize = Number($("#roundSize").value);
    const points = Number($("#pointsPerCorrect").value);

    if (!Number.isFinite(roundSize) || roundSize < 1 || roundSize > 100) {
      setStatus($("#roundStatus"), "Tur başına soru 1 ile 100 arasında olmalı.", "err");
      return;
    }
    if (!Number.isFinite(points) || points < 1 || points > 1000) {
      setStatus($("#roundStatus"), "Puan 1 ile 1000 arasında olmalı.", "err");
      return;
    }

    settings = { ...settings, roundSize: Math.round(roundSize), pointsPerCorrect: Math.round(points) };
    store.set(KEYS.settings, settings);
    setStatus($("#roundStatus"), "Tur ayarları kaydedildi.", "ok");
    toast("Tur ayarları kaydedildi.");
  });
}

// ---------- Yönetici şifresi ----------

function bindPassword() {
  $("#savePass").addEventListener("click", async () => {
    const current = $("#passCurrent").value;
    const next = $("#passNew").value;

    if (!(await passwordMatches(current))) {
      setStatus($("#passStatus"), "Mevcut şifre yanlış.", "err");
      return;
    }
    if (next.length < 4) {
      setStatus($("#passStatus"), "Yeni şifre en az 4 karakter olmalı.", "err");
      return;
    }

    await setPassword(next);
    $("#passCurrent").value = "";
    $("#passNew").value = "";
    setStatus($("#passStatus"), "Şifre değiştirildi.", "ok");
    toast("Yönetici şifresi değiştirildi.");
  });
}

// ---------- Sorular ----------

function validateBank(value) {
  if (!Array.isArray(value)) return { error: "Kök değer bir dizi (array) olmalı." };
  if (value.length === 0) return { error: "En az bir soru olmalı." };

  for (let i = 0; i < value.length; i++) {
    const q = value[i];
    const where = `${i + 1}. soru`;
    if (!q || typeof q !== "object") return { error: `${where}: geçersiz kayıt.` };
    if (typeof q.question !== "string" || !q.question.trim())
      return { error: `${where}: "question" boş olamaz.` };
    if (!Array.isArray(q.options) || q.options.length < 2)
      return { error: `${where}: en az iki seçenek gerekli.` };
    if (!q.options.every((o) => typeof o === "string" && o.trim()))
      return { error: `${where}: seçenekler boş olamaz.` };
    if (new Set(q.options).size !== q.options.length)
      return { error: `${where}: seçenekler birbirinden farklı olmalı.` };
    if (typeof q.answer !== "string" || !q.options.includes(q.answer))
      return { error: `${where}: "answer" seçeneklerden biriyle birebir aynı olmalı.` };
  }

  return { questions: value };
}

function currentBankFromEditor() {
  try {
    return JSON.parse($("#questionsEditor").value);
  } catch (err) {
    return null;
  }
}

function updateQuestionStatus() {
  const status = $("#questionStatus");
  const count = $("#questionCount");
  const editor = $("#questionsEditor");
  const raw = editor.value.trim();

  if (!raw) {
    editor.classList.remove("invalid");
    setStatus(status, "Soru bankası boş. Varsayılanlar kullanılacak.", "");
    count.textContent = "0 soru";
    return null;
  }

  let parsed;
  try {
    parsed = JSON.parse(raw);
  } catch (err) {
    editor.classList.add("invalid");
    setStatus(status, "JSON okunamadı: " + err.message, "err");
    count.textContent = "—";
    return null;
  }

  const result = validateBank(parsed);
  if (result.error) {
    editor.classList.add("invalid");
    setStatus(status, result.error, "err");
    count.textContent = "—";
    return null;
  }

  editor.classList.remove("invalid");
  setStatus(status, "JSON geçerli.", "ok");
  count.textContent = `${parsed.length} soru`;
  return parsed;
}

function loadQuestionsEditor() {
  const custom = store.get(KEYS.questions, null);
  const bank = Array.isArray(custom) && custom.length ? custom : defaultQuestions;
  $("#questionsEditor").value = JSON.stringify(bank, null, 2);
  updateQuestionStatus();
}

function bindQuestions() {
  loadQuestionsEditor();

  $("#questionsEditor").addEventListener("input", updateQuestionStatus);

  $("#saveQuestions").addEventListener("click", () => {
    const parsed = updateQuestionStatus();
    if (!parsed) {
      toast("Kaydedilmedi — JSON geçersiz.");
      return;
    }
    store.set(KEYS.questions, parsed);
    toast(`Soru bankası kaydedildi (${parsed.length} soru).`);
  });

  $("#addQuestion").addEventListener("click", () => {
    let bank = currentBankFromEditor();
    if (!Array.isArray(bank)) bank = [...defaultQuestions];

    bank.push({
      category: "Yazımı karıştırılanlar",
      question: "Doğru yazımı seç.",
      options: ["yanlış yazım", "doğru yazım"],
      answer: "doğru yazım",
      explanation: "Kısa kural açıklaması.",
    });

    $("#questionsEditor").value = JSON.stringify(bank, null, 2);
    updateQuestionStatus();
    $("#questionsEditor").scrollTop = $("#questionsEditor").scrollHeight;
    toast("Şablon eklendi. Metni düzenleyip kaydet.");
  });

  $("#exportQuestions").addEventListener("click", () => {
    const parsed = updateQuestionStatus();
    if (!parsed) {
      toast("Geçerli JSON yok, indirilemedi.");
      return;
    }
    download("sorular.json", JSON.stringify(parsed, null, 2));
  });

  $("#importQuestions").addEventListener("change", (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      $("#questionsEditor").value = String(reader.result);
      const parsed = updateQuestionStatus();
      toast(parsed ? "Dosya yüklendi. Kaydetmeyi unutma." : "Dosyadaki JSON geçersiz.");
    };
    reader.readAsText(file);
    event.target.value = "";
  });

  $("#resetQuestions").addEventListener("click", () => {
    if (!confirm("Soru bankası varsayılanlara dönsün mü? Mevcut düzenlemeler kaybolacak.")) return;
    store.remove(KEYS.questions);
    $("#questionsEditor").value = JSON.stringify(defaultQuestions, null, 2);
    updateQuestionStatus();
    toast("Soru bankası varsayılanlara döndü.");
  });
}

// ---------- Sonuçlar ----------

function formatDate(iso) {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleString("tr-TR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function renderTable(list, sourceLabel = "Bu tarayıcı") {
  const wrap = $("#resultsWrap");
  wrap.textContent = "";

  $("#resultCount").textContent = `${list.length} kayıt`;

  if (!list.length) {
    const empty = document.createElement("div");
    empty.className = "empty";
    empty.textContent = `Henüz kayıt yok (${sourceLabel}).`;
    wrap.append(empty);
    return;
  }

  const table = document.createElement("table");
  table.className = "results";

  const thead = document.createElement("thead");
  const headRow = document.createElement("tr");
  ["Tarih", "Ad Soyad", "Okul No", "Puan", "Doğru", "Toplam", "Başarı"].forEach((label) => {
    const th = document.createElement("th");
    th.scope = "col";
    th.textContent = label;
    headRow.append(th);
  });
  thead.append(headRow);
  table.append(thead);

  const tbody = document.createElement("tbody");
  list.forEach((row) => {
    const tr = document.createElement("tr");

    const cells = [
      formatDate(row.at || row.createdAt?.toDate?.()?.toISOString?.() || null),
      row.name || "—",
      row.schoolNo || "—",
      String(row.score ?? 0),
      String(row.correct ?? 0),
      String(row.total ?? 0),
      `${row.percent ?? 0}%`,
    ];

    cells.forEach((value, index) => {
      const td = document.createElement("td");
      if (index >= 3) td.className = "num";
      td.textContent = value;
      tr.append(td);
    });

    tbody.append(tr);
  });

  table.append(tbody);
  wrap.append(table);
}

function renderLocalResults() {
  const list = store.get(KEYS.results, []);
  renderTable(Array.isArray(list) ? list : [], "bu tarayıcı");
}

function renderScoreTable(rows) {
  const wrap = $("#scoreWrap");
  const count = $("#scoreCount");
  wrap.textContent = "";
  count.textContent = `${rows.length} öğrenci`;

  if (!rows.length) {
    const empty = document.createElement("div");
    empty.className = "empty";
    empty.textContent = "Henüz puan kaydı yok.";
    wrap.append(empty);
    return;
  }

  const day = todayKey();
  const table = document.createElement("table");
  table.className = "results";
  const head = document.createElement("thead");
  const headRow = document.createElement("tr");
  ["Sıra", "Ad Soyad", "Okul no", "Bugün", "Toplam"].forEach((label) => {
    const th = document.createElement("th");
    th.textContent = label;
    headRow.append(th);
  });
  head.append(headRow);
  table.append(head);

  const body = document.createElement("tbody");
  rows.forEach((row, index) => {
    const tr = document.createElement("tr");
    const today = Number(row.days?.[day]?.score) || 0;
    [index + 1, row.name || "—", row.schoolNo, today, row.total].forEach((value) => {
      const td = document.createElement("td");
      td.textContent = String(value);
      tr.append(td);
    });
    body.append(tr);
  });
  table.append(body);
  wrap.append(table);
}

function bindResults() {
  $("#loadScores").addEventListener("click", async () => {
    const status = $("#scoreStatus");
    setStatus(status, "Tablo yükleniyor…");
    const rows = await fetchStudentTable(200);
    if (rows === null) {
      setStatus(status, "Yüklenemedi. Firebase bağlantısını ve Firestore kurallarını kontrol et.", "err");
      return;
    }
    renderScoreTable(rows);
    setStatus(status, "Tablo güncellendi.", "ok");
  });

  $("#refreshResults").addEventListener("click", () => {
    renderLocalResults();
    setStatus($("#resultsStatus"), "Yenilendi.", "ok");
  });

  $("#clearResults").addEventListener("click", () => {
    if (!confirm("Bu tarayıcıdaki tüm sonuç kayıtları silinsin mi? Bu işlem geri alınamaz.")) return;
    store.remove(KEYS.results);
    renderLocalResults();
    setStatus($("#resultsStatus"), "Yerel kayıtlar silindi.", "ok");
  });

  $("#pullFirebase").addEventListener("click", async () => {
    const status = $("#resultsStatus");
    setStatus(status, "Firebase'den çekiliyor…");
    const rows = await fetchRemoteResults(100);
    if (rows === null) {
      setStatus(
        status,
        "Çekilemedi. Önce Firebase bağlantısını kaydet; okuma kapalıysa Firestore kurallarında read izni gerekir.",
        "err"
      );
      return;
    }
    const normalized = rows.map((r) => ({
      ...r,
      at: r.at || (r.createdAt?.toDate ? r.createdAt.toDate().toISOString() : null),
    }));
    renderTable(normalized, "Firebase");
    setStatus(status, `${normalized.length} kayıt Firebase'den alındı.`, "ok");
  });
}

// ---------- Firebase ----------

function refreshFirebaseUi() {
  const saved = store.get(KEYS.firebase, null);
  const badge = $("#firebaseBadge");
  const status = firebaseStatus();

  if (status.ready) {
    badge.textContent = status.label;
    badge.className = "badge ok";
  } else if (saved && saved.disabled) {
    badge.textContent = "Kapatıldı";
    badge.className = "badge off";
  } else {
    badge.textContent = "Yapılandırılmadı";
    badge.className = "badge off";
  }

  if (saved && saved.disabled) {
    $("#firebaseEditor").value = "";
  } else if (!document.activeElement || document.activeElement.id !== "firebaseEditor") {
    $("#firebaseEditor").value = JSON.stringify(saved || DEFAULT_FIREBASE_CONFIG, null, 2);
  }
}

function bindFirebase() {
  $("#saveFirebase").addEventListener("click", () => {
    const raw = $("#firebaseEditor").value.trim();
    const status = $("#firebaseStatus");

    if (!raw) {
      store.set(KEYS.firebase, { disabled: true });
      resetFirebaseCache();
      refreshFirebaseUi();
      setStatus(status, "Bağlantı kaldırıldı.", "ok");
      toast("Firebase bağlantısı kaldırıldı.");
      return;
    }

    let cfg;
    try {
      cfg = JSON.parse(raw);
    } catch (err) {
      setStatus(status, "JSON okunamadı: " + err.message, "err");
      return;
    }

    if (typeof cfg !== "object" || !cfg.apiKey || !cfg.projectId) {
      setStatus(status, "Yapılandırmada apiKey ve projectId bulunmalı.", "err");
      return;
    }

    store.set(KEYS.firebase, cfg);
    resetFirebaseCache();
    refreshFirebaseUi();
    setStatus(status, "Kaydedildi. Bağlantıyı test edebilirsin.", "ok");
    toast("Firebase yapılandırması kaydedildi.");
  });

  $("#testFirebaseBtn").addEventListener("click", async () => {
    const status = $("#firebaseStatus");
    setStatus(status, "Test ediliyor…");
    const result = await testFirebase();
    setStatus(status, result.message, result.ok ? "ok" : "err");
  });

  $("#clearFirebase").addEventListener("click", () => {
    store.set(KEYS.firebase, { disabled: true });
    resetFirebaseCache();
    $("#firebaseEditor").value = "";
    refreshFirebaseUi();
    setStatus($("#firebaseStatus"), "Bağlantı kaldırıldı.", "ok");
    toast("Firebase bağlantısı kaldırıldı.");
  });
}

// ---------- Başlat ----------

function bindTheme() {
  $("#themeToggle").addEventListener("click", () => {
    const current = store.get(KEYS.theme, "auto");
    const next = current === "auto" ? "light" : current === "light" ? "dark" : "auto";
    store.set(KEYS.theme, next);
    applyTheme(next, true);
  });
}

function hydrate() {
  bindVisuals();
  bindRound();
  bindPassword();
  bindQuestions();
  bindResults();
  bindFirebase();
  bindTabs();
  refreshFirebaseUi();
  showTab("settings");
}

function init() {
  applyTheme(store.get(KEYS.theme, "auto"));
  bindTheme();
  bindGate();

  if (store.sessionGet(KEYS.adminUnlocked) === "1") {
    unlockPanel();
  } else {
    $("#gate").hidden = false;
    $("#panel").hidden = true;
    setTimeout(() => $("#gatePass").focus(), 150);
  }
}

init();
