# Firebase kurulumu

Site Firebase olmadan da çalışır (sonuçlar tarayıcıda tutulur). Firebase'i
bağlarsan her tur sonucu Firestore'a da yazılır; böylece farklı cihazlardaki
öğrencilerin sonuçlarını tek yerde toplayabilirsin.

## 1. Proje oluştur

1. [Firebase Konsolu](https://console.firebase.google.com/) → **Proje ekle**.
2. İsim ver (örn. `yazim-ustasi`). Google Analytics'i kapatabilirsin.

## 2. Web uygulaması ekle

1. Proje ana sayfasında **`</>`** (Web) simgesine tıkla.
2. Uygulamaya bir takma ad ver (örn. `yazim-ustasi-web`).
3. Firebase sana şuna benzer bir yapılandırma verir:

```json
{
  "apiKey": "AIza...",
  "authDomain": "yazim-ustasi.firebaseapp.com",
  "projectId": "yazim-ustasi",
  "storageBucket": "yazim-ustasi.appspot.com",
  "messagingSenderId": "1234567890",
  "appId": "1:1234567890:web:abcd1234"
}
```

Bu anahtar **gizli değildir**; web uygulamalarında herkese açıktır. Koruma
Firestore kurallarıyla yapılır.

## 3. Firestore'u başlat

1. Sol menü → **Build → Firestore Database → Create database**.
2. Konum seç, **Production mode** ile başla (kuralları aşağıda ayarlayacağız).

## 4. Yapılandırmayı siteye gir

1. Sitenin `admin.html` sayfasını aç.
2. **Firebase** sekmesine geç.
3. Yapılandırma JSON'unu yapıştır ve **Kaydet**.
4. **Bağlantıyı test et** ile doğrula.

## 5. Güvenlik kuralları

Firestore → **Rules** sekmesine aşağıdakini yapıştırıp yayınla:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /results/{doc} {
      allow create: if request.resource.data.keys().hasAll(
        ['name','schoolNo','score','correct','total','percent']
      );
      allow read, update, delete: if false;
    }
  }
}
```

- `allow create`: site yeni sonuç yazabilir.
- `allow read: if false`: sonuçları kimse okuyamaz. Paneldeki "Firebase'den çek"
  düğmesini kullanmak istersen geçici olarak `allow read: if true;` yapabilirsin;
  ancak bu, öğrenci adı ve numaralarını herkese açar. Kalıcı çözüm için Firebase
  Authentication ekleyip okumayı yalnızca yöneticiye vermek gerekir.

> Not: Bu temel sürümde gerçek bir yönetici kimlik doğrulaması yok. Kontrollü bir
> okul ortamı dışında `read` iznini açık bırakma.

## 6. Koleksiyon

İlk sonuç yazıldığında `results` koleksiyonu otomatik oluşur. Her belge:

| Alan | Örnek |
| --- | --- |
| `name` | `Yusuf Önal` |
| `schoolNo` | `1234` |
| `score` | `120` |
| `correct` | `12` |
| `total` | `12` |
| `percent` | `100` |
| `at` | ISO tarih (istemciden) |
| `createdAt` | Sunucu zaman damgası |

## Sorun giderme

- **Test başarısız:** Yapılandırmayı kaydettikten sonra test et; sayfayı yenilemek
  gerekmez (panel önbelleği sıfırlar).
- **`permission-denied`:** Kuralları yayınladığından ve koleksiyon adının `results`
  olduğundan emin ol.
- **`api-key-not-valid`:** `apiKey` alanını kopyalarken tırnakları dahil etmediğinden
  emin ol; panel JSON bekler.
