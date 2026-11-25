# Firebase kurulumu

Tahta oyunu Firebase olmadan da tamamen çalışır: oyuncular, sorular, cezalar ve
sonuçlar tarayıcıda saklanır. Firebase şunlar için gerekir:

- **kişisel çalışma**: öğrencinin Google ile girmesi, puanının hesabına
  (`players/{uid}`) yazılması ve genel sıralama,
- tur sonuçlarının merkezî bir yerde toplanması (`results`),
- doğru/yanlış cevap görsellerinin bütün cihazlara ortak dağıtılması,
- yöneticinin oyuncuları panelden yönetmesi (yasaklama, isim işareti).

Proje: `tdk26-dd1b2` · Konsol:
https://console.firebase.google.com/project/tdk26-dd1b2

## 1. Google girişini aç

Google girişini iki grup kullanır:

- **Öğrenciler**, kişisel çalışmada (`kisisel.html`) kendi Google hesaplarıyla
  girer; puanları bu hesaba yazılır. Tahta oyunu hesap istemez.
- **Yönetici** (`eclipsoftware.dev@gmail.com`), panelde görselleri kaydetmek ve
  oyuncuları yönetmek için girer.

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
tahta oyunu sürümünün kuralları `players` yazımını kapatıyordu. Kurallar
yayınlanmazsa kişisel çalışmada "Hesap kaydedilemedi (permission-denied)" hatası
görülür; puan yalnızca o tarayıcıda kalır.

> Bilinen sınır: öğrenci kendi `total` ve `days` alanlarını yazabildiği için puan
> istemciden gelir. Kodu değiştiren biri puanını şişirebilir. Sıralama okul içi
> bir yarışma için yeterlidir; kesin doğrulama gerekirse puan bir Cloud Function
> ile sunucuda hesaplanmalıdır.

> Not: Panelde "Sonuçlar → Firebase'den çek" düğmesi `results` okuması ister.
> Önerilen kural okumayı kapattığı için bu düğme "çekilemedi" der; bu normaldir.
> Merkezî sonuçları görmek istersen kuralı geçici olarak
> `allow read: if isAdmin();` yapabilirsin.

## 4. Bağlantıyı kontrol et

1. Yönetici paneli → **Firebase** sekmesi → **Bağlantıyı test et**. Bu düğme
   `results` koleksiyonuna "Bağlantı Testi" adlı bir kayıt yazar.
2. **Oyuncular** sekmesinden yönetici Google hesabıyla giriş yap; oyuncu listesi
   gelmelidir.
3. Tahta oyununda bir oyunu bitir. Sonuç `results` koleksiyonuna düşmelidir.
4. `kisisel.html` sayfasında bir öğrenci hesabıyla girip bir tur bitir.
   `players/{uid}` belgesinde `total` artmalı ve ana ekran sıralamasında ad
   görünmelidir.
5. Panelde **Sonuçlar** sekmesinde yerel kayıtlar görünür.

## 5. Koleksiyonlar

**results** (her oyun sonunda oyuncu ya da takım başına bir satır; kişisel
çalışmada tur başına bir satır). Yalnızca eklenir, kimse okuyamaz:

| Alan | Açıklama |
| --- | --- |
| `name` | Oyuncu, takım ya da öğrenci adı |
| `className` | Tahta oyununda `2 oyunculu` / `2 takımlı`; kişisel çalışmada sınıf |
| `mode` | `kisi`, `takim` (tahta oyunu) ya da `kisisel` (kişisel çalışma) |
| `team` | Takım kimliği (Gürbüz Team / Süleyman Team) ya da boş |
| `schoolNo` | Tahta oyununda `-`; kişisel çalışmada öğrencinin okul numarası |
| `uid` | Yalnızca kişisel çalışmada: öğrencinin Google hesap kimliği |
| `score` | Tahta oyununda doğru sayısı × 10; kişisel çalışmada tur puanı |
| `correct` | Doğru cevap sayısı |
| `total` | Cevaplanan kart / soru sayısı |
| `percent` | Başarı yüzdesi |
| `at` | Turun tarihi (ISO) |
| `gameId` | Yalnızca tahta oyunu: oyunun kimliği |
| `winner` | Yalnızca tahta oyunu: kazanan mı? |
| `position` | Yalnızca tahta oyunu: tahtadaki son kare |
| `penalties` | Yalnızca tahta oyunu: yanlış cevap / ceza sayısı |
| `escapes` | Yalnızca tahta oyunu: cezadan kurtulma sayısı |

**players/{uid}**: Kişisel çalışmadaki öğrenci hesapları. Herkes okuyabilir
(genel sıralama buradan gelir); öğrenci yalnızca kendi belgesini yazar.

| Alan | Açıklama |
| --- | --- |
| `uid` | Google hesap kimliği |
| `name`, `className` | Öğrencinin girdiği ad ve sınıf |
| `team` | Seçilen takım |
| `total` | Bütün turların toplam puanı |
| `days` | Gün gün `score`, `correct`, `total`, `rounds` |
| `banned` | Yönetici yasakladı mı? (sıralamada gizlenir) |
| `flagged` | İsim filtresine takıldı mı? (sıralamada gizlenir) |
| `updatedAt` | Son güncelleme zamanı |

**players/{uid}/private/info**: Öğrencinin okul numarası (`schoolNo`). Yalnızca
öğrencinin kendisi ve yönetici okuyabilir. Eski kayıtlarda ana belgede kalmış
`schoolNo` alanı, öğrenci profilini bir sonraki kaydedişinde silinir.

**config/visuals**: Doğru ve yanlış görsel listeleri (`correctImages`,
`wrongImages`). Yalnızca bağlantılar tutulur; yönetici panelinden kaydedilir ve
bütün cihazlarda aynı liste görünür.

**students**: Eski sürümden kalmadır, kapalıdır; uygulama kullanmaz.

## 6. Dikkat edilecekler

- Tahta oyununda oyuncu adları takma ad olabilir; hesap, okul numarası ya da
  e-posta istenmez.
- Kişisel çalışmada öğrenci Google ile girer ve okul numarasını yazar. Okul
  numarası herkese açık `players` belgesinde **tutulmaz**; ancak kişisel tur
  sonuçlarıyla birlikte `results` koleksiyonuna da yazılır. `results` okuması
  kapalı olduğu sürece bu numaraları kimse göremez. 3. bölümdeki nota göre
  `results` okumasını yöneticiye açarsan, yönetici okul numaralarını burada da
  görür.
- Genel sıralamada ad, sınıf, takım ve puan herkese açıktır. Öğrencilerin gerçek
  ad-soyad yerine takma ad kullanması tercih edilebilir.
- Kurallar sunucu tarafında doğrulanır; istemci kodu değiştirilse de kural dışı
  yazma reddedilir.
