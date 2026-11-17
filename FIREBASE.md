# Firebase kurulumu

Site Firebase olmadan da çalışır (sonuçlar tarayıcıda tutulur). Projenin web
yapılandırması `js/firebase.js` içinde hazır durumda; site Firestore'a bağlanmayı
dener. **Yazmanın çalışması için Firestore kurallarını bir kez yayınlaman gerekir**
(aşağıdaki 5. adım). Kurallar yayınlanmazsa Firebase "permission denied" döner ve
sonuç yalnızca tarayıcıda kalır.

> Not: Projede bir Realtime Database de var (`databaseURL`), ancak site şu an
> Firestore kullanıyor. Realtime Database'e geçmek istersen söyle.

## 1. Proje

Firebase projesi: `tdk26-dd1b2` · Konsol:
https://console.firebase.google.com/project/tdk26-dd1b2

## 2. Web uygulaması

Web yapılandırması `js/firebase.js` içindeki `DEFAULT_FIREBASE_CONFIG` alanında
duruyor. Başka bir proje kullanmak istersen panelden değiştirebilirsin. Bu anahtarlar
**gizli değildir**; koruma Firestore kurallarıyla yapılır.

## 3. Firestore'u başlat

Konsol → **Build → Firestore Database**. Veritabanı yoksa **Create database** ile
oluştur.

## 4. Yapılandırmayı kontrol et

1. Sitenin `admin.html` sayfasını aç.
2. **Firebase** sekmesine geç; yapılandırma hazır görünür.
3. **Bağlantıyı test et** → uygulamanın kullandığı `results` koleksiyonuna
   “Bağlantı Testi” adlı, 0 puanlık bir kayıt yazar. “Bağlantı başarılı” mesajı
   yazma izninin de çalıştığını gösterir. Test kaydını Firebase Konsolu'ndan
   silebilirsin; okuma kapalı olduğu için sitede görünmez.

## 5. Güvenlik kuralları (zorunlu)

Firestore → **Rules** sekmesine aşağıdakini yapıştırıp **Publish** et:

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
    match /students/{no} {
      allow get, list: if true;
      allow create, update: if request.resource.data.schoolNo == no
        && request.resource.data.name is string
        && request.resource.data.total is number;
      allow delete: if false;
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

## 6. Öğrenci puanları

Her tur sonunda `students/{okulNo}` belgesi güncellenir: toplam puan ve gün gün
puan (`days.YYYY-MM-DD`). Öğrenci okul numarasını girdiğinde kendi toplamını görür.
Yönetici panelindeki **Genel puan tablosu** tüm öğrencileri toplama göre listeler;
bunun için `students` koleksiyonunun listelenmesine (`allow list: if true`) izin
verilmiştir. Yani ad, okul numarası ve puanlar veritabanını bilen herkes tarafından
okunabilir. Bu bilinçli bir karar; gerçek bir hesap sistemi (Firebase Authentication)
eklenene kadar bu kabul edilmiş bir risktir.

## 7. Koleksiyon

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
