// Oyuncu puanları: her tur sonunda hesabın toplam ve günlük puanı.
// Önce Firestore'a (players/{uid}) yazılır; Firebase'e ulaşılamazsa
// aynı veriler bu tarayıcıda (localStorage) birikmeye devam eder.

import { store, KEYS } from "./store.js";
import { recordPlayerRound, fetchPlayerProgress } from "./firebase.js";

export function todayKey(date = new Date()) {
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${date.getFullYear()}-${m}-${d}`;
}

function readLedger() {
  const ledger = store.get(KEYS.ledger, {});
  return ledger && typeof ledger === "object" && !Array.isArray(ledger) ? ledger : {};
}

export function localProgress(uid, day = todayKey()) {
  const entry = readLedger()[uid];
  return {
    total: Number(entry?.total) || 0,
    today: Number(entry?.days?.[day]?.score) || 0,
  };
}

function addLocalRound(uid, profile, day, round) {
  const ledger = readLedger();
  const entry = ledger[uid] || { total: 0, days: {} };
  const dayEntry = entry.days?.[day] || { score: 0, correct: 0, total: 0, rounds: 0 };

  entry.name = profile.name;
  entry.total = (Number(entry.total) || 0) + round.score;
  dayEntry.score += round.score;
  dayEntry.correct += round.correct;
  dayEntry.total += round.total;
  dayEntry.rounds += 1;
  entry.days = { ...(entry.days || {}), [day]: dayEntry };

  ledger[uid] = entry;
  store.set(KEYS.ledger, ledger);
  return localProgress(uid, day);
}

// profile: { uid, name, ... } · round: { score, correct, total }
// Dönüş: { total, today, remote } — remote true ise veri Firebase'den okundu.
export async function saveRound(profile, round) {
  const day = todayKey();
  if (!profile?.uid) {
    return { total: 0, today: 0, remote: false };
  }
  const local = addLocalRound(profile.uid, profile, day, round);

  const wrote = await recordPlayerRound(profile.uid, { day, ...round });
  if (!wrote) return { ...local, remote: false };

  const remote = await fetchPlayerProgress(profile.uid, day);
  return remote ? { ...remote, remote: true } : { ...local, remote: false };
}
