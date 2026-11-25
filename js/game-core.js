// Doğru Yazarım İyi Oynarım — oyun kuralları (arayüzden bağımsız)
//
// Kurallar (TÜBİTAK 4006 proje belgesi):
// - Tahtada 30 kare var; oyuncular sırayla kart çeker.
// - Doğru cevap: bir kare ilerle.
// - Yanlış cevap: ceza kartı çek. Ceza kartını doğru bilirsen yerinde kalırsın,
//   bilemezsen bir kare geri gidersin.
// - 30. kareye ilk ulaşan oyunu kazanır.

import { CATEGORIES, MIXED_ID } from "./data.js";

export const MAX_SQUARE = 30;

export const PLAYER_COLORS = [
  { key: "mavi", ink: "#2f5fbf", wash: "rgba(47, 95, 191, 0.14)" },
  { key: "kirmizi", ink: "#b03a2e", wash: "rgba(176, 58, 46, 0.14)" },
  { key: "yesil", ink: "#2e7d4f", wash: "rgba(46, 125, 79, 0.14)" },
  { key: "mor", ink: "#6d4aa8", wash: "rgba(109, 74, 168, 0.14)" },
];

// Aynı sorunun iki oyuncuya art arda gelmemesi için soruların imzası tutulur.
export function questionKey(question) {
  if (!question) return "";
  const options = Array.isArray(question.options) ? question.options.join("¦") : "";
  return `${question.category || ""}¦${options}`;
}

const TEAM_KEYS = ["gurbuz", "suleyman", "takim3", "takim4"];

export function createGame({ names, board, mode = "kisi", at = new Date().toISOString() }) {
  const clean = names
    .map((name) => String(name || "").trim().replace(/\s+/g, " "))
    .filter(Boolean)
    .slice(0, 4);

  if (clean.length < 2) throw new Error("Oyun için en az iki oyuncu gerekir.");

  const teamMode = mode === "takim";

  return {
    version: 1,
    id: `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`,
    at,
    mode: teamMode ? "takim" : "kisi",
    board: Array.isArray(board) && board.length === MAX_SQUARE ? board : null,
    turn: 0,
    players: clean.map((name, index) => ({
      name: name.slice(0, 28),
      color: PLAYER_COLORS[index].key,
      team: teamMode ? TEAM_KEYS[index] || "" : "",
      pos: 0,
      correct: 0,
      wrong: 0,
      escapes: 0,
    })),
    used: [],
    penaltyUsed: [],
    cards: 0,
    penaltyCards: 0,
    over: false,
    winner: null,
    resultSaved: false,
  };
}

export function currentPlayer(game) {
  return game.players[game.turn];
}

// Oyuncunun sıradaki karesi (1..30). 0 konumu henüz tahtaya girmediği anlamına gelir.
export function nextSquare(game) {
  return Math.min(currentPlayer(game).pos + 1, MAX_SQUARE);
}

export function categoryForSquare(board, square) {
  if (!Array.isArray(board) || square < 1 || square > board.length) return null;
  return board[square - 1];
}

// Kategorisi uyan, daha önce kullanılmamış bir soru seçer.
// Kategori tükendiyse aynı kategorideki sorular yeniden kullanılır;
// "sürpriz" karede deste tümüyle karıştırılır.
// Tahtadaki kare kimliği ("karisik") ile karttaki kategori etiketi
// ("Yazımı karıştırılanlar") farklı yazılabildiği için üçünü de kabul et.
function categoryMatches(question, category) {
  const info = CATEGORIES[category];
  if (!info) return question.category === category;
  return [category, info.name, info.label].includes(question.category);
}

export function pickQuestion({ bank, category, used = [], rng = Math.random }) {
  const pool = (bank || []).filter((question) => {
    if (!question || !Array.isArray(question.options) || typeof question.answer !== "string") {
      return false;
    }
    if (!question.options.includes(question.answer)) return false;
    if (category == null || category === MIXED_ID) return true;
    return categoryMatches(question, category);
  });

  if (!pool.length) return null;

  const usedSet = new Set(used);
  const fresh = pool.filter((question) => !usedSet.has(questionKey(question)));
  const list = fresh.length ? fresh : pool;
  return list[Math.floor(rng() * list.length)] || null;
}

export function markUsed(list, question, limit = 400) {
  const key = questionKey(question);
  if (!key || list.includes(key)) return;
  list.push(key);
  if (list.length > limit) list.splice(0, list.length - limit);
}

// Doğru ya da yanlış cevabı işler. Yanlışta ceza aşamasına geçilir.
export function answerBoard(game, isCorrect) {
  const player = currentPlayer(game);
  game.cards += 1;

  if (isCorrect) {
    player.correct += 1;
    player.pos = Math.min(player.pos + 1, MAX_SQUARE);
    if (player.pos >= MAX_SQUARE) {
      game.over = true;
      game.winner = game.turn;
    }
    return { isCorrect, moved: 1, needsPenalty: false, won: game.over };
  }

  player.wrong += 1;
  return { isCorrect, moved: 0, needsPenalty: true, won: false };
}

// Ceza kartının sonucu: doğruysa yerinde kalır, yanlışsa bir kare geri gider.
export function answerPenalty(game, isCorrect) {
  const player = currentPlayer(game);
  game.penaltyCards += 1;

  if (isCorrect) {
    player.escapes += 1;
    return { isCorrect, moved: 0 };
  }

  player.pos = Math.max(0, player.pos - 1);
  return { isCorrect, moved: -1 };
}

export function endTurn(game) {
  if (game.over) return;
  game.turn = (game.turn + 1) % game.players.length;
}

export function saveGameResult(game) {
  // Panel ve isteğe bağlı Firebase için oyuncu başına bir sonuç satırı.
  return game.players.map((player, index) => {
    const total = player.correct + player.wrong;
    const percent = total ? Math.round((player.correct / total) * 100) : 0;
    return {
      name: player.name,
      className: `${game.players.length} ${game.mode === "takim" ? "takımlı" : "oyunculu"}`,
      mode: game.mode === "takim" ? "takim" : "kisi",
      team: player.team || "",
      schoolNo: "-",
      uid: "",
      score: player.correct * 10,
      correct: player.correct,
      total,
      percent,
      at: game.at,
      gameId: game.id,
      winner: game.winner === index,
      position: player.pos,
      penalties: player.wrong,
      escapes: player.escapes,
    };
  });
}

export function isValidGame(value) {
  if (!value || typeof value !== "object") return false;
  if (value.version !== 1) return false;
  if (!Array.isArray(value.players) || value.players.length < 2 || value.players.length > 4) {
    return false;
  }
  if (!Number.isInteger(value.turn) || value.turn < 0 || value.turn >= value.players.length) {
    return false;
  }
  return value.players.every(
    (player) =>
      player &&
      typeof player.name === "string" &&
      Number.isInteger(player.pos) &&
      player.pos >= 0 &&
      player.pos <= MAX_SQUARE
  );
}
