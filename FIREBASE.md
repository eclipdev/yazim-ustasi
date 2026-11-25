# Firebase kurulumu

Oyun Firebase olmadan da tamamen çalışır: oyuncular, sorular, cezalar ve sonuçlar
tarayıcıda saklanır. Firebase yalnızca şunlar için gerekir:

- tur sonuçlarının merkezî bir yerde toplanması,
- doğru/yanlış cevap görsellerinin bütün cihazlara ortak dağıtılması,
- (eski sürümden kalan) oyuncu hesaplarının panelden yönetilmesi.

Proje: `tdk26-dd1b2` · Konsol:
https://console.firebase.google.com/project/tdk26-dd1b2

## 1. Google girişini aç (yalnızca yönetici için)

Oyuncular artık hesap açmaz. Google girişi sadece yöneticinin görselleri
kaydetmesi ve eski oyuncu kayıtlarını yönetmesi için kullanılır.

1. Konsol → **Build → Authentication → Sign-in method**.
2. **Google** sağlayıcısını etkinleştir, destek e-postası olarak
   `eclipsoftware.dev@gmail.com` seç, **Kaydet**.
3. **Settings → Authorized domains** listesine şunları ekle:
   - `eclipdev.github.io`
   - `localhost` (yerel deneme için, zaten olabilir)

Eklemezsen Google penceresi "unauthorized domain" hatası verir.

## 2. Firestore'u başlat

Konsol → **Build → Firestore Database** → **Create database** (zaten varsa atla).

## 3. Güvenlik kuralları (zorunlu)

Firestore → **Rules** sekmesine aşağıdakini yapıştırıp **Publish** et.
Yönetici yetkisi `eclipsoftware.dev@gmail.com` Google hesabına verilmiştir.

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    function isAdmin() {
      return request.auth != null
        && request.auth.token.email == 'eclipsoftware.dev@gmail.com'
        && request.auth.token.email_verified == true;
    }

    function isOwner(uid) {
      return request.auth != null && request.auth.uid == uid;
    }

    match /results/{doc} {
      allow create: if request.resource.data.keys().hasAll(
        ['name','schoolNo','score','correct','total','percent']
      );
      allow read, update, delete: if false;
    }

    match /players/{uid} {
      // Genel sıralama herkese açık; okul numarası ayrı özel belgede tutulur.
      allow get, list: if true;

      // Kişisel çalışmada öğrenci kendi belgesini oluşturur.
      allow create: if isOwner(uid)
        && request.resource.data.uid == uid
        && request.resource.data.banned == false
        && request.resource.data.keys().hasOnly(
          ['uid','name','className','team','flagged','updatedAt','banned','total','days']
        );

      // Öğrenci kendi profilini ve puanını günceller. Banı değiştiremez;
      // yönetici tarafından işaretlenen adı kendisi temizleyemez.
      allow update: if (
          isOwner(uid)
          && request.resource.data.diff(resource.data).affectedKeys().hasOnly(
            ['uid','name','className','team','flagged','updatedAt','schoolNo','total','days']
          )
          && request.resource.data.banned == resource.data.banned
          && (resource.data.flagged != true || request.resource.data.flagged == true)
        ) || (
          isAdmin()
          && request.resource.data.diff(resource.data).affectedKeys().hasOnly(['banned','flagged'])
        );

      allow delete: if false;

      match /private/{doc} {
        allow read: if isAdmin() || isOwner(uid);
        allow write: if isOwner(uid) || isAdmin();
      }
    }

    // Ortak ayarlar (doğru/yanlış görsel listesi): herkes okur, yalnızca yönetici yazar.
    match /config/{doc} {
      allow read: if true;
      allow write: if isAdmin()
        && request.resource.data.correctImages is list
        && request.resource.data.wrongImages is list
        && request.resource.data.correctImages.size() <= 50
        && request.resource.data.wrongImages.size() <= 50;
    }

    match /students/{no} {
      allow read, write: if false;
    }
  }
}
```

Bu kuralların anlamı:

- Oyun sonucu yalnızca **eklenebilir**; kimse okuyamaz, değiştiremez, silemez.
  Sonuçları görmek için yönetici panelindeki "Firebase'den çek" işlemi de kapalı
  kalır; merkezî tablo için yönetici tarayıcısında okuma izni açman gerekir.
- `players` belgesini öğrenci yalnızca **kendi uid'si** için oluşturur ve günceller;
  bu belge genel sıralamada okunur. Okul numarası `players/{uid}/private/info`
  içinde tutulur ve yalnızca sahibi ile yönetici okuyabilir.
- Öğrenci `banned` alanını değiştiremez; adı bir kez `flagged` olduysa kendisi
  temizleyemez. Yönetici yalnızca `banned` ve `flagged` alanlarını değiştirebilir.
- `students` koleksiyonu eski sürümden kalmadır ve kapalıdır. İstersen Konsol'dan
  silebilirsin.

Bu kurallar kişisel çalışmanın puan yazması için **zorunludur**; eski yalnızca
tahta oyunu sürümünün kuralları `players` yazımını kapatıyordu.

> Not: Panelde "Sonuçlar → Firebase'den çek" düğmesi `results` okuması ister.
> Önerilen kural okumayı kapattığı için bu düğme "çekilemedi" der; bu normaldir.
> Merkezî sonuçları görmek istersen kuralı geçici olarak
> `allow read: if isAdmin();` yapabilirsin.

## 4. Bağlantıyı kontrol et

1. Yönetici paneli → **Firebase** sekmesi → **Bağlantıyı test et**.
2. **Oyuncular** sekmesinden yönetici Google hesabıyla giriş yap.
3. Bir tur oyna ve oyunu bitir. Sonuç `results` koleksiyonuna düşmelidir.
4. Panelde **Sonuçlar** sekmesinde yerel kayıtlar görünür.

## 5. Koleksiyonlar

**results** (her oyuncu için bir satır):

| Alan | Açıklama |
| --- | --- |
| `name` | Oyuncu ya da takım adı |
| `className` | Kaç oyunculu oyun, örneğin `2 oyunculu` |
| `schoolNo` | Kullanılmıyor, uyumluluk için `-` |
| `score` | Doğru sayısı × 10 |
| `correct` | Doğru cevap sayısı |
| `total` | Cevaplanan kart sayısı |
| `percent` | Başarı yüzdesi |
| `at` | Turun tarihi (ISO) |
| `gameId` | Oyunun kimliği |
| `winner` | Kazanan mı? |
| `position` | Tahtadaki son kare |
| `penalties` | Yanlış cevap / ceza sayısı |
| `escapes` | Cezadan kurtulma sayısı |

**config/visuals**: Doğru ve yanlış görsel listeleri (`correctImages`,
`wrongImages`). Yalnızca bağlantılar tutulur; yönetici panelinden kaydedilir ve
bütün cihazlarda aynı liste görünür.

**players/{uid}**: Eski sürümden kalan oyuncu hesapları. Yeni oyun bu koleksiyona
yazmaz.

## 6. Dikkat edilecekler

- Oyuncu adları takma ad olabilir; okul numarası ve e-posta istenmez.
- `results` belgeleri veritabanına erişebilen kişilerce okunabilir. Oyuncu adı
  olarak gerçek ad-soyad yazılması zorunlu değildir.
- Kurallar sunucu tarafında doğrulanır; istemci kodu değiştirilse de kural dışı
  yazma reddedilir.
