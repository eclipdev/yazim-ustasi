// İsim filtresi: küfür, hakaret ve troll kalıplarını yakalar.
// Yakalanan hesap sıralamada görünmez (flagged); yönetici panelinden
// bayrak kaldırılabilir. Bu bir ön filtredir, her kelimeyi yakalayamaz.

const SHORT_WORDS = ["amk", "aq", "sik", "siki", "got", "gotu", "yarrak", "yarak", "pic"];
const CONTAINS = [
  "orospu", "piç", "pic", "sikerim", "sikik", "siktir", "amina", "amcık", "ibne", "yarak",
  "gerizekal", "fuck", "shit", "bitch", "nigg", "faggot", "hitler", "pussy",
];

function normalize(text) {
  return String(text || "")
    .toLocaleLowerCase("tr-TR")
    .replace(/ı/g, "i")
    .replace(/ğ/g, "g")
    .replace(/ş/g, "s")
    .replace(/ö/g, "o")
    .replace(/ü/g, "u")
    .replace(/ç/g, "c")
    .replace(/â/g, "a")
    .replace(/î/g, "i")
    .replace(/û/g, "u")
    .replace(/0/g, "o")
    .replace(/1/g, "i")
    .replace(/3/g, "e")
    .replace(/4/g, "a")
    .replace(/5/g, "s")
    .replace(/7/g, "t")
    .replace(/@/g, "a")
    .replace(/\$/g, "s")
    .replace(/[^a-z\s]/g, "");
}

export function nameIsBad(name) {
  const plain = normalize(name);
  if (!plain) return false;
  const compact = plain.replace(/\s+/g, "");
  if (CONTAINS.some((w) => compact.includes(normalize(w)))) return true;
  return plain
    .split(/\s+/)
    .some((token) => SHORT_WORDS.includes(token));
}
