// Firebase — isteğe bağlı katman.
// Panelden bir Firebase web yapılandırması girilirse, her tur sonucu
// Firestore'daki "results" koleksiyonuna eklenir. Yapılandırma yoksa
// uygulama sorunsuz biçimde localStorage ile çalışmaya devam eder.

import { store, KEYS } from "./store.js";

const SDK_VERSION = "10.14.1";
const APP_URL = `https://www.gstatic.com/firebasejs/${SDK_VERSION}/firebase-app.js`;
const FS_URL = `https://www.gstatic.com/firebasejs/${SDK_VERSION}/firebase-firestore.js`;

let cached = null;
let failed = false;

// Panelde yapılandırma değişince bağlantıyı sıfırlar.
export function resetFirebaseCache() {
  cached = null;
  failed = false;
}

export function getFirebaseConfig() {
  const cfg = store.get(KEYS.firebase, null);
  if (!cfg || typeof cfg !== "object") return null;
  if (!cfg.apiKey || !cfg.projectId) return null;
  return cfg;
}

export function firebaseStatus() {
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
    cached = { fs: fsMod, db };
    return cached;
  } catch (err) {
    console.warn("Firebase başlatılamadı:", err);
    failed = true;
    return null;
  }
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
    await fs.getDocs(fs.query(fs.collection(db, "results"), fs.limit(1)));
    return { ok: true, message: "Bağlantı başarılı." };
  } catch (err) {
    return { ok: false, message: err?.message || "Bağlantı başarısız." };
  }
}
