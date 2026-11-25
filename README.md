# Doğru Yazarım İyi Oynarım

TÜBİTAK 4006 Bilim Fuarı için hazırlanan “Doğru Yazarım İyi Oynarım” kutu
oyununun dijital sürümü. 30 karelik yazım tahtasında iki kişi ya da iki takım
yarışır; doğru cevap bir kare ilerletir, yanlış cevap ceza kartı çektirir.
Çizgili defter görünümlü arayüz, TDK yazım kurallarına dayalı soru bankası ve
isteğe bağlı Firebase bağlantısı içerir. Açılış menüsünden iki moddan biri
seçilir: **tahta oyunu** ya da Google hesabıyla **kişisel çalışma**.

## Nasıl oynanır?

1. Tahtada **30 kare** vardır. Oyuncular sırayla, bulundukları karenin rengindeki
   kartı çeker.
2. Kartta aynı sözün yanlış ve doğru yazımı bulunur; oyuncu doğru olanı seçer.
3. Doğru cevap oyuncuyu **bir kare ilerletir**; sıra arkadaşına geçer.
4. Yanlış cevapta **ceza kartı** çekilir. Ceza kartını doğru bilen yerinde kalır;
   bilemeyen **bir kare geri** gider.
5. 30. kareye ilk ulaşan kazanır. İki oyunculu bir oyunda toplamda yaklaşık
   **60 kart** cevaplanır.

Her karenin rengi bir yazım konusunu gösterir: de / da, ki, mi, şey, birleşik
kelimeler, sayılar, büyük harf, kesme işareti, ikilemeler, düzeltme işareti ve
yazımı karıştırılanlar. Altın renkli kareler “sürpriz”dir; kart rastgele bir
konudan gelir.

Oyun sırasında ilerleme tarayıcıda saklanır. Sayfa kapanıp açılırsa kurulum
ekranında “Yarım kalan oyun var” kartı çıkar; oradan devam edilebilir.

Kurulum ekranında **Kişiler** ya da **Takımlar** seçilir. Takım modunda ilk
sürümdeki **Gürbüz Team** ve **Süleyman Team** adları hazır gelir; oyuncular
istersen adları değiştirebilir. Takım sonuçları da kişisel sıralamada “Takım”
türüyle görünür.

## Kişisel çalışma (Google ile)

Açılış menüsündeki **Çalışmaya başla** düğmesi `kisisel.html` sayfasını açar.
Öğrenci Google hesabıyla giriş yapar; ad soyad, sınıf, takım ve okul numarasını
bir kez yazar. Her tur **12 soru** içerir ve her soru için **10 saniye** vardır:

- Doğru cevap **10 puan** kazandırır; süre dolarsa soru yanlış sayılır ve doğru
  seçenek gösterilir.
- Son üç saniyede süre göstergesi kırmızıya döner.
- Tur sonunda puan hesaba yazılır: Firestore’da `players/{uid}` toplamı ve günlük
  puanı güncellenir, ayrıca `results` koleksiyonuna `mode: "kisisel"` satırı
  eklenir.
- Giriş ekranındaki **Genel sıralama** Firebase’deki oyuncuları puana göre
  listeler; takımı olan oyuncunun yanında Gürbüz ya da Süleyman logosu görünür.
- Firebase bağlantısı yoksa puan yerelde (localStorage) birikir ve sıralama
  “yüklenemedi” uyarısı verir; çalışma yine de sürer.

Tahta oyununda süre yoktur; sıra tabanlı oyun kendi kurallarıyla ilerler.

## Kurulum

Derleme adımı yok; statik dosyalar.

```bash
# yerelde denemek için (herhangi bir statik sunucu yeterli)
python -m http.server 8080
# veya
npx serve .
```

Sonra `http://localhost:8080` adresini aç. `type="module"` scriptleri için
sunucu gerekir; `index.html` dosyasını doğrudan çift tıklamak önerilmez.

## Chrome'da uygulama gibi kurma (PWA)

Site bir web uygulaması (PWA) olarak da kurulabilir. GitHub Pages adresinde
(https) ya da `localhost` üzerinde açıldığında Chrome adres çubuğunda bir
**Yükle** simgesi gösterir; **Yükle** deyince site masaüstüne ve başlat menüsüne
kendi simgesiyle eklenir, adres çubuğu olmayan ayrı bir pencerede açılır.

Sayfanın üst çubuğundaki **Uygulamayı yükle** düğmesi aynı kurulum penceresini
açar. Düğme yalnızca kurulum mümkünken görünür: site zaten kuruluysa, uygulama
penceresinde açıldıysa ya da masaüstü (Electron) sürümündeyse gizlenir. iPhone ve
iPad'de Safari kurulum penceresi açmadığı için düğme "Paylaş → Ana Ekrana Ekle"
yolunu gösterir. Dar ekranda yalnızca simgesi görünür.

- Kurulduktan sonra site dosyaları önbelleğe alınır; **internet olmadan da**
  tahta oyunu ve sorular açılır. Google girişi, genel sıralama ve Firebase
  bağlantısı doğal olarak internet ister.
- Exe'den farkı: Chrome kurulu olmalı ve siteye bir kez erişilmelidir. Artısı:
  Windows "tanınmayan uygulama" uyarısı çıkmaz, Google girişi sorunsuz çalışır,
  site güncellenince kısayol yeni sürümü açar.
- Masaüstü (Electron) kabukta service worker bilerek kapatılır; orada dosyalar
  zaten uygulamanın içinden sunulur.
- Site içeriği değiştiğinde `sw.js` dosyasındaki `VERSION` değerini artırın;
  yoksa kurulu kopya eski önbelleği göstermeye devam eder.

## Yönetim paneli

- Adres: `admin.html`
- İlk şifre: **kaptan** — panelin “Ayarlar” sekmesinden değiştirilebilir.
- Not: Bu şifre yalnızca tarayıcıda tutulur ve gerçek bir kimlik doğrulama
  değildir; site halka açıksa paneli gizli tutmak için yeterli değildir.

Sekmeler:

- **Ayarlar:** Doğru/yanlış cevap görselleri (URL ya da dosya), oyun kuralları
  özeti ve panel şifresi.
- **Sorular:** Soru bankası ve ceza destesi JSON olarak düzenlenir; şablon ekleme,
  JSON indirme/yükleme ve varsayılanlara dönme vardır.
- **Sonuçlar:** Bu tarayıcıdaki turlar ve Firebase’deki genel puan tablosu.
  Tabloda her satırın **Tür** sütunu oyunu, takımı ya da kişisel çalışmayı
  gösterir. Üstteki **Kişisel sıralama** kartı her adı tek satırda toplar;
  satırlar Gürbüz Team ve Süleyman Team logolarıyla birlikte “Takım”, “Kişisel”,
  “Karışık” ya da “Oyun” etiketi taşır.
- **Oyuncular:** Firebase’deki hesapların listesi; gizleme ve banlama. Tahta
  oyunu hesap açmaz; kişisel çalışma Google hesabını kullanır.
- **Firebase:** Web yapılandırmasını yapıştırma, bağlantıyı test etme ve kaldırma.

Görselleri ve oyuncu işlemlerini kaydetmek için **Oyuncular** sekmesinden yönetici
Google hesabıyla giriş gerekir. Sorular, cezalar ve yerel sonuçlar girişsiz
kaydedilir.

### Soru ve ceza kartı biçimi

Her kayıt aynı sözün yanlış ve doğru yazımını iki seçenek olarak sunar.

```json
{
  "category": "şey",
  "question": "Doğru yazımı seç.",
  "options": ["herşey", "her şey"],
  "answer": "her şey",
  "explanation": "“Şey” sözcüğü her zaman ayrı yazılır."
}
```

- `answer`, `options` içindeki doğru seçeneğin **birebir** kopyası olmalı.
- `category` etiketi tahtadaki kareyle eşleşmeli. Kullanılan etiketler:
  `de / da`, `ki bağlacı`, `mi soru eki`, `şey`, `Birleşik kelimeler`, `Sayılar`,
  `Büyük harf`, `Kesme işareti`, `İkilemeler`, `Düzeltme işareti`,
  `Yazımı karıştırılanlar`. Ceza kartlarında `Ceza` yazılır.
- Ceza destesi ayrı bir JSON dizisidir; yanlış cevaptan sonra bu desteden rastgele
  kart çekilir.

Soru bankası ve ceza destesi tarayıcıda saklanır. Başka bir cihazda/öğrencide
görünmesi için ya JSON dosyasını içe aktar ya da varsayılanları `js/data.js`
içinde düzenleyip yeniden yayınla.

## Firebase

Adım adım kılavuz: [FIREBASE.md](FIREBASE.md). Özetle:

- Projenin web yapılandırması `js/firebase.js` içinde hazır (`tdk26-dd1b2`).
- Tahta oyunu ve kişisel tur sonuçları Firestore’daki `results` koleksiyonuna
  yazılır; her oyuncu ya da tur için bir satır oluşur.
- Kişisel çalışma ayrıca `players/{uid}` belgesindeki toplamı ve günlük puanı
  günceller; genel sıralama bu belgeleri okur.
- Firestore → Rules bölümüne `FIREBASE.md`’deki **güncel** kuralları yapıştırıp
  yayınlamak gerekir. Bu kurallar `results` için yalnızca yazmaya izin verir;
  `players` belgesini ise yalnızca sahibi oluşturup güncelleyebilir.
- Panel → **Firebase** sekmesinden başka bir proje girilebilir ya da bağlantı
  kapatılabilir.
- Bağlantı yokken tahta oyunu tamamen localStorage ile çalışır. Kişisel çalışma
  Google girişi ister; giriş yapılamazsa puanlar yalnızca yerelde birikir.

## Masaüstü sürümü

`masaustu/` klasöründe Electron ile açılan küçük bir masaüstü kabuk var. Uygulama
dosyaları `file://` üzerinden değil, kendi içindeki küçük bir yerel sunucudan
yüklenir; böylece ES modülleri ve localStorage normal çalışır. Sunucu sabit
`47831` portunu kullanır; port doluysa boş bir portla açılır.

```bash
cd masaustu
npm install
npm start
```

Windows için tek dosyalık taşınabilir exe üretmek:

```bash
cd masaustu
npm run dist
```

Çıktı: `masaustu/dist/Dogru-Yazarim-Iyi-Oynarim-1.0.0.exe`. Exe açıldığında
site dosyaları uygulamanın içinden sunulur; kurulum gerektirmez. Oyun ilerlemesi
ve sonuçlar exe'nin kendi tarayıcı deposunda tutulur, tarayıcıdaki kayıtlarla
paylaşılmaz. İlk derlemede Electron ve electron-builder indirildiği için internet
gerekir.

Tahta oyunu masaüstünde sorunsuz çalışır. Google girişli kişisel çalışma için
tarayıcı sürümü önerilir: Google, gömülü tarayıcı pencerelerindeki oturum
açmayı güvenlik gerekçesiyle engelleyebilir.

Arayüz, projenin mevcut defter tasarımını korumak için Bootstrap yerine kendi
CSS sistemiyle hazırlandı; Bootstrap'a bağımlılık yoktur.

## Dosya yapısı

```
index.html            # menü + tahta oyunu (kurulum, tahta, kart, sonuç)
kisisel.html          # Google girişli kişisel çalışma + genel sıralama
admin.html            # yönetim paneli
yasal.html            # gizlilik, KVKK hakları, kullanım koşulları
manifest.webmanifest  # PWA tanımı (uygulama olarak kurulabilir)
sw.js                 # çevrimdışı önbellek (service worker)
css/style.css         # ana tasarım
css/admin.css         # panelin ek stilleri
js/data.js            # kategoriler, tahta, soru bankası, ceza destesi
js/game-core.js       # arayüzden bağımsız oyun kuralları
js/game.js            # tahta oyunu arayüzü ve menü akışı
js/app.js             # kişisel çalışma: giriş, 10 sn süre, tur sonucu
js/progress.js        # günlük/toplam puan defteri
js/teams.js           # Gürbüz Team / Süleyman Team bilgileri
js/moderation.js      # ad kontrolü
js/store.js           # localStorage katmanı
js/firebase.js        # Google girişi ve Firestore köprüsü
js/admin.js           # panel mantığı
js/theme-boot.js      # ilk boyamadan önce tema
js/pwa.js             # service worker kaydı (PWA)
masaustu/             # isteğe bağlı Electron kabuğu
assets/               # simgeler, takım logoları, varsayılan görseller
assets/icons/         # PWA simgeleri (180, 192, 512, maskable)
```

## GitHub Pages

Depo GitHub’a atıldıktan sonra: **Settings → Pages → Branch: `main` / root**.
Site `https://<kullanıcı>.github.io/<depo>/` adresinde yayınlanır.

## Lisans

Eğitim amaçlı proje. Soru metinleri TDK yazım kurallarına dayanır; TDK, MEB veya
TÜBİTAK ile resmî bir bağlantısı yoktur.
