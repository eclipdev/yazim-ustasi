// Yazım Ustası — yönetim paneli

import {
  defaultQuestions,
  defaultSettings,
  defaultAdminPassword,
  defaultAdminPasswordHash,
} from "./data.js";
import { store, KEYS } from "./store.js";
import { todayKey } from "./progress.js";
import { TEAMS } from "./teams.js";
import {
  testFirebase,
  firebaseStatus,
  fetchRemoteResults,
  fetchStudentTable,
  observeAuth,
  signInWithGoogle,
  signOutUser,
  setPlayerFlags,
  isAdminUser,
  fetchVisuals,
  saveVisuals,
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
function imageList(list, single) {
  if (Array.isArray(list) && list.length) return [...list];
  return [single || defaultSettings.correctImage];
}

const pending = {
  correctList: imageList(settings.correctImages, settings.correctImage),
  wrongList: imageList(settings.wrongImages, settings.wrongImage),
};

// Yeni görseller önce büyük dosyalar yüzünden taşmasın diye toplam boyut sınırı.
const IMAGE_TOTAL_LIMIT = 4 * 1024 * 1024;

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

const TAB_IDS = ["settings", "questions", "results", "players", "firebase"];

function showTab(name) {
  TAB_IDS.forEach((tab) => {
    const panel = $(`#tab-${tab}`);
    const btn = $(`#tabbtn-${tab}`);
    const active = tab === name;
    if (panel) panel.hidden = !active;
    if (btn) btn.setAttribute("aria-selected", active ? "true" : "false");
  });

  if (name === "results") renderLocalResults();
  if (name === "players") loadPlayers();
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

const SIDES = {
  correct: { listKey: "correctList", listEl: "#correctList", urlEl: "#correctUrl", fileEl: "#correctFile", addEl: "#correctAddUrl", resetEl: "#correctReset", fallback: defaultSettings.correctImage, label: "Doğru" },
  wrong: { listKey: "wrongList", listEl: "#wrongList", urlEl: "#wrongUrl", fileEl: "#wrongFile", addEl: "#wrongAddUrl", resetEl: "#wrongReset", fallback: defaultSettings.wrongImage, label: "Yanlış" },
};

function totalPendingBytes() {
  return [...pending.correctList, ...pending.wrongList].reduce((sum, src) => sum + src.length, 0);
}

function renderList(side) {
  const cfg = SIDES[side];
  const wrap = $(cfg.listEl);
  wrap.textContent = "";
  pending[cfg.listKey].forEach((src, index) => {
    const figure = document.createElement("figure");
    figure.className = "thumb";
    const img = document.createElement("img");
    img.alt = `${cfg.label} görseli ${index + 1}`;
    img.src = src;
    img.onerror = () => {
      img.onerror = null;
      figure.classList.add("broken");
      figure.title = "Bu bağlantı açılmadı; GIF ya da görselin doğrudan adresi olmalı.";
      img.src = cfg.fallback;
    };
    const remove = document.createElement("button");
    remove.type = "button";
    remove.textContent = "✕";
    remove.setAttribute("aria-label", `${index + 1}. görseli kaldır`);
    remove.addEventListener("click", () => {
      pending[cfg.listKey].splice(index, 1);
      renderList(side);
    });
    figure.append(img, remove);
    wrap.append(figure);
  });
}

function addToList(side, src) {
  const cfg = SIDES[side];
  pending[cfg.listKey].push(src);
  renderList(side);
}

function readImageFile(file) {
  return new Promise((resolve, reject) => {
    if (!file.type.startsWith("image/")) {
      reject(new Error("Lütfen bir görsel dosyası seç."));
      return;
    }
    if (file.size > IMAGE_FILE_LIMIT) {
      reject(new Error(`“${file.name}” 1,5 MB'tan büyük.`));
      return;
    }
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error("Dosya okunamadı."));
    reader.readAsDataURL(file);
  });
}

function bindSide(side) {
  const cfg = SIDES[side];

  renderList(side);

  $(cfg.addEl).addEventListener("click", () => {
    const value = $(cfg.urlEl).value.trim();
    if (!value) {
      toast("Önce bir görsel bağlantısı yapıştır.");
      return;
    }
    if (!/^https:\/\//i.test(value) && !/^assets\//i.test(value)) {
      toast("Bağlantı https:// ile başlamalı.", 2800);
      return;
    }
    addToList(side, value);
    $(cfg.urlEl).value = "";
    setStatus($("#imageStatus"), "Bağlantı listeye eklendi. Kaydetmeyi unutma.", "ok");
  });

  $(cfg.resetEl).addEventListener("click", () => {
    pending[cfg.listKey] = [cfg.fallback];
    renderList(side);
    setStatus($("#imageStatus"), `${cfg.label} görselleri varsayılana döndü. Kaydetmeyi unutma.`, "ok");
  });
}

async function loadSharedVisuals() {
  const shared = await fetchVisuals();
  if (!shared) return;
  if (Array.isArray(shared.correctImages) && shared.correctImages.length) {
    pending.correctList = [...shared.correctImages];
  }
  if (Array.isArray(shared.wrongImages) && shared.wrongImages.length) {
    pending.wrongList = [...shared.wrongImages];
  }
  renderList("correct");
  renderList("wrong");
}

function bindVisuals() {
  bindSide("correct");
  bindSide("wrong");
  loadSharedVisuals();

  $("#saveVisuals").addEventListener("click", async () => {
    const status = $("#imageStatus");
    if (!isAdminUser(adminUser)) {
      setStatus(status, "Kaydetmek için önce Oyuncular sekmesinden yönetici Google girişi yap.", "err");
      return;
    }
    const correctImages = pending.correctList.filter((src) => !src.startsWith("data:"));
    const wrongImages = pending.wrongList.filter((src) => !src.startsWith("data:"));
    setStatus(status, "Kaydediliyor…");
    const result = await saveVisuals({ correctImages, wrongImages });
    if (!result.ok) {
      setStatus(status, `Kaydedilemedi (${result.code}).`, "err");
      return;
    }
    settings = {
      ...settings,
      correctImages,
      wrongImages,
      correctImage: correctImages[0] || defaultSettings.correctImage,
      wrongImage: wrongImages[0] || defaultSettings.wrongImage,
    };
    store.set(KEYS.settings, settings);
    setStatus(status, "Görseller kaydedildi; bütün öğrencilerde görünecek.", "ok");
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
  bindPlayers();
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

// ---------- Oyuncular (Google yönetici girişi + gizle/banla) ----------

let adminUser = null;

function renderAdminWho() {
  const who = $("#adminWho");
  const btn = $("#adminSignIn");
  if (!adminUser) {
    who.textContent = "Girilmedi";
    btn.textContent = "Google ile giriş yap";
    return;
  }
  who.textContent = isAdminUser(adminUser) ? `Yönetici: ${adminUser.email}` : `Yetkisiz: ${adminUser.email}`;
  btn.textContent = "Çıkış yap";
}

function bindPlayers() {
  observeAuth((user) => {
    adminUser = user;
    renderAdminWho();
  });

  $("#adminSignIn").addEventListener("click", async () => {
    const status = $("#adminStatus");
    if (adminUser) {
      await signOutUser();
      setStatus(status, "Çıkış yapıldı.", "ok");
      return;
    }
    try {
      const user = await signInWithGoogle();
      if (!isAdminUser(user)) {
        await signOutUser();
        setStatus(status, "Bu Google hesabı yönetici değil. Yetkili hesapla giriş yap.", "err");
      } else {
        setStatus(status, "Yönetici girişi tamam.", "ok");
      }
    } catch (err) {
      console.warn(err);
      setStatus(status, "Google girişi tamamlanamadı.", "err");
    }
  });

  $("#loadPlayers").addEventListener("click", loadPlayers);
}

function requireAdmin(status) {
  if (isAdminUser(adminUser)) return true;
  setStatus(status, "Önce yönetici Google hesabıyla giriş yap.", "err");
  return false;
}

async function loadPlayers() {
  const status = $("#playersStatus");
  const wrap = $("#playerWrap");
  setStatus(status, "Yükleniyor…");
  const rows = await fetchStudentTable(300);
  if (rows === null) {
    setStatus(status, "Oyuncular okunamadı. Firestore kurallarını ve bağlantıyı kontrol et.", "err");
    return;
  }

  $("#playerCount").textContent = `${rows.length} hesap`;
  wrap.textContent = "";

  if (!rows.length) {
    const empty = document.createElement("div");
    empty.className = "empty";
    empty.textContent = "Henüz hesap yok.";
    wrap.append(empty);
    setStatus(status, "");
    return;
  }

  const table = document.createElement("table");
  table.className = "results";
  const head = document.createElement("thead");
  const headRow = document.createElement("tr");
  ["Ad Soyad", "Sınıf", "Takım", "No", "Toplam", "Durum", "İşlem"].forEach((label) => {
    const th = document.createElement("th");
    th.textContent = label;
    headRow.append(th);
  });
  head.append(headRow);
  table.append(head);

  const body = document.createElement("tbody");
  rows.forEach((row) => {
    const tr = document.createElement("tr");

    const cells = [row.name || "—", row.className || "—", TEAMS[row.team]?.name || "—", row.schoolNo || "—", String(row.total)];
    cells.forEach((value, i) => {
      const td = document.createElement("td");
      if (i === 4) td.className = "num";
      td.textContent = value;
      tr.append(td);
    });

    const stateCell = document.createElement("td");
    const tags = [];
    if (row.banned) tags.push("Yasaklı");
    if (row.flagged) tags.push("Gizli");
    stateCell.textContent = tags.length ? tags.join(" · ") : "Açık";
    tr.append(stateCell);

    const actions = document.createElement("td");
    const flagBtn = document.createElement("button");
    flagBtn.type = "button";
    flagBtn.className = "btn ghost small";
    flagBtn.textContent = row.flagged ? "Göster" : "Gizle";
    flagBtn.dataset.uid = row.uid;
    flagBtn.dataset.action = "flag";
    flagBtn.dataset.value = row.flagged ? "false" : "true";

    const banBtn = document.createElement("button");
    banBtn.type = "button";
    banBtn.className = row.banned ? "btn ghost small" : "btn danger small";
    banBtn.textContent = row.banned ? "Yasağı kaldır" : "Banla";
    banBtn.dataset.uid = row.uid;
    banBtn.dataset.action = "ban";
    banBtn.dataset.value = row.banned ? "false" : "true";
    banBtn.dataset.name = row.name || "Bu hesap";

    actions.append(flagBtn, " ", banBtn);
    tr.append(actions);
    body.append(tr);
  });
  table.append(body);
  wrap.append(table);
  setStatus(status, "Liste güncellendi.", "ok");
}

async function applyPlayerAction(button) {
  const status = $("#playersStatus");
  if (!requireAdmin(status)) return;
  const value = button.dataset.value === "true";
  const field = button.dataset.action === "ban" ? "banned" : "flagged";

  if (field === "banned" && value) {
    if (!confirm(`${button.dataset.name} hesabı banlansın mı? Hesap puan kazanamaz ve giriş yapamaz.`)) return;
  }

  setStatus(status, "Kaydediliyor…");
  const result = await setPlayerFlags(button.dataset.uid, { [field]: value });
  if (!result.ok) {
    setStatus(status, result.message, "err");
    return;
  }
  await loadPlayers();
}

document.addEventListener("click", (event) => {
  const btn = event.target.closest("#playerWrap button[data-action]");
  if (btn) applyPlayerAction(btn);
});
