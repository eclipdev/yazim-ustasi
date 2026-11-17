# Yazım Ustası

TDK yazım kuralları üzerine kurulu, Apple esintili sade bir soru-cevap sitesi.
Öğrenci adı ve okul numarasıyla giriş yapar, her turda rastgele sorular çözer,
doğru cevaplar kadar puan toplar.

## Neler var?

- **Giriş:** Ad soyad + okul numarası (tarayıcıda saklanır, sonraki girişte hazır gelir).
- **Soru turu:** Varsayılan olarak 12 rastgele soru; kategori ve açıklama içerir.
- **Puanlama:** Her doğru cevap 10 puan (panelden değiştirilebilir).
- **Görsel geri bildirim:** Doğru ve yanlış cevap için ayrı görseller; panelden URL
  yapıştırarak ya da dosya yükleyerek değiştirilebilir. Şimdilik yer tutucu SVG'ler var.
- **Yönetim paneli (`admin.html`):** Görseller, tur ayarları, soru bankası (JSON),
  sonuçlar ve Firebase bağlantısı.
- **Firebase (isteğe bağlı):** Yapılandırılırsa her tur sonucu Firestore'a yazılır;
  yapılandırılmazsa site localStorage ile çalışır.
- **Apple tarzı arayüz:** Sistem fontu, translüzen yüzeyler, yumuşak yaylar, koyu/açık
  tema, azaltılmış hareket ve azaltılmış şeffaflık desteği, mobil için `dvh` ve
  dokunma geri bildirimi.

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

1. Firebase Konsolu'nda proje oluştur, bir web uygulaması ekle.
2. Firestore'u başlat.
3. Web yapılandırmasını `admin.html` → **Firebase** sekmesine yapıştır ve kaydet.
4. Güvenlik kurallarını kılavuzdaki gibi ayarla.

## Dosya yapısı

```
index.html          # öğrenci arayüzü
admin.html          # yönetim paneli
css/style.css       # ana tasarım
css/admin.css       # panelin ek stilleri
js/data.js          # varsayılan soru bankası + ayarlar
js/store.js         # localStorage katmanı
js/firebase.js      # isteğe bağlı Firestore köprüsü
js/app.js           # sınav mantığı
js/admin.js         # panel mantığı
assets/             # simge ve yer tutucu görseller
```

## GitHub Pages

Depo GitHub'a atıldıktan sonra: **Settings → Pages → Branch: `main` / root**.
Site `https://<kullanıcı>.github.io/<depo>/` adresinde yayınlanır.

## Lisans

Eğitim amaçlı örnek proje. Soru metinleri TDK yazım kurallarına dayanır; TDK ile
resmî bir bağlantısı yoktur.
