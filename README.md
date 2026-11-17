# Yazım Ustası

TDK yazım kuralları üzerine kurulu, çizgili defter görünümlü bir soru-cevap sitesi.
Öğrenci adı ve okul numarasıyla giriş yapar, her turda rastgele sorular çözer,
doğru cevaplar kadar puan toplar.

## Neler var?

- **Giriş:** Ad soyad + okul numarası (tarayıcıda saklanır, sonraki girişte hazır gelir).
- **Soru turu:** Varsayılan olarak 12 rastgele soru; kategori ve açıklama içerir.
- **Puanlama:** Her doğru cevap 10 puan (panelden değiştirilebilir).
- **Görsel geri bildirim:** Doğru ve yanlış cevap için ayrı görseller; panelden URL
  yapıştırarak ya da dosya yükleyerek değiştirilebilir. Şimdilik yer tutucu SVG'ler var.
- **Yönetim paneli (`admin.html`):** Görseller, tur ayarları, soru bankası (JSON),
  sonuçlar ve Firebase bağlantısı. Şifre düz metin olarak değil, SHA-256 özeti
  olarak saklanır; 5 hatalı denemeden sonra 30 saniyelik bekleme uygulanır.
- **Gizlilik ve yasal:** Ad + okul numarası için girişte açık izin kutusu; alt
  bilgide Hakkımızda, Gizlilik, KVKK/Kullanıcı Hakları, Kullanım Koşulları ve
  İletişim bağlantıları (`yasal.html`).
- **Firebase (isteğe bağlı):** Yapılandırılırsa her tur sonucu Firestore'a yazılır;
  yapılandırılmazsa site localStorage ile çalışır.
- **Defter arayüzü:** Bütün site krem renkli çizgili bir defter sayfası; doğru cevap
  sarı fosforla, yanlış cevap kırmızı kalemle işaretlenir. Fraunces ve Atkinson
  Hyperlegible yazı tipleri siteye gömülüdür; azaltılmış hareket desteği vardır.

## Kurulum

Derleme adımı yok; statik dosyalar.

```bash
# yerelde denemek için (herhangi bir statik sunucu yeterli)
python -m http.server 8080
# veya
npx serve .
```

Sonra `http://localhost:8080` adresini aç. Doğrudan `index.html` dosyasını çift
tıklayarak da açabilirsin; ancak `type="module"` scriptleri için sunucu önerilir.

## Yönetim paneli

- Adres: `admin.html`
- İlk şifre: **kaptan** — panelin "Ayarlar" sekmesinden değiştirebilirsin.
- Not: Bu şifre yalnızca tarayıcıda tutulur ve gerçek bir kimlik doğrulama değildir;
  site halka açıksa paneli gizli tutmak için yeterli değildir. Panelde hassas veri
  bulundurma.

### Görselleri değiştirmek

1. `admin.html` → **Ayarlar**.
2. "Doğru cevap görseli" / "Yanlış cevap görseli" bölümünde URL yapıştır ya da dosya yükle.
3. **Görselleri kaydet**.

Yüklenen dosyalar base64 olarak tarayıcıda saklanır (dosya başına en fazla 1,5 MB).

### Soruları değiştirmek

**Sorular** sekmesinde JSON düzenlenir. Her soru, aynı kelimenin yanlış ve doğru
yazımını iki seçenek olarak sunar; öğrenci doğru olanı seçer.

```json
{
  "category": "şey",
  "question": "Doğru yazımı seç.",
  "options": ["herşey", "her şey"],
  "answer": "her şey",
  "explanation": "“Şey” sözcüğü her zaman ayrı yazılır."
}
```

"Sorular" tarayıcıda saklanır; başka bir cihazda/öğrencide görünmesi için ya JSON
dosyasını içe aktar ya da soruları `js/data.js` içindeki varsayılan bankaya taşıyıp
yeniden yayınla.

## Firebase

Adım adım kılavuz: [FIREBASE.md](FIREBASE.md). Özetle:

- Projenin web yapılandırması `js/firebase.js` içinde hazır (`tdk26-dd1b2`).
- Sonuçların Firestore'a yazılması için **Firestore → Rules** bölümüne
  `FIREBASE.md`'deki kuralları yapıştırıp yayınlaman gerekir.
- Panel → **Firebase** sekmesinden başka bir proje girilebilir ya da bağlantı
  kapatılabilir.

## Dosya yapısı

```
index.html          # öğrenci arayüzü
admin.html          # yönetim paneli
yasal.html          # gizlilik, KVKK hakları, kullanım koşulları
css/style.css       # ana tasarım
css/admin.css       # panelin ek stilleri
js/data.js          # varsayılan soru bankası + ayarlar
js/store.js         # localStorage katmanı
js/firebase.js      # isteğe bağlı Firestore köprüsü
js/app.js           # sınav mantığı
js/admin.js         # panel mantığı
js/splash.js        # her yenilemede açılış ekranı
js/theme-boot.js    # ilk boyamadan önce tema
assets/             # simge ve yer tutucu görseller
```

## GitHub Pages

Depo GitHub'a atıldıktan sonra: **Settings → Pages → Branch: `main` / root**.
Site `https://<kullanıcı>.github.io/<depo>/` adresinde yayınlanır.

## Lisans

Eğitim amaçlı örnek proje. Soru metinleri TDK yazım kurallarına dayanır; TDK ile
resmî bir bağlantısı yoktur.
