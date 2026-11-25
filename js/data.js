// Doğru Yazarım İyi Oynarım — oyun verisi
//
// Oyun, TÜBİTAK 4006 projesindeki kutu oyununun dijital sürümüdür:
// 30 karelik bir tahtada iki (ya da daha çok) oyuncu/takım yarışır.
// Her karede o karenin rengine ait bir yazım kartı çekilir. Doğru bilen
// bir kare ilerler; yanlış bilen ceza kartı çeker. Ceza kartını doğru
// cevaplayan yerinde kalır, bilemeyen bir kare geri gider.
//
// Soru formatı: aynı sözün yanlış ve doğru yazımı iki seçenek olarak verilir.
// "answer", options içindeki doğru seçeneğin birebir kopyasıdır.

// ---------- Kategoriler (kart renkleri) ----------

export const CATEGORIES = {
  deda: { label: "de / da", name: "de / da", color: "#2f5fbf" },
  ki: { label: "ki bağlacı", name: "ki bağlacı", color: "#2e7d4f" },
  mi: { label: "mi soru eki", name: "mi soru eki", color: "#9a6b00" },
  sey: { label: "şey", name: "şey", color: "#6d4aa8" },
  birlesik: { label: "Birleşik kelimeler", name: "Birleşik kelimeler", color: "#b03a2e" },
  sayilar: { label: "Sayılar", name: "Sayılar", color: "#1f6f7a" },
  buyuk: { label: "Büyük harf", name: "Büyük harf", color: "#a83a63" },
  kesme: { label: "Kesme işareti", name: "Kesme işareti", color: "#4556a8" },
  ikileme: { label: "İkilemeler", name: "İkilemeler", color: "#5f6b1a" },
  duzeltme: { label: "Düzeltme işareti", name: "Düzeltme işareti", color: "#8a5a2b" },
  karisik: { label: "Yazımı karıştırılanlar", name: "Karışık", color: "#4a5568" },
};

// Tahtadaki "sürpriz" kareler: kart rastgele bir kategoriden gelir.
export const MIXED_ID = "surpriz";
export const MIXED_CATEGORY = { label: "Sürpriz", name: "Sürpriz kart", color: "#c9a227" };

export const CATEGORY_ORDER = Object.keys(CATEGORIES);

export function categoryInfo(id) {
  if (id === MIXED_ID) return MIXED_CATEGORY;
  return CATEGORIES[id] || CATEGORIES.karisik;
}

// ---------- 30 karelik tahta ----------
// Sol üstten sağa, sonra aşağı ve geri (yılan) biçiminde okunur.

export const BOARD_LENGTH = 30;

export const defaultBoard = [
  "deda", "ki", "mi", MIXED_ID, "sey",
  "birlesik", "sayilar", "buyuk", "kesme", "ikileme",
  "duzeltme", "karisik", "deda", "ki", "mi",
  MIXED_ID, "sey", "birlesik", "sayilar", "buyuk",
  "kesme", "ikileme", "duzeltme", "karisik", MIXED_ID,
  "deda", "ki", "mi", MIXED_ID, "karisik",
];

// ---------- Soru bankası ----------

const q = (category, rows) =>
  rows.map(([wrong, right, explanation, question = "Doğru yazımı seç."]) => ({
    category,
    question,
    options: [wrong, right],
    answer: right,
    explanation,
  }));

export const defaultQuestions = [
  // ——— de / da ———
  ...q("de / da", [
    ["sende mi", "sen de mi", "Bağlaç olan “de” ayrı yazılır: sen de mi?"],
    ["evdede var", "evde de var", "Bulunma eki “-de” bitişik, bağlaç “de” ayrı yazılır."],
    ["gelde gör", "gel de gör", "Bağlaç olan “de” ayrı yazılır: gel de gör."],
    ["bendede var", "bende de var", "İlk “-de” bulunma eki, ikincisi bağlaçtır; bağlaç ayrı yazılır."],
    ["Alide geldi", "Ali de geldi", "Özel addan sonra gelen bağlaç ayrı yazılır; kesme işareti kullanılmaz."],
    ["yarında gelecek", "yarın da gelecek", "Zaman bildiren sözcükten sonraki bağlaç ayrı yazılır."],
    ["okuldada yoktu", "okulda da yoktu", "Bulunma eki bitişik, bağlaç ayrı yazılır."],
    ["oda haklı", "o da haklı", "“O” zamirinden sonra gelen bağlaç ayrı yazılır."],
    ["sizde mi geldiniz", "siz de mi geldiniz", "“de” bağlacı ve soru eki “mi” ayrı yazılır."],
    ["geldide gördü", "geldi de gördü", "Fiilden sonra gelen bağlaç ayrı yazılır."],
    ["bu akşamda çalışacağım", "bu akşam da çalışacağım", "Bağlaç “da” her zaman ayrı yazılır."],
    ["sende gel", "sen de gel", "Bağlaç olan “de” ayrı yazılır: sen de gel."],
  ]),

  // ——— ki ———
  ...q("ki bağlacı", [
    ["biliyorumki", "biliyorum ki", "Bağlaç olan “ki” ayrı yazılır."],
    ["öyle güzelki", "öyle güzel ki", "Bağlaç olan “ki” ayrı yazılır."],
    ["dün ki maç", "dünkü maç", "İlgi eki “-ki” bitişik yazılır ve ünlü uyumuna girer: dünkü."],
    ["yarın ki sınav", "yarınki sınav", "İlgi eki “-ki” bitişik yazılır: yarınki."],
    ["akşam ki film", "akşamki film", "İlgi eki “-ki” bitişik yazılır: akşamki."],
    ["madem ki", "mademki", "Kalıplaşmış “mademki” bitişik yazılır."],
    ["halbu ki", "halbuki", "Kalıplaşmış “halbuki” bitişik yazılır."],
    ["oysa ki", "oysaki", "Kalıplaşmış “oysaki” bitişik yazılır."],
    ["san ki", "sanki", "Kalıplaşmış “sanki” bitişik yazılır."],
    ["bel ki", "belki", "Kalıplaşmış “belki” bitişik yazılır."],
    ["demekki", "demek ki", "Bağlaç olan “ki” ayrı yazılır."],
    ["anladımki", "anladım ki", "Bağlaç olan “ki” ayrı yazılır."],
  ]),

  // ——— mi ———
  ...q("mi soru eki", [
    ["geldinmi", "geldin mi", "Soru eki “mi” ayrı yazılır."],
    ["güzelmi", "güzel mi", "Soru eki “mi” ayrı yazılır."],
    ["okudunmu", "okudun mu", "Soru eki “mi” ayrı yazılır."],
    ["senmisin", "sen misin", "“mi” ayrı, kişi eki ona bitişik yazılır: misin."],
    ["biliyormusun", "biliyor musun", "“mi” ayrı, kişi eki ona bitişik yazılır: musun."],
    ["gördünmü", "gördün mü", "Soru eki “mi” ayrı yazılır."],
    ["aldınmı", "aldın mı", "Soru eki “mi” ayrı yazılır."],
    ["hazırmıyız", "hazır mıyız", "“mi” ayrı, kişi eki ona bitişik yazılır: mıyız."],
    ["yaptınmı", "yaptın mı", "Soru eki “mi” ayrı yazılır."],
    ["gelecekmisin", "gelecek misin", "“mi” ayrı, kişi eki ona bitişik yazılır: misin."],
    ["severmiyim", "sever miyim", "Soru eki “mi” ayrı yazılır."],
    ["olurmu", "olur mu", "Soru eki “mi” ayrı yazılır."],
  ]),

  // ——— şey ———
  ...q("şey", [
    ["herşey", "her şey", "“Şey” sözcüğü her zaman ayrı yazılır."],
    ["birşey", "bir şey", "“Şey” sözcüğü her zaman ayrı yazılır."],
    ["hiçbirşey", "hiçbir şey", "“Hiçbir” bitişik, “şey” ayrı yazılır."],
    ["birkaçşey", "birkaç şey", "“Birkaç” bitişik, “şey” ayrı yazılır."],
    ["herhangibirşey", "herhangi bir şey", "“Herhangi” bitişik, “bir şey” ayrı yazılır."],
    ["pekçokşey", "pek çok şey", "“Pek çok” ve “şey” ayrı yazılır."],
    ["aynışey", "aynı şey", "“Şey” sözcüğü her zaman ayrı yazılır."],
    ["başka birşey", "başka bir şey", "“Bir şey” ayrı yazılır."],
  ]),

  // ——— Birleşik kelimeler ———
  ...q("Birleşik kelimeler", [
    ["bir çok", "birçok", "“Birçok, birkaç, birtakım, biraz” bitişik yazılır."],
    ["bir kaç", "birkaç", "“Birkaç” bitişik yazılır."],
    ["hiç bir", "hiçbir", "“Hiçbir” bitişik; “hiç kimse” ise ayrı yazılır."],
    ["her kes", "herkes", "“Herkes” bitişik yazılır."],
    ["hiçkimse", "hiç kimse", "“Hiç kimse” ayrı yazılır."],
    ["bir biri", "birbiri", "“Birbiri” bitişik yazılır: birbiri, birbirine."],
    ["bu gün", "bugün", "“Bugün” kalıplaşmış birleşik sözcüktür."],
    ["bir az", "biraz", "“Biraz” bitişik yazılır."],
    ["baş vuru", "başvuru", "“Başvuru” bitişik yazılır."],
    ["yapa bilmek", "yapabilmek", "Yeterlik fiili kalıplaşmışsa bitişik yazılır."],
    ["red etmek", "reddetmek", "“Reddetmek” iki “d” ile bitişik yazılır."],
    ["his etmek", "hissetmek", "“Hissetmek” iki “s” ile bitişik yazılır."],
    ["zanetmek", "zannetmek", "“Zannetmek” iki “n” ile bitişik yazılır."],
    ["pek iyi", "pekiyi", "“Pekiyi” bitişik yazılır."],
    ["ilk öğretim", "ilköğretim", "“İlköğretim” bitişik yazılır."],
    ["orta okul", "ortaokul", "“Ortaokul” bitişik yazılır."],
    ["hanım eli", "hanımeli", "Bitki adı olan “hanımeli” bitişik yazılır."],
    ["ayak kabı", "ayakkabı", "“Ayakkabı” bitişik yazılır."],
    ["baş hekim", "başhekim", "“Başhekim” bitişik yazılır."],
    ["cumar tesi", "cumartesi", "“Cumartesi” bitişik ve tek sözcük olarak yazılır."],
  ]),

  // ——— Sayılar ———
  ...q("Sayılar", [
    ["onbeş", "on beş", "Sayılar ayrı yazılır: on beş."],
    ["yirmibir", "yirmi bir", "Sayılar ayrı yazılır: yirmi bir."],
    ["ikiyüzelli", "iki yüz elli", "Sayının her bölümü ayrı yazılır."],
    ["üçyüzkırkiki", "üç yüz kırk iki", "Sayının her bölümü ayrı yazılır."],
    ["bindokuzyüz", "bin dokuz yüz", "Sayının her bölümü ayrı yazılır."],
    ["yediyüz", "yedi yüz", "Sayılar ayrı yazılır: yedi yüz."],
    ["otuzbeş", "otuz beş", "Sayılar ayrı yazılır: otuz beş."],
    ["altmışiki", "altmış iki", "Sayılar ayrı yazılır: altmış iki."],
    ["doksandokuz", "doksan dokuz", "Sayılar ayrı yazılır: doksan dokuz."],
    ["dörtyüzelli", "dört yüz elli", "Sayının her bölümü ayrı yazılır."],
  ]),

  // ——— Büyük harf ———
  ...q("Büyük harf", [
    ["doğu anadolu", "Doğu Anadolu", "Özel yer adındaki yön bildiren sözcük büyük yazılır."],
    ["türkçe", "Türkçe", "Dil adları büyük harfle başlar."],
    ["türk dil kurumu", "Türk Dil Kurumu", "Kurum adları büyük harfle başlar."],
    ["29 ekim 1923", "29 Ekim 1923", "Belirli bir tarihte ay adı büyük yazılır."],
    ["Pazartesi günü", "pazartesi günü", "Belirli bir tarih belirtilmiyorsa gün adı küçük yazılır."],
    ["ingilizce", "İngilizce", "Dil adları büyük harfle başlar."],
    ["atatürk", "Atatürk", "Özel adlar büyük harfle başlar."],
    ["tbmm", "TBMM", "Kısaltmalar büyük harfle yazılır."],
    ["ramazan bayramı", "Ramazan Bayramı", "Dini bayram adları büyük harfle başlar."],
    ["cumhuriyet bayramı", "Cumhuriyet Bayramı", "Bayram adları büyük harfle başlar."],
    ["23 nisan 1920", "23 Nisan 1920", "Belirli bir tarihte ay adı büyük yazılır."],
  ]),

  // ——— Kesme işareti ———
  ...q("Kesme işareti", [
    ["TDK'nın", "TDK'nin", "Kısaltmaya gelen ek kesmeyle ayrılır ve okunuşa göre yazılır: TDK (te-de-ke) → TDK'nin."],
    ["Ahmette", "Ahmet'te", "Özel ada gelen çekim eki kesmeyle ayrılır."],
    ["TBMMye", "TBMM'ye", "Kısaltmaya gelen ek kesmeyle ayrılır."],
    ["istanbula", "İstanbul'a", "Özel ada gelen çekim eki kesmeyle ayrılır."],
    ["ankaradan", "Ankara'dan", "Özel ada gelen çekim eki kesmeyle ayrılır."],
    ["Aliye", "Ali'ye", "Özel ada gelen çekim eki kesmeyle ayrılır."],
    ["Ayşenin", "Ayşe'nin", "Özel ada gelen çekim eki kesmeyle ayrılır."],
    ["1923te", "1923'te", "Sayıya gelen ek kesmeyle ayrılır."],
    ["Bursada", "Bursa'da", "Özel ada gelen çekim eki kesmeyle ayrılır."],
    ["Türkçe'nin", "Türkçenin", "Dil adlarına getirilen ekler kesmeyle ayrılmaz: Türkçenin, İngilizcenin."],
  ]),

  // ——— İkilemeler ———
  ...q("İkilemeler", [
    ["yanyana", "yan yana", "İkilemeler ayrı yazılır."],
    ["peşpeşe", "peş peşe", "İkilemeler ayrı yazılır."],
    ["başbaşa", "baş başa", "İkilemeler ayrı yazılır."],
    ["elele", "el ele", "İkilemeler ayrı yazılır."],
    ["kolkola", "kol kola", "İkilemeler ayrı yazılır."],
    ["içiçe", "iç içe", "İkilemeler ayrı yazılır."],
    ["ergeç", "er geç", "İkilemeler ayrı yazılır."],
    ["abuksabuk", "abuk sabuk", "İkilemeler ayrı yazılır."],
  ]),

  // ——— Düzeltme işareti ———
  ...q("Düzeltme işareti", [
    ["kağıt", "kâğıt", "“Kâğıt” düzeltme işaretiyle yazılır."],
    [
      "hala",
      "hâlâ",
      "“Hala” babanın kız kardeşidir; “henüz” anlamındaki sözcük “hâlâ”dır.",
      "“Henüz, şimdiye kadar” anlamındaki doğru yazımı seç.",
    ],
    [
      "adet",
      "âdet",
      "“Adet” sayı anlamındadır; gelenek anlamındaki sözcük “âdet”tir.",
      "“Gelenek, görenek” anlamındaki doğru yazımı seç.",
    ],
    ["dükkan", "dükkân", "“Dükkân” düzeltme işaretiyle yazılır."],
    [
      "kar",
      "kâr",
      "Kazanç anlamındaki sözcük “kâr”dır; “kar” yağıştır.",
      "Kazanç anlamındaki doğru yazımı seç.",
    ],
    ["alem", "âlem", "“Âlem” düzeltme işaretiyle yazılır.", "Evren, dünya anlamındaki doğru yazımı seç."],
    ["hikaye", "hikâye", "“Hikâye” düzeltme işaretiyle yazılır."],
    ["rüzgar", "rüzgâr", "“Rüzgâr” düzeltme işaretiyle yazılır."],
    ["kase", "kâse", "“Kâse” düzeltme işaretiyle yazılır."],
    ["katip", "kâtip", "“Kâtip” düzeltme işaretiyle yazılır."],
  ]),

  // ——— Yazımı karıştırılanlar ———
  ...q("Yazımı karıştırılanlar", [
    ["yanlız", "yalnız", "Doğru yazım “yalnız”dır; “yanlız” yaygın bir hatadır."],
    ["yalnış", "yanlış", "Doğru yazım “yanlış”tır; “yalnış” yanlıştır."],
    ["hoşçakal", "hoşça kal", "TDK'ye göre “hoşça kal” ayrı yazılır."],
    ["sağol", "sağ ol", "“Sağ ol, sağ olun” ayrı yazılır."],
    ["süpriz", "sürpriz", "Doğru yazım “sürpriz”dir."],
    ["hergün", "her gün", "“Her” ile kurulan ifadeler ayrı yazılır: her gün."],
    ["şuan", "şu an", "“Şu an” ayrı yazılır."],
    ["artarda", "art arda", "“Art arda” ayrı yazılır."],
    ["gözardı", "göz ardı", "“Göz ardı etmek” ayrı yazılır."],
    ["eşortman", "eşofman", "Doğru yazım “eşofman”dır."],
    ["müsade", "müsaade", "Doğru yazım “müsaade”dir (iki “a”)."],
    ["yanlızca", "yalnızca", "“Yalnız” kökünden gelen “yalnızca” böyle yazılır."],
  ]),
];

// ---------- Ceza destesi ----------
// Yanlış cevaptan sonra çekilir. Doğru cevaplayan cezadan kurtulur,
// bilemeyen bir kare geri gider.

export const defaultPenalties = q("Ceza", [
  ["birden bire", "birdenbire", "“Birdenbire” bitişik yazılır."],
  ["ilkyardım", "ilk yardım", "“İlk yardım” ayrı yazılır."],
  ["ilk okul", "ilkokul", "“İlkokul” bitişik yazılır."],
  ["her hangi", "herhangi", "“Herhangi” bitişik yazılır."],
  ["hiç bir şey", "hiçbir şey", "“Hiçbir” bitişik, “şey” ayrı yazılır."],
  ["bir takım", "birtakım", "“Birtakım” bitişik yazılır."],
  ["yinede", "yine de", "Bağlaç “de” ayrı yazılır."],
  ["biran", "bir an", "“Bir an” ayrı yazılır."],
  ["farketmek", "fark etmek", "“Fark etmek” ayrı yazılır."],
  ["terketmek", "terk etmek", "“Terk etmek” ayrı yazılır."],
  ["kabuletmek", "kabul etmek", "“Kabul etmek” ayrı yazılır."],
  ["hal etmek", "halletmek", "“Halletmek” bitişik yazılır."],
  ["af etmek", "affetmek", "“Affetmek” bitişik yazılır."],
  ["sabır etmek", "sabretmek", "“Sabretmek” bitişik yazılır."],
  ["yardımetmek", "yardım etmek", "“Yardım etmek” ayrı yazılır."],
  ["orjinal", "orijinal", "Doğru yazım “orijinal”dir."],
  ["klavuz", "kılavuz", "Doğru yazım “kılavuz”dur."],
  ["yanlızlık", "yalnızlık", "Doğru yazım “yalnızlık”tır."],
  ["her kez", "herkes", "“Herkes” bitişik yazılır."],
  ["çünki", "çünkü", "“Çünkü” bitişik ve “ü” ile yazılır."],
  ["yada", "ya da", "Bağlaç “da” ayrı yazılır: ya da."],
  ["malesef", "maalesef", "Doğru yazım “maalesef”tir (iki “a”)."],
  ["eşgüdüm", "eş güdüm", "“Eş güdüm” ayrı yazılır."],
  ["alış veriş", "alışveriş", "“Alışveriş” bitişik yazılır."],
]);

// ---------- Ayarlar ----------

export const defaultSettings = {
  correctImage: "assets/default-correct.webp",
  wrongImage: "assets/default-wrong.webp",
};

export const defaultAdminPassword = "kaptan";

// "kaptan" şifresinin SHA-256 özeti. Panelde şifre düz metin olarak saklanmaz.
export const defaultAdminPasswordHash =
  "caa3425632ced38a3f1712d1a3fb2d2bf6743033ea0d67d59a4f1a9afacf086b";
