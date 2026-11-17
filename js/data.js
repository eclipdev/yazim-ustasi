// Yazım Ustası — varsayılan soru bankası
//
// Format: aynı kelimenin/ifadenin yanlış ve doğru yazımı iki seçenek olarak verilir,
// öğrenci doğru olanı seçer. "answer", options içindeki doğru seçeneğin birebir kopyasıdır.
// Yönetim panelinden soruları düzenleyebilir, dışa/içe aktarabilirsin.

export const defaultQuestions = [
  // ——— şey ———
  {
    category: "şey",
    question: "Doğru yazımı seç.",
    options: ["herşey", "her şey"],
    answer: "her şey",
    explanation: "“Şey” sözcüğü her zaman ayrı yazılır: her şey, bir şey, hiçbir şey.",
  },
  {
    category: "şey",
    question: "Doğru yazımı seç.",
    options: ["birşey", "bir şey"],
    answer: "bir şey",
    explanation: "“Şey” her zaman ayrı yazılır: bir şey.",
  },
  {
    category: "şey",
    question: "Doğru yazımı seç.",
    options: ["hiçbirşey", "hiçbir şey"],
    answer: "hiçbir şey",
    explanation: "“Hiçbir” bitişik, “şey” ayrı yazılır: hiçbir şey.",
  },

  // ——— Birleşik kelimeler ———
  {
    category: "Birleşik kelimeler",
    question: "Doğru yazımı seç.",
    options: ["bir çok", "birçok"],
    answer: "birçok",
    explanation: "“Birçok, birkaç, birtakım, biraz” kalıplaşmış birleşik sözcüklerdir; bitişik yazılır.",
  },
  {
    category: "Birleşik kelimeler",
    question: "Doğru yazımı seç.",
    options: ["bir kaç", "birkaç"],
    answer: "birkaç",
    explanation: "“Birkaç” bitişik yazılır.",
  },
  {
    category: "Birleşik kelimeler",
    question: "Doğru yazımı seç.",
    options: ["hiç bir", "hiçbir"],
    answer: "hiçbir",
    explanation: "“Hiçbir” bitişik yazılır; ancak “hiç kimse” ayrıdır.",
  },
  {
    category: "Birleşik kelimeler",
    question: "Doğru yazımı seç.",
    options: ["her kes", "herkes"],
    answer: "herkes",
    explanation: "“Herkes” bitişik yazılır.",
  },
  {
    category: "Birleşik kelimeler",
    question: "Doğru yazımı seç.",
    options: ["hiçkimse", "hiç kimse"],
    answer: "hiç kimse",
    explanation: "“Hiç kimse” ayrı yazılır; “hiçbir” ise bitişiktir.",
  },
  {
    category: "Birleşik kelimeler",
    question: "Doğru yazımı seç.",
    options: ["bir biri", "birbiri"],
    answer: "birbiri",
    explanation: "“Birbiri” bitişik yazılır: birbiri, birbirine, birbirinden.",
  },
  {
    category: "Birleşik kelimeler",
    question: "Doğru yazımı seç.",
    options: ["bu gün", "bugün"],
    answer: "bugün",
    explanation: "“Bugün” kalıplaşmış birleşik sözcüktür, bitişik yazılır.",
  },
  {
    category: "Birleşik kelimeler",
    question: "Doğru yazımı seç.",
    options: ["bir az", "biraz"],
    answer: "biraz",
    explanation: "“Biraz” bitişik yazılır.",
  },
  {
    category: "Birleşik kelimeler",
    question: "Doğru yazımı seç.",
    options: ["baş vuru", "başvuru"],
    answer: "başvuru",
    explanation: "“Başvuru, başvurmak” bitişik yazılır.",
  },
  {
    category: "Birleşik kelimeler",
    question: "Doğru yazımı seç.",
    options: ["yapa bilmek", "yapabilmek"],
    answer: "yapabilmek",
    explanation: "Yeterlik fiili “-e bil-” kalıplaşmışsa bitişik yazılır: yapabilmek, gelebilmek.",
  },
  {
    category: "Birleşik kelimeler",
    question: "Doğru yazımı seç.",
    options: ["red etmek", "reddetmek"],
    answer: "reddetmek",
    explanation: "“Ret” + “etmek” birleşirken “reddetmek” olur; iki “d” ile yazılır.",
  },
  {
    category: "Birleşik kelimeler",
    question: "Doğru yazımı seç.",
    options: ["his etmek", "hissetmek"],
    answer: "hissetmek",
    explanation: "“His” + “etmek” birleşirken “hissetmek” olur; iki “s” ile yazılır.",
  },
  {
    category: "Birleşik kelimeler",
    question: "Doğru yazımı seç.",
    options: ["zanetmek", "zannetmek"],
    answer: "zannetmek",
    explanation: "“Zan” + “etmek” birleşirken “zannetmek” olur; iki “n” ile yazılır.",
  },
  {
    category: "Birleşik kelimeler",
    question: "Doğru yazımı seç.",
    options: ["pek iyi", "pekiyi"],
    answer: "pekiyi",
    explanation: "“Pekiyi” bitişik yazılır.",
  },
  {
    category: "Birleşik kelimeler",
    question: "Doğru yazımı seç.",
    options: ["ilk öğretim", "ilköğretim"],
    answer: "ilköğretim",
    explanation: "“İlköğretim” bitişik yazılır.",
  },
  {
    category: "Birleşik kelimeler",
    question: "Doğru yazımı seç.",
    options: ["orta okul", "ortaokul"],
    answer: "ortaokul",
    explanation: "“Ortaokul” bitişik yazılır.",
  },

  // ——— de / da ———
  {
    category: "de / da",
    question: "Doğru yazımı seç.",
    options: ["sende mi", "sen de mi"],
    answer: "sen de mi",
    explanation: "Bağlaç olan “de/da” ayrı yazılır: sen de mi?",
  },
  {
    category: "de / da",
    question: "Doğru yazımı seç.",
    options: ["evdede var", "evde de var"],
    answer: "evde de var",
    explanation: "Bulunma eki olan “-de” bitişik, bağlaç olan “de” ayrı yazılır: evde de var.",
  },
  {
    category: "de / da",
    question: "Doğru yazımı seç.",
    options: ["gelde gör", "gel de gör"],
    answer: "gel de gör",
    explanation: "Bağlaç olan “de” ayrı yazılır: gel de gör.",
  },

  // ——— ki ———
  {
    category: "ki bağlacı",
    question: "Doğru yazımı seç.",
    options: ["madem ki", "mademki"],
    answer: "mademki",
    explanation: "“Mademki” kalıplaşmış birleşik sözcüktür, bitişik yazılır.",
  },
  {
    category: "ki bağlacı",
    question: "Doğru yazımı seç.",
    options: ["oysa ki", "oysaki"],
    answer: "oysaki",
    explanation: "“Oysaki” bitişik yazılır.",
  },
  {
    category: "ki bağlacı",
    question: "Doğru yazımı seç.",
    options: ["san ki", "sanki"],
    answer: "sanki",
    explanation: "“Sanki” bitişik yazılır.",
  },
  {
    category: "ki bağlacı",
    question: "Doğru yazımı seç.",
    options: ["demekki", "demek ki"],
    answer: "demek ki",
    explanation: "Bağlaç olan “ki” ayrı yazılır: demek ki.",
  },
  {
    category: "ki bağlacı",
    question: "Doğru yazımı seç.",
    options: ["bel ki", "belki"],
    answer: "belki",
    explanation: "“Belki” bitişik yazılır.",
  },
  {
    category: "ki bağlacı",
    question: "Doğru yazımı seç.",
    options: ["halbu ki", "halbuki"],
    answer: "halbuki",
    explanation: "“Halbuki” bitişik yazılır.",
  },
  {
    category: "ki bağlacı",
    question: "Doğru yazımı seç.",
    options: ["akşam ki maç", "akşamki maç"],
    answer: "akşamki maç",
    explanation: "İlgi eki olan “-ki” bitişik yazılır: akşamki, dünkü, yarınki.",
  },

  // ——— mi ———
  {
    category: "mi soru eki",
    question: "Doğru yazımı seç.",
    options: ["geliyormusun", "geliyor musun"],
    answer: "geliyor musun",
    explanation: "Soru eki “mi” ayrı, kişi eki ona bitişik yazılır: geliyor musun.",
  },
  {
    category: "mi soru eki",
    question: "Doğru yazımı seç.",
    options: ["gelebilirmiyim", "gelebilir miyim"],
    answer: "gelebilir miyim",
    explanation: "“mi” ayrı yazılır, kişi eki “mi”ye bitişik gelir: gelebilir miyim.",
  },

  // ——— Sayılar ———
  {
    category: "Sayılar",
    question: "Doğru yazımı seç.",
    options: ["onbeş", "on beş"],
    answer: "on beş",
    explanation: "Sayılar ayrı yazılır: on beş, yirmi bir, otuz iki.",
  },
  {
    category: "Sayılar",
    question: "Doğru yazımı seç.",
    options: ["ikiyüzelli", "iki yüz elli"],
    answer: "iki yüz elli",
    explanation: "Sayıların her bölümü ayrı yazılır: iki yüz elli.",
  },
  {
    category: "Sayılar",
    question: "Doğru yazımı seç.",
    options: ["yirmibir", "yirmi bir"],
    answer: "yirmi bir",
    explanation: "Sayılar ayrı yazılır: yirmi bir.",
  },

  // ——— Düzeltme işareti ———
  {
    category: "Düzeltme işareti",
    question: "Doğru yazımı seç.",
    options: ["kağıt", "kâğıt"],
    answer: "kâğıt",
    explanation: "“Kâğıt” düzeltme işaretiyle yazılır.",
  },
  {
    category: "Düzeltme işareti",
    question: "“Henüz, şimdiye kadar” anlamındaki doğru yazımı seç.",
    options: ["hala", "hâlâ"],
    answer: "hâlâ",
    explanation: "“Hala” babanın kız kardeşidir; “hâlâ” ise “henüz” anlamındadır.",
  },
  {
    category: "Düzeltme işareti",
    question: "“Gelenek, görenek” anlamındaki doğru yazımı seç.",
    options: ["adet", "âdet"],
    answer: "âdet",
    explanation: "“Gelenek” anlamındaki sözcük “âdet”tir; “adet” ise “sayı, tane” anlamındadır.",
  },
  {
    category: "Düzeltme işareti",
    question: "Doğru yazımı seç.",
    options: ["dükkan", "dükkân"],
    answer: "dükkân",
    explanation: "“Dükkân” düzeltme işaretiyle yazılır.",
  },

  // ——— Büyük harf ———
  {
    category: "Büyük harf",
    question: "Doğru yazımı seç.",
    options: ["doğu anadolu", "Doğu Anadolu"],
    answer: "Doğu Anadolu",
    explanation: "Özel yer adlarındaki yön bildiren sözcükler büyük yazılır: Doğu Anadolu.",
  },
  {
    category: "Büyük harf",
    question: "Doğru yazımı seç.",
    options: ["türkçe", "Türkçe"],
    answer: "Türkçe",
    explanation: "Dil adları büyük harfle başlar: Türkçe, İngilizce.",
  },
  {
    category: "Büyük harf",
    question: "Doğru yazımı seç.",
    options: ["türk dil kurumu", "Türk Dil Kurumu"],
    answer: "Türk Dil Kurumu",
    explanation: "Kurum adları büyük harfle başlar: Türk Dil Kurumu.",
  },
  {
    category: "Büyük harf",
    question: "Doğru yazımı seç.",
    options: ["29 ekim 1923", "29 Ekim 1923"],
    answer: "29 Ekim 1923",
    explanation: "Belirli bir tarih belirtildiğinde ay adı büyük yazılır: 29 Ekim 1923.",
  },
  {
    category: "Büyük harf",
    question: "Doğru yazımı seç.",
    options: ["Pazartesi günü", "pazartesi günü"],
    answer: "pazartesi günü",
    explanation: "Belirli bir tarih belirtilmiyorsa gün adları küçük yazılır: pazartesi günü.",
  },

  // ——— Kesme işareti ———
  {
    category: "Kesme işareti",
    question: "Doğru yazımı seç.",
    options: ["TDK'nin", "TDK'nın"],
    answer: "TDK'nın",
    explanation: "Kısaltmaya gelen ek kesmeyle ayrılır ve okunuşa göre gelir: TDK'nın.",
  },
  {
    category: "Kesme işareti",
    question: "Doğru yazımı seç.",
    options: ["Ahmette", "Ahmet'te"],
    answer: "Ahmet'te",
    explanation: "Özel adlara gelen çekim ekleri kesmeyle ayrılır: Ahmet'te.",
  },
  {
    category: "Kesme işareti",
    question: "Doğru yazımı seç.",
    options: ["TBMMye", "TBMM'ye"],
    answer: "TBMM'ye",
    explanation: "Kısaltmaya gelen ek kesmeyle yazılır: TBMM'ye.",
  },

  // ——— İkilemeler ———
  {
    category: "İkilemeler",
    question: "Doğru yazımı seç.",
    options: ["yanyana", "yan yana"],
    answer: "yan yana",
    explanation: "İkilemeler ayrı yazılır: yan yana.",
  },
  {
    category: "İkilemeler",
    question: "Doğru yazımı seç.",
    options: ["peşpeşe", "peş peşe"],
    answer: "peş peşe",
    explanation: "İkilemeler ayrı yazılır: peş peşe.",
  },
  {
    category: "İkilemeler",
    question: "Doğru yazımı seç.",
    options: ["başbaşa", "baş başa"],
    answer: "baş başa",
    explanation: "İkilemeler ayrı yazılır: baş başa.",
  },
  {
    category: "İkilemeler",
    question: "Doğru yazımı seç.",
    options: ["elele", "el ele"],
    answer: "el ele",
    explanation: "İkilemeler ayrı yazılır: el ele.",
  },
  {
    category: "İkilemeler",
    question: "Doğru yazımı seç.",
    options: ["kolkola", "kol kola"],
    answer: "kol kola",
    explanation: "İkilemeler ayrı yazılır: kol kola.",
  },

  // ——— Yazımı karıştırılanlar ———
  {
    category: "Yazımı karıştırılanlar",
    question: "Doğru yazımı seç.",
    options: ["yanlız", "yalnız"],
    answer: "yalnız",
    explanation: "Doğru yazım “yalnız”dır; “yanlız” yaygın bir yazım hatasıdır.",
  },
  {
    category: "Yazımı karıştırılanlar",
    question: "Doğru yazımı seç.",
    options: ["yalnış", "yanlış"],
    answer: "yanlış",
    explanation: "Doğru yazım “yanlış”tır; “yalnış” yanlıştır.",
  },
  {
    category: "Yazımı karıştırılanlar",
    question: "Doğru yazımı seç.",
    options: ["hoşçakal", "hoşça kal"],
    answer: "hoşça kal",
    explanation: "TDK'ye göre “hoşça kal” ayrı yazılır.",
  },
  {
    category: "Yazımı karıştırılanlar",
    question: "Doğru yazımı seç.",
    options: ["sağol", "sağ ol"],
    answer: "sağ ol",
    explanation: "“Sağ ol, sağ olun” ayrı yazılır.",
  },
  {
    category: "Yazımı karıştırılanlar",
    question: "Doğru yazımı seç.",
    options: ["süpriz", "sürpriz"],
    answer: "sürpriz",
    explanation: "Doğru yazım “sürpriz”dir.",
  },
  {
    category: "Yazımı karıştırılanlar",
    question: "Doğru yazımı seç.",
    options: ["hergün", "her gün"],
    answer: "her gün",
    explanation: "“Her” ile kurulan ifadeler ayrı yazılır: her gün, her şey.",
  },
  {
    category: "Yazımı karıştırılanlar",
    question: "Doğru yazımı seç.",
    options: ["şuan", "şu an"],
    answer: "şu an",
    explanation: "“Şu an” ayrı yazılır.",
  },
  {
    category: "Yazımı karıştırılanlar",
    question: "Doğru yazımı seç.",
    options: ["artarda", "art arda"],
    answer: "art arda",
    explanation: "“Art arda” ayrı yazılır.",
  },
  {
    category: "Yazımı karıştırılanlar",
    question: "Doğru yazımı seç.",
    options: ["gözardı", "göz ardı"],
    answer: "göz ardı",
    explanation: "“Göz ardı etmek” ayrı yazılır.",
  },
];

export const defaultSettings = {
  correctImage: "assets/default-correct.webp",
  wrongImage: "assets/default-wrong.webp",
  roundSize: 12,
  pointsPerCorrect: 10,
};

export const defaultAdminPassword = "kaptan";

// "kaptan" şifresinin SHA-256 özeti. Panelde şifre düz metin olarak saklanmaz.
export const defaultAdminPasswordHash =
  "caa3425632ced38a3f1712d1a3fb2d2bf6743033ea0d67d59a4f1a9afacf086b";
