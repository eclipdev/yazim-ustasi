// Firebase — isteğe bağlı katman (Google girişi + Firestore).
// Öğrenciler Google ile girer; puanlar hesabın uid'sine göre players/{uid}
// belgesinde birikir. Yapılandırma yoksa uygulama localStorage ile çalışır.

import { store, KEYS } from "./store.js";

const SDK_VERSION = "10.14.1";
const APP_URL = `https://www.gstatic.com/firebasejs/${SDK_VERSION}/firebase-app.js`;
const FS_URL = `https://www.gstatic.com/firebasejs/${SDK_VERSION}/firebase-firestore.js`;
const AUTH_URL = `https://www.gstatic.com/firebasejs/${SDK_VERSION}/firebase-auth.js`;

// Yönetici paneline Google ile girip oyuncuları yönetebilecek tek hesap.
// Güvenlik kuralları da aynı e-postayı kontrol eder (FIREBASE.md).
export const ADMIN_EMAIL = "eclipsoftware.dev@gmail.com";

// Projenin herkese açık Firebase web yapılandırması.
// Bu anahtarlar gizli değildir; güvenlik Firestore kurallarıyla sağlanır.
export const DEFAULT_FIREBASE_CONFIG = {
  apiKey: "AIzaSyANjKiQdsaQC66S2TAp8VgLmBhGpK1MqKI",
  authDomain: "tdk26-dd1b2.firebaseapp.com",
  databaseURL: "https://tdk26-dd1b2-default-rtdb.europe-west1.firebasedatabase.app",
  projectId: "tdk26-dd1b2",
  storageBucket: "tdk26-dd1b2.firebasestorage.app",
  messagingSenderId: "235445487544",
  appId: "1:235445487544:web:0ae69b8b44696a01b4314d",
  measurementId: "G-KR9G9BKJJD",
};

let cached = null;
let failed = false;
let authCache = null;

// Panelde yapılandırma değişince bağlantıyı sıfırlar.
export function resetFirebaseCache() {
  cached = null;
  failed = false;
  authCache = null;
}

export function getFirebaseConfig() {
  const saved = store.get(KEYS.firebase, null);
  if (saved === null) return DEFAULT_FIREBASE_CONFIG;
  if (saved && saved.disabled) return null;
  if (typeof saved !== "object") return null;
  if (!saved.apiKey || !saved.projectId) return null;
  return saved;
}

export function firebaseStatus() {
  const saved = store.get(KEYS.firebase, null);
  if (saved && saved.disabled) return { ready: false, label: "Kapatıldı" };
  const cfg = getFirebaseConfig();
  if (!cfg) return { ready: false, label: "Yapılandırılmadı" };
  return { ready: true, label: cfg.projectId };
}

async function getDb() {
  if (cached) return cached;
  if (failed) return null;
  const cfg = getFirebaseConfig();
  if (!cfg) return null;

  try {
    const [appMod, fsMod] = await Promise.all([import(APP_URL), import(FS_URL)]);
    const app = appMod.initializeApp(cfg);
    const db = fsMod.getFirestore(app);
    cached = { fs: fsMod, db, app };
    return cached;
  } catch (err) {
    console.warn("Firebase başlatılamadı:", err);
    failed = true;
    return null;
  }
}

async function getAuthHandle() {
  if (authCache) return authCache;
  const handle = await getDb();
  if (!handle) return null;
  try {
    const am = await import(AUTH_URL);
    authCache = { am, auth: am.getAuth(handle.app) };
    return authCache;
  } catch (err) {
    console.warn("Firebase Auth yüklenemedi:", err);
    return null;
  }
}

function plainUser(user) {
  if (!user) return null;
  return { uid: user.uid, email: user.email || "", displayName: user.displayName || "" };
}

// Oturum değişince cb(kullanıcı | null) çağrılır.
export async function observeAuth(cb) {
  const h = await getAuthHandle();
  if (!h) {
    cb(null);
    return;
  }
  h.am.onAuthStateChanged(h.auth, (user) => cb(plainUser(user)));
}

export async function signInWithGoogle() {
  const h = await getAuthHandle();
  if (!h) throw new Error("Firebase bağlantısı kurulamadı.");
  const provider = new h.am.GoogleAuthProvider();
  provider.setCustomParameters({ prompt: "select_account" });
  const cred = await h.am.signInWithPopup(h.auth, provider);
  return plainUser(cred.user);
}

export async function signOutUser() {
  const h = await getAuthHandle();
  if (h) await h.am.signOut(h.auth);
}

export function isAdminUser(user) {
  return !!user && (user.email || "").toLowerCase() === ADMIN_EMAIL;
}

export async function saveResultToFirebase(result) {
  const handle = await getDb();
  if (!handle) return false;
  try {
    const { fs, db } = handle;
    await fs.addDoc(fs.collection(db, "results"), {
      ...result,
      createdAt: fs.serverTimestamp(),
    });
    return true;
  } catch (err) {
    console.warn("Sonuç Firestore'a yazılamadı:", err);
    return false;
  }
}

export async function fetchRemoteResults(max = 50) {
  const handle = await getDb();
  if (!handle) return null;
  try {
    const { fs, db } = handle;
    const q = fs.query(
      fs.collection(db, "results"),
      fs.orderBy("createdAt", "desc"),
      fs.limit(max)
    );
    const snap = await fs.getDocs(q);
    return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
  } catch (err) {
    console.warn("Firestore sonuçları okunamadı:", err);
    return null;
  }
}

// Paneldeki "Bağlantıyı test et" düğmesi için.
export async function testFirebase() {
  const handle = await getDb();
  if (!handle) return { ok: false, message: "Yapılandırma yok ya da SDK yüklenemedi." };

  try {
    const { fs, db } = handle;
    await fs.addDoc(fs.collection(db, "results"), {
      name: "Bağlantı Testi",
      schoolNo: "-",
      score: 0,
      correct: 0,
      total: 0,
      percent: 0,
      at: new Date().toISOString(),
      source: "panel-test",
      createdAt: fs.serverTimestamp(),
    });
    return { ok: true, message: "Bağlantı başarılı — test kaydı Firestore'a yazıldı." };
  } catch (err) {
    const code = String(err?.code || "");
    if (code.includes("permission-denied")) {
      return {
        ok: false,
        message:
          "Firebase'e ulaşıldı ama Firestore kuralları yazmayı engelliyor. FIREBASE.md'deki kuralları yayınla.",
      };
    }
    return { ok: false, message: err?.message || "Bağlantı başarısız." };
  }
}

// ---------- Oyuncular (players/{uid}) ----------

export async function fetchPlayer(uid) {
  const handle = await getDb();
  if (!handle) return null;
  try {
    const { fs, db } = handle;
    const snap = await fs.getDoc(fs.doc(db, "players", uid));
    return snap.exists() ? snap.data() : null;
  } catch (err) {
    console.warn("Oyuncu okunamadı:", err);
    return null;
  }
}

// Profili oluşturur ya da günceller. Bayrak (flagged) bir kez açıldıysa
// yalnızca yönetici kaldırabilir; kurallar bunu zorlar.
export async function savePlayerProfile(uid, { name, className, schoolNo, nameFlagged }) {
  const handle = await getDb();
  if (!handle) return false;
  try {
    const { fs, db } = handle;
    const ref = fs.doc(db, "players", uid);
    const snap = await fs.getDoc(ref);
    const previouslyFlagged = snap.exists() && snap.data().flagged === true;
    const data = {
      uid,
      name,
      className,
      schoolNo,
      flagged: previouslyFlagged || !!nameFlagged,
      updatedAt: fs.serverTimestamp(),
    };
    if (!snap.exists()) {
      await fs.setDoc(ref, { ...data, banned: false, total: 0, days: {} });
    } else {
      await fs.setDoc(ref, data, { merge: true });
    }
    return true;
  } catch (err) {
    console.warn("Profil kaydedilemedi:", err);
    return false;
  }
}

export async function recordPlayerRound(uid, { day, score, correct, total }) {
  const handle = await getDb();
  if (!handle) return false;
  try {
    const { fs, db } = handle;
    await fs.setDoc(
      fs.doc(db, "players", uid),
      {
        total: fs.increment(score),
        updatedAt: fs.serverTimestamp(),
        days: {
          [day]: {
            score: fs.increment(score),
            correct: fs.increment(correct),
            total: fs.increment(total),
            rounds: fs.increment(1),
          },
        },
      },
      { merge: true }
    );
    return true;
  } catch (err) {
    console.warn("Tur puanı yazılamadı:", err);
    return false;
  }
}

export async function fetchPlayerProgress(uid, day) {
  const handle = await getDb();
  if (!handle) return null;
  try {
    const { fs, db } = handle;
    const snap = await fs.getDoc(fs.doc(db, "players", uid));
    if (!snap.exists()) return { total: 0, today: 0 };
    const data = snap.data();
    return {
      total: Number(data.total) || 0,
      today: Number(data.days?.[day]?.score) || 0,
    };
  } catch (err) {
    console.warn("Puan okunamadı:", err);
    return null;
  }
}

function mapPlayer(d) {
  const data = d.data();
  return {
    uid: String(data.uid ?? d.id),
    name: String(data.name ?? ""),
    className: String(data.className ?? ""),
    schoolNo: String(data.schoolNo ?? ""),
    total: Number(data.total) || 0,
    days: data.days || {},
    banned: data.banned === true,
    flagged: data.flagged === true,
  };
}

async function queryPlayers(max) {
  const handle = await getDb();
  if (!handle) return null;
  try {
    const { fs, db } = handle;
    const q = fs.query(fs.collection(db, "players"), fs.orderBy("total", "desc"), fs.limit(max));
    const snap = await fs.getDocs(q);
    return snap.docs.map(mapPlayer);
  } catch (err) {
    console.warn("Oyuncular okunamadı:", err);
    return null;
  }
}

// Ana ekran sıralaması: yasaklı ve isim filtresine takılmış hesaplar gizlenir.
export async function fetchPlayerTable(max = 10) {
  const rows = await queryPlayers(max * 4);
  if (rows === null) return null;
  return rows.filter((r) => !r.banned && !r.flagged && r.total > 0).slice(0, max);
}

// Yönetici paneli: bütün hesaplar, bayrakları ile birlikte.
export async function fetchStudentTable(max = 300) {
  return queryPlayers(max);
}

// Yönetici: bayrak/yasak güncellemesi. Yalnızca yönetici hesabıyla çalışır.
export async function setPlayerFlags(uid, patch) {
  const handle = await getDb();
  if (!handle) return { ok: false, message: "Firebase bağlantısı yok." };
  try {
    const { fs, db } = handle;
    await fs.updateDoc(fs.doc(db, "players", uid), patch);
    return { ok: true };
  } catch (err) {
    const code = String(err?.code || "");
    if (code.includes("permission-denied")) {
      return { ok: false, message: "Yetki yok: yönetici Google hesabıyla girili değil." };
    }
    return { ok: false, message: err?.message || "Güncellenemedi." };
  }
}
