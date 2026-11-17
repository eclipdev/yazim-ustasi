# Firebase kurulumu

Site Firebase olmadan da çalışır; ama Google girişi, puan kaydı, sıralama ve
yönetici işlemleri için Firebase gerekir. Proje: `tdk26-dd1b2`.
Konsol: https://console.firebase.google.com/project/tdk26-dd1b2

## 1. Google girişini aç

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
Yönetici yetkisi `eclipsoftware.dev@gmail.com` Google hesabına verilmiştir; bu
hesapla yönetici panelinde giriş yapılınca oyuncuları gizleyip banlayabilirsin.

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    function isAdmin() {
      return request.auth != null
        && request.auth.token.email == 'eclipsoftware.dev@gmail.com'
        && request.auth.token.email_verified == true;
    }

    match /results/{doc} {
      allow create: if request.resource.data.keys().hasAll(
        ['name','schoolNo','score','correct','total','percent']
      );
      allow read, update, delete: if false;
    }

    match /players/{uid} {
      allow get, list: if true;

      allow create: if request.auth != null
        && request.auth.uid == uid
        && request.resource.data.get('banned', false) == false
        && request.resource.data.name is string
        && request.resource.data.className is string
        && request.resource.data.team in ['gurbuz', 'suleyman'];

      allow update: if (
          request.auth != null
          && request.auth.uid == uid
          && resource.data.get('banned', false) == false
          && request.resource.data.get('banned', false) == resource.data.get('banned', false)
          && request.resource.data.get('team', '') in ['gurbuz', 'suleyman']
          && (request.resource.data.get('flagged', false) == resource.data.get('flagged', false)
              || request.resource.data.get('flagged', false) == true)
        ) || (
          isAdmin()
          && request.resource.data.diff(resource.data).affectedKeys().hasOnly(['banned', 'flagged'])
        );

      allow delete: if false;

      // Okul numarası: yalnızca hesabın sahibi ve yönetici okuyabilir.
      match /private/{doc} {
        allow read: if request.auth != null
          && (request.auth.uid == uid || isAdmin());
        allow write: if request.auth != null && request.auth.uid == uid;
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

- Öğrenci yalnızca kendi `players/{uid}` belgesine yazabilir ve kendi bayrağını
  kaldıramaz.
- Banlanmış hesap (`banned: true`) hiçbir şey yazamaz; puanı kaydedilmez.
- Yönetici yalnızca `banned` ve `flagged` alanlarını değiştirebilir.
- `students` koleksiyonu eski sürümden kalmadır ve kapalıdır. İstersen Konsol'dan
  silebilirsin.

## 4. Bağlantıyı kontrol et

Yönetici paneli → **Firebase** → **Bağlantıyı test et**. Sonra ana sayfada
**Google ile giriş yap** ile bir hesap aç; sınıfını ve okul numaranı yazıp
bir tur çöz. Puan `players` koleksiyonunda belirmeli.

## 5. Koleksiyonlar

**players/{uid}** (her Google hesabı için bir belge):

| Alan | Açıklama |
| --- | --- |
| `uid` | Google hesabının kimliği |
| `name` | Ad soyad |
| `className` | Sınıf, örneğin `11-A` |
| `team` | `gurbuz` (Gürbüz Team) ya da `suleyman` (Süleyman Team) |
| `total` | Toplam puan |
| `days` | Gün gün puan: `days.YYYY-MM-DD` |
| `flagged` | `true` ise sıralamada gizlenir (isim filtresi veya yönetici) |
| `banned` | `true` ise hesap puan kazanamaz ve girişi kapanır |

**players/{uid}/private/info**: Okul numarası (`schoolNo`). Yalnızca hesap sahibi
ve yönetici okuyabilir; herkese açık sıralamaya girmez.

**config/visuals**: Doğru ve yanlış görsel listeleri (`correctImages`, `wrongImages`).
Yalnızca bağlantılar tutulur; yönetici panelinden kaydedilir ve bütün öğrencilere aynı gelir.

**results**: Eski tur kayıtları (yönetici paneli için, yalnızca yazılır).

## 6. Dikkat edilecekler

- Sıralamada ad soyad kısaltılıp gösterilir (Yusuf Ö.). Okul numarası herkese
  açık `players` belgesinde değil, ayrı `private` alt belgesinde tutulur.
  `players` belgesindeki ad, sınıf ve puan ise veritabanını bilen biri tarafından
  okunabilir; bu bilinçli bir karardır ve gizlilik metninde yazılıdır.
- İsim filtresi bir ön filtredir; her küfürü yakalamaz. Yakalanan hesap sıralamada
  gizlenir ve yönetici panelinden açılabilir.
- Kurallar sunucu tarafında doğrulanır; istemci kodu değiştirilse de banlı hesap
  yazamaz.
