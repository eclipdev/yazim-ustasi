// Basit depolama katmanı.
// Şimdilik her şey localStorage'da tutulur; Firebase yapılandırıldığında
// sonuçlar ayrıca Firestore'a da yazılır (bkz. firebase.js).

export const KEYS = {
  profile: "yazim.profile",
  settings: "yazim.settings",
  questions: "yazim.questions",
  penalties: "yazim.penalties",
  game: "yazim.game",
  names: "yazim.names",
  teamNames: "yazim.teamNames",
  mode: "yazim.mode",
  results: "yazim.results",
  ledger: "yazim.ledger",
  firebase: "yazim.firebase",
  theme: "yazim.theme",
  adminPass: "yazim.adminPass",
  adminUnlocked: "yazim.adminUnlocked",
};

function safeParse(raw) {
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export const store = {
  get(key, fallback = null) {
    try {
      const raw = localStorage.getItem(key);
      if (raw === null) return fallback;
      const value = safeParse(raw);
      return value === null ? fallback : value;
    } catch {
      return fallback;
    }
  },

  set(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch {
      return false;
    }
  },

  remove(key) {
    try {
      localStorage.removeItem(key);
    } catch {
      /* yoksay */
    }
  },

  sessionGet(key) {
    try {
      return sessionStorage.getItem(key);
    } catch {
      return null;
    }
  },

  sessionSet(key, value) {
    try {
      sessionStorage.setItem(key, value);
    } catch {
      /* yoksay */
    }
  },
};
