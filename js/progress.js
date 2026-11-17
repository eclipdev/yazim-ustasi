// Öğrenci puanları: her tur sonunda okul numarasına göre toplam ve günlük puan.
// Önce Firestore'a (students/{okulNo}) yazılır; Firebase'e ulaşılamazsa
// aynı veriler bu tarayıcıda (localStorage) birikmeye devam eder.

import { store, KEYS } from "./store.js";
import { recordStudentRound, fetchStudentProgress } from "./firebase.js";

export function todayKey(date = new Date()) {
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${date.getFullYear()}-${m}-${d}`;
}

function readLedger() {
  const ledger = store.get(KEYS.ledger, {});
  return ledger && typeof ledger === "object" && !Array.isArray(ledger) ? ledger : {};
}

export function localProgress(schoolNo, day = todayKey()) {
  const entry = readLedger()[schoolNo];
  return {
    total: Number(entry?.total) || 0,
    today: Number(entry?.days?.[day]?.score) || 0,
  };
}

function addLocalRound(schoolNo, name, day, round) {
  const ledger = readLedger();
  const entry = ledger[schoolNo] || { name, total: 0, days: {} };
  const dayEntry = entry.days?.[day] || { score: 0, correct: 0, total: 0, rounds: 0 };

  entry.name = name;
  entry.total = (Number(entry.total) || 0) + round.score;
  dayEntry.score += round.score;
  dayEntry.correct += round.correct;
  dayEntry.total += round.total;
  dayEntry.rounds += 1;
  entry.days = { ...(entry.days || {}), [day]: dayEntry };

  ledger[schoolNo] = entry;
  store.set(KEYS.ledger, ledger);
  return localProgress(schoolNo, day);
}

// round: { score, correct, total }
// Dönüş: { total, today, remote } — remote true ise veri Firebase'den okundu.
export async function saveRound(profile, round) {
  const day = todayKey();
  const { schoolNo, name } = profile;
  const local = addLocalRound(schoolNo, name, day, round);

  const wrote = await recordStudentRound({ schoolNo, name, day, ...round });
  if (!wrote) return { ...local, remote: false };

  const remote = await fetchStudentProgress(schoolNo, day);
  return remote ? { ...remote, remote: true } : { ...local, remote: false };
}
