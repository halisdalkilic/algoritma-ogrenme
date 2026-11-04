# İsteğe bağlı hesap kurulumu (Supabase)

Hesap özelliği **kapalı** gelir. Uygulama tanımlı bir Supabase projesi olmadan da tamamen yerel çalışır;
giriş kutusu yalnızca aşağıdaki iki değişken tanımlıysa görünür. Ücretsiz plan bu iş için yeterlidir.

## 1. Proje oluştur

1. https://supabase.com adresinde hesap açıp yeni bir proje oluştur (bölge: sana yakın olan, ör. Frankfurt).
2. **Project Settings → API** sayfasında iki değer göreceksin: **Project URL** ve **anon public** anahtarı.
   `service_role` anahtarını **hiçbir yere yazma**, repoya da koyma. Anon anahtarı tarayıcıya zaten gömülür;
   güvenliği veritabanındaki kurallar (RLS ve doğrulama fonksiyonu) sağlar.

## 2. Şemayı kur

**SQL Editor**'da sırayla çalıştır (ikisi de tekrar çalıştırılabilir):

1. `supabase/schema.sql`: tablolar, erişim kuralları, `save_progress()` doğrulaması, `delete_account()`.
2. `supabase/lessons.sql`: geçerli ders listesi. Ders eklersen/çıkarırsan `npm run gen:lessons` ile yeniden üretip
   tekrar çalıştır (test, dosyanın güncel olup olmadığını denetler).

## 3. Giriş ayarları

**Authentication** bölümünde:

- **Providers → Email** açık kalsın. E-posta doğrulaması (Confirm email) açık kalması önerilir.
- **URL Configuration**:
  - *Site URL*: yayın adresin (ör. `https://halisdalkilic.github.io/algoritma-ogrenme/`).
  - *Redirect URLs*: aynı adresi Türkçe ve İngilizce profil sayfalarıyla birlikte ekle (ör. `https://halisdalkilic.github.io/algoritma-ogrenme/profil/` ve `.../en/profile/`).
    Özel alan adına geçersen onu da ekle. Yerel deneme için `http://localhost:3000/profil/` ve `http://localhost:3000/en/profile/`.
- Varsayılan e-posta sağlayıcısı saatte birkaç e-postayla sınırlıdır; çok kullanıcı gelirse kendi SMTP'ni bağla.

## 4. Siteye bağla

GitHub'da repo → **Settings → Secrets and variables → Actions → Variables** sekmesinde iki **değişken** ekle:

| Ad | Değer |
| --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | Project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | anon public anahtarı |

Sonra **Actions → GitHub Pages → Run workflow** ile siteyi yeniden yayınla. Profil sayfasında "Hesap" kutusu çıkar.

Yerel denemek için kök dizinde `.env.local` oluştur (git'e girmez):

```
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
```

## Nasıl çalışır?

- İlerleme yine önce cihazda (localStorage) tutulur. Giriş yapılınca yerel ve bulut kaydı **birleştirilir**
  (her ders için yüksek puan, her gün için yüksek XP; hiçbir cihazın emeği kaybolmaz) ve sonra eşitlenir.
- İstemci tabloya doğrudan yazamaz; yalnızca `save_progress()` ile yazar. Fonksiyon kaydı kabul etmeden önce
  denetler: bilinmeyen ders, tamamlanan derslerle uyuşmayan XP, günlük 5000 XP üstü, kısa sürede aşırı XP artışı,
  çalışma günleriyle uyuşmayan seri reddedilir. Bu **olasılık** denetimidir, kanıt değildir.
- Kullanıcı "Hesabımı sil" ile hesabını ve bulut verisini kalıcı olarak silebilir.
- Service worker başka adrese giden istekleri önbelleğe almaz; giriş ve ilerleme yanıtları cihazda saklanmaz.
