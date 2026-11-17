// Yazım Ustası — varsayılan soru bankası
// Her soruda "answer" alanı, options içindeki doğru seçeneğin birebir kopyasıdır.
// Yönetim panelinden soruları düzenleyebilir, dışa/içe aktarabilirsin.

export const defaultQuestions = [
  // ——— de / da ———
  {
    category: "de / da",
    question: "Hangisi doğru yazılmıştır?",
    options: ["Sende mi geldin?", "Sen de mi geldin?", "Sen-de mi geldin?", "Sen'de mi geldin?"],
    answer: "Sen de mi geldin?",
    explanation: "Bağlaç olan “de/da” her zaman ayrı yazılır. Bulunma eki olan “-de” ise bitişik yazılır (“sende kaldı” = senin yanında kaldı).",
  },

  // ——— ki ———
  {
    category: "ki bağlacı",
    question: "Hangisi doğru yazılmıştır?",
    options: ["Duydumki gelmişsin.", "Duydum ki gelmişsin.", "Duydum-ki gelmişsin.", "Duydum'ki gelmişsin."],
    answer: "Duydum ki gelmişsin.",
    explanation: "Bağlaç olan “ki” ayrı yazılır. İlgi eki olan “-ki” ise bitişik yazılır: akşamki, dünkü, yarınki.",
  },
  {
    category: "ki bağlacı",
    question: "Aşağıdakilerden hangisinde “-ki” bitişik yazılmalıdır?",
    options: ["Duydum ki", "Akşamki maç", "Öyle ki", "O kadar ki"],
    answer: "Akşamki maç",
    explanation: "Sıfat görevindeki ilgi eki “-ki” bitişik yazılır: akşamki, sabahki, yukarıki.",
  },
  {
    category: "ki bağlacı",
    question: "Hangisi doğru yazılmıştır?",
    options: ["madem ki", "mademki", "madem-ki", "madem’ki"],
    answer: "mademki",
    explanation: "“Mademki” TDK’ye göre kalıplaşmış birleşik sözcüktür, bitişik yazılır.",
  },
  {
    category: "ki bağlacı",
    question: "Hangisi doğru yazılmıştır?",
    options: ["oysa ki", "oysaki", "oy sa ki", "oysa’ki"],
    answer: "oysaki",
    explanation: "“Oysaki” kalıplaşmış birleşik sözcüktür, bitişik yazılır.",
  },
  {
    category: "ki bağlacı",
    question: "Aşağıdakilerden hangisi doğru yazılmıştır?",
    options: ["san ki", "madem ki", "oysa ki", "sanki"],
    answer: "sanki",
    explanation: "“Sanki” bitişik yazılır. “Mademki” ve “oysaki” de bitişiktir; “madem ki”, “oysa ki” yazımları yanlıştır.",
  },
  {
    category: "ki bağlacı",
    question: "Hangisi doğru yazılmıştır?",
    options: ["Demekki gelmiş.", "Demek ki gelmiş.", "Demek-ki gelmiş.", "Demek’ki gelmiş."],
    answer: "Demek ki gelmiş.",
    explanation: "Buradaki “ki” bağlaçtır; bağlaç olan “ki” ayrı yazılır.",
  },

  // ——— mi ———
  {
    category: "mi soru eki",
    question: "Hangisi doğru yazılmıştır?",
    options: ["Geliyor musun?", "Geliyormusun?", "Geliyor-musun?", "Geliyor mu sun?"],
    answer: "Geliyor musun?",
    explanation: "Soru eki “mi” her zaman ayrı yazılır; kendisinden sonra gelen ekler ise “mi”ye bitişik yazılır: geliyor musun, gelebilir miyim.",
  },
  {
    category: "mi soru eki",
    question: "Hangisi doğru yazılmıştır?",
    options: ["Gelebilirmiyim?", "Gelebilir miyim?", "Gelebilir mi yim?", "Gelebilir-miyim?"],
    answer: "Gelebilir miyim?",
    explanation: "“mi” ayrı yazılır, kişi eki ona bitişik gelir: gelebilir miyim.",
  },

  // ——— şey ———
  {
    category: "şey",
    question: "Aşağıdakilerden hangisi doğru yazılmıştır?",
    options: ["herşey", "birşey", "her şey", "hiçbirşey"],
    answer: "her şey",
    explanation: "“Şey” sözcüğü her zaman ayrı yazılır: her şey, bir şey, hiçbir şey.",
  },

  // ——— Birleşik kelimeler ———
  {
    category: "Birleşik kelimeler",
    question: "Aşağıdakilerden hangisi doğru yazılmıştır?",
    options: ["bir çok", "birçok", "biçok", "bir-çok"],
    answer: "birçok",
    explanation: "“Birçok, birkaç, birtakım, biraz” kalıplaşmış birleşik sözcüklerdir; bitişik yazılır.",
  },
  {
    category: "Birleşik kelimeler",
    question: "Aşağıdakilerden hangisi doğru yazılmıştır?",
    options: ["hiç bir", "hiçbir", "hiç-bir", "hiçbi"],
    answer: "hiçbir",
    explanation: "“Hiçbir” bitişik yazılır. Ancak “hiç kimse” ayrı yazılır.",
  },
  {
    category: "Birleşik kelimeler",
    question: "Aşağıdakilerden hangisi doğru yazılmıştır?",
    options: ["bir kaç", "birkaç", "bir-kaç", "bir kac"],
    answer: "birkaç",
    explanation: "“Birkaç” kalıplaşmış birleşik sözcüktür, bitişik yazılır.",
  },
  {
    category: "Birleşik kelimeler",
    question: "Aşağıdakilerden hangisi doğru yazılmıştır?",
    options: ["her kes", "herkes", "her-kes", "herkez"],
    answer: "herkes",
    explanation: "“Herkes” bitişik yazılır; “her şey”, “her gün” ise ayrı yazılır.",
  },
  {
    category: "Birleşik kelimeler",
    question: "Aşağıdakilerden hangisi doğru yazılmıştır?",
    options: ["hiçkimse", "hiç kimse", "hiç-kimse", "hiç kimse’"],
    answer: "hiç kimse",
    explanation: "“Hiç kimse” ayrı yazılır; “hiçbir” ise bitişiktir.",
  },
  {
    category: "Birleşik kelimeler",
    question: "Aşağıdakilerden hangisi doğru yazılmıştır?",
    options: ["bir biri", "birbiri", "bir-biri", "biri biri"],
    answer: "birbiri",
    explanation: "“Birbiri” bitişik yazılır; “birbirine, birbirinden” gibi çekimlerde de bitişik kalır.",
  },
  {
    category: "Birleşik kelimeler",
    question: "Aşağıdakilerden hangisi doğru yazılmıştır?",
    options: ["bu gün", "bugün", "bu-gün", "bu’gün"],
    answer: "bugün",
    explanation: "“Bugün” kalıplaşmış birleşik sözcüktür, bitişik yazılır.",
  },
  {
    category: "Birleşik kelimeler",
    question: "Aşağıdakilerden hangisi doğru yazılmıştır?",
    options: ["bir az", "biraz", "bi-raz", "bir’az"],
    answer: "biraz",
    explanation: "“Biraz” bitişik yazılır.",
  },
  {
    category: "Birleşik kelimeler",
    question: "Aşağıdakilerden hangisi doğru yazılmıştır?",
    options: ["baş vuru", "başvuru", "baş-vuru", "baş vur u"],
    answer: "başvuru",
    explanation: "“Başvuru, başvurmak” kalıplaşmış birleşik sözcüklerdir; bitişik yazılır.",
  },
  {
    category: "Birleşik kelimeler",
    question: "Aşağıdakilerden hangisi doğru yazılmıştır?",
    options: ["yapa bilmek", "yapabilmek", "yap-a bilmek", "yapabil mek"],
    answer: "yapabilmek",
    explanation: "Yeterlik fiili “-e bil-” kalıplaşmışsa bitişik yazılır: yapabilmek, gelebilmek, okuyabilmek.",
  },
  {
    category: "Birleşik kelimeler",
    question: "Aşağıdakilerden hangisi doğru yazılmıştır?",
    options: ["red etmek", "reddetmek", "red’etmek", "red-etmek"],
    answer: "reddetmek",
    explanation: "“Ret” sözcüğü “etmek” ile birleşirken “reddetmek” olur; iki “d” ile yazılır.",
  },
  {
    category: "Birleşik kelimeler",
    question: "Aşağıdakilerden hangisi doğru yazılmıştır?",
    options: ["his etmek", "hissetmek", "his’etmek", "his-etmek"],
    answer: "hissetmek",
    explanation: "“His” + “etmek” birleşirken “hissetmek” olur; iki “s” ile yazılır.",
  },
  {
    category: "Birleşik kelimeler",
    question: "Aşağıdakilerden hangisi doğru yazılmıştır?",
    options: ["yardımetmek", "yardım etmek", "yardım-etmek", "yardım’etmek"],
    answer: "yardım etmek",
    explanation: "Ses düşmesi ya da türemesi olmayan yardımcı fiil birleşiklerinde sözcükler ayrı yazılır: yardım etmek, kabul etmek.",
  },
  {
    category: "Birleşik kelimeler",
    question: "Aşağıdakilerden hangisi doğru yazılmıştır?",
    options: ["zanetmek", "zannetmek", "zann’etmek", "zannet mek"],
    answer: "zannetmek",
    explanation: "“Zan” + “etmek” birleşirken “zannetmek” olur; iki “n” ile yazılır.",
  },

  // ——— Sayılar ———
  {
    category: "Sayılar",
    question: "Sayıların yazımıyla ilgili hangisi doğrudur?",
    options: ["onbeş", "iki yüz elli", "yirmibir", "otuzbeş"],
    answer: "iki yüz elli",
    explanation: "Sayılar ayrı yazılır: on beş, iki yüz elli, yirmi bir, otuz beş.",
  },
  {
    category: "Sayılar",
    question: "Aşağıdakilerden hangisi doğru yazılmıştır?",
    options: ["otuziki", "otuz iki", "otuz-iki", "otuz’iki"],
    answer: "otuz iki",
    explanation: "Sayıların her bölümü ayrı yazılır: otuz iki, kırk beş, doksan dokuz.",
  },

  // ——— Düzeltme işareti ———
  {
    category: "Düzeltme işareti",
    question: "Aşağıdakilerden hangisi doğru yazılmıştır?",
    options: ["kağıt", "kâğıt", "kagıt", "kâğit"],
    answer: "kâğıt",
    explanation: "“Kâğıt” sözcüğünde düzeltme işareti kullanılır. “Hâlâ”, “âdet”, “kâse” de böyledir.",
  },
  {
    category: "Düzeltme işareti",
    question: "“Henüz, şimdiye kadar” anlamındaki sözcüğün doğru yazımı hangisidir?",
    options: ["hala", "hâlâ", "halâ", "hallâ"],
    answer: "hâlâ",
    explanation: "“Hala” babanın kız kardeşidir; “hâlâ” ise “henüz” anlamına gelir ve düzeltme işaretiyle yazılır.",
  },
  {
    category: "Düzeltme işareti",
    question: "Hangisinde düzeltme işareti doğru kullanılmıştır?",
    options: ["adet (gelenek)", "âdet (gelenek)", "hala (henüz)", "kağıt"],
    answer: "âdet (gelenek)",
    explanation: "“Gelenek” anlamındaki sözcük “âdet”tir; “adet” ise “sayı, tane” anlamındadır.",
  },

  // ——— Büyük harf ———
  {
    category: "Büyük harf",
    question: "Hangisi doğru yazılmıştır?",
    options: ["doğu Anadolu", "Doğu anadolu", "Doğu Anadolu", "doğu anadolu"],
    answer: "Doğu Anadolu",
    explanation: "Özel yer adlarındaki yön bildiren sözcükler büyük yazılır: Doğu Anadolu, İç Anadolu.",
  },
  {
    category: "Büyük harf",
    question: "Hangisi doğru yazılmıştır?",
    options: ["Güneş Doğudan doğar.", "Güneş doğudan doğar.", "Güneş doğu’dan doğar.", "Güneş Doğu’dan doğar."],
    answer: "Güneş doğudan doğar.",
    explanation: "Yön adları özel ad olarak kullanılmadıkça küçük yazılır.",
  },
  {
    category: "Büyük harf",
    question: "Hangisi doğru yazılmıştır?",
    options: ["Toplantı Pazartesi günü.", "Toplantı pazartesi günü.", "Toplantı Pazartesi’günü.", "Toplantı pazartesi’günü."],
    answer: "Toplantı pazartesi günü.",
    explanation: "Belirli bir tarih belirtilmiyorsa gün ve ay adları küçük yazılır.",
  },
  {
    category: "Büyük harf",
    question: "Hangisi doğru yazılmıştır?",
    options: ["29 ekim 1923’te", "29 Ekim 1923’te", "29 Ekim 1923te", "29 Ekim’de 1923"],
    answer: "29 Ekim 1923’te",
    explanation: "Belirli bir tarih belirtildiğinde ay adı büyük yazılır; yıla gelen ek kesmeyle ayrılır.",
  },

  // ——— Kesme işareti ———
  {
    category: "Kesme işareti",
    question: "Kısaltmaya gelen ek hangisinde doğru yazılmıştır?",
    options: ["TDK’nin", "TDK’nın", "TDKnın", "TDK’nun"],
    answer: "TDK’nın",
    explanation: "Kısaltmalara gelen ekler kesme işaretiyle ayrılır ve ek, kısaltmanın okunuşuna göre gelir: TDK’nın.",
  },
  {
    category: "Kesme işareti",
    question: "Hangisi doğru yazılmıştır?",
    options: ["Ahmett’e", "Ahmet’de", "Ahmet’te", "Ahmette"],
    answer: "Ahmet’te",
    explanation: "Özel adlara gelen çekim ekleri kesmeyle ayrılır; ünsüz benzeşmesine göre “t” gelir: Ahmet’te.",
  },
  {
    category: "Kesme işareti",
    question: "Hangisinde kesme işareti doğru kullanılmıştır?",
    options: ["TBMM’ye", "TBMMye", "TBMM’Ya", "TBMM ye"],
    answer: "TBMM’ye",
    explanation: "Kısaltmaya gelen ek, okunuşa uygun biçimde ve kesmeyle yazılır: TBMM’ye.",
  },

  // ——— İkilemeler ———
  {
    category: "İkilemeler",
    question: "Aşağıdakilerden hangisi doğru yazılmıştır?",
    options: ["yanyana", "yan yana", "yan-yana", "yan’yana"],
    answer: "yan yana",
    explanation: "İkilemeler ayrı yazılır: yan yana, peş peşe, baş başa.",
  },
  {
    category: "İkilemeler",
    question: "Aşağıdakilerden hangisi doğru yazılmıştır?",
    options: ["peşpeşe", "peş peşe", "peş-peşe", "peş’peşe"],
    answer: "peş peşe",
    explanation: "İkilemeler ayrı yazılır.",
  },
  {
    category: "İkilemeler",
    question: "Aşağıdakilerden hangisi doğru yazılmıştır?",
    options: ["başbaşa", "baş başa", "baş-başa", "baş’başa"],
    answer: "baş başa",
    explanation: "İkilemeler ayrı yazılır: baş başa, kol kola, el ele.",
  },

  // ——— Yazımı karıştırılanlar ———
  {
    category: "Yazımı karıştırılanlar",
    question: "“Tek başına, sadece” anlamındaki sözcüğün doğru yazımı hangisidir?",
    options: ["yanlız", "yalnız", "yanlızca", "yalnış"],
    answer: "yalnız",
    explanation: "Doğru yazım “yalnız”dır; “yanlız” yaygın bir yazım hatasıdır.",
  },
  {
    category: "Yazımı karıştırılanlar",
    question: "“Hata” anlamındaki sözcüğün doğru yazımı hangisidir?",
    options: ["yalnış", "yanlış", "yanlız", "yalnız"],
    answer: "yanlış",
    explanation: "Doğru yazım “yanlış”tır; “yalnış” yanlıştır.",
  },
  {
    category: "Yazımı karıştırılanlar",
    question: "Aşağıdakilerden hangisi doğru yazılmıştır?",
    options: ["Hoşçakal", "Hoşça kal", "Hoşça-kal", "Hoşçakal’"],
    answer: "Hoşça kal",
    explanation: "TDK’ye göre “hoşça kal” ayrı yazılır; “hoş geldin” de ayrıdır.",
  },
  {
    category: "Yazımı karıştırılanlar",
    question: "Aşağıdakilerden hangisi doğru yazılmıştır?",
    options: ["sağol", "sağ ol", "sağ-ol", "sagol"],
    answer: "sağ ol",
    explanation: "“Sağ ol, sağ olun” ayrı yazılır.",
  },
  {
    category: "Yazımı karıştırılanlar",
    question: "Aşağıdakilerden hangisi doğru yazılmıştır?",
    options: ["süpriz", "sürpriz", "sürbriz", "sürprizz"],
    answer: "sürpriz",
    explanation: "Doğru yazım “sürpriz”dir; halk arasında “süpriz” denilse de yazımı bu şekildedir.",
  },

  // ——— ne … ne ———
  {
    category: "Bağlaçlar",
    question: "Hangisi doğru yazılmıştır?",
    options: ["Ne yazdı ne çizdi.", "Neyazdı ne çizdi.", "Ne-yazdı ne-çizdi.", "Ne yazdıne çizdi."],
    answer: "Ne yazdı ne çizdi.",
    explanation: "“ne … ne …” bağlacı ayrı yazılır ve anlamı olumsuzdur.",
  },
];

export const defaultSettings = {
  correctImage: "assets/correct.svg",
  wrongImage: "assets/wrong.svg",
  roundSize: 12,
  pointsPerCorrect: 10,
};

export const defaultAdminPassword = "tdk2026";
