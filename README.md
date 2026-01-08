<<<<<<< HEAD
# Ekşi Sözlük Benzeri Platform

Ekşi Sözlük tarzında başlık-entry ilişkisine dayalı, kullanıcı etkileşimi yüksek bir tartışma platformu.

## 🚀 Özellikler

- ✅ Kullanıcı kaydı ve girişi (JWT Authentication)
- ✅ Başlık (Topic) oluşturma
- ✅ Entry yazma, düzenleme ve silme
- ✅ Entry oylama sistemi (artı/eksi)
- ✅ Kullanıcı profilleri
- ✅ Modern ve responsive UI (Tailwind CSS)

## 🛠️ Teknoloji Yığını

### Backend
- **NestJS** - Node.js framework
- **TypeScript** - Tip güvenliği
- **Prisma** - ORM
- **PostgreSQL** - Veritabanı
- **JWT** - Kimlik doğrulama
- **bcrypt** - Şifre hashleme

### Frontend
- **Next.js 14** - React framework
- **TypeScript** - Tip güvenliği
- **Tailwind CSS** - Stil
- **Zustand** - State yönetimi
- **Axios** - HTTP client
- **React Hook Form** - Form yönetimi

## 📦 Kurulum

### Gereksinimler
- Node.js 18+
- PostgreSQL 12+
- npm veya yarn

### Backend Kurulumu

1. Backend klasörüne gidin:
```bash
cd backend
```

2. Bağımlılıkları yükleyin:
```bash
npm install
```

3. `.env` dosyası oluşturun:
```env
DATABASE_URL="postgresql://user:password@localhost:5432/eksisozluk?schema=public"
JWT_SECRET="your-secret-key-change-this-in-production"
JWT_EXPIRES_IN="1d"
REFRESH_TOKEN_SECRET="your-refresh-secret-key-change-this-in-production"
REFRESH_TOKEN_EXPIRES_IN="7d"
PORT=3001
```

4. Prisma migration çalıştırın:
```bash
npx prisma migrate dev
```

5. Prisma Client'ı generate edin:
```bash
npx prisma generate
```

6. Backend'i başlatın:
```bash
npm run start:dev
```

Backend `http://localhost:3001` adresinde çalışacaktır.

### Frontend Kurulumu

1. Frontend klasörüne gidin:
```bash
cd frontend
```

2. Bağımlılıkları yükleyin:
```bash
npm install
```

3. `.env.local` dosyası oluşturun (opsiyonel):
```env
NEXT_PUBLIC_API_URL=http://localhost:3001
```

4. Frontend'i başlatın:
```bash
npm run dev
```

Frontend `http://localhost:3000` adresinde çalışacaktır.

## 📁 Proje Yapısı

```
.
├── backend/
│   ├── src/
│   │   ├── auth/          # Kimlik doğrulama modülü
│   │   ├── users/         # Kullanıcı modülü
│   │   ├── topics/        # Başlık modülü
│   │   ├── entries/       # Entry modülü
│   │   ├── votes/         # Oylama modülü
│   │   └── common/        # Ortak servisler (Prisma)
│   └── prisma/
│       └── schema.prisma  # Veritabanı şeması
│
└── frontend/
    ├── app/               # Next.js App Router sayfaları
    ├── components/        # React bileşenleri
    ├── lib/              # Yardımcı fonksiyonlar (API client)
    └── store/            # Zustand store'ları
```

## 🔐 API Endpoints

### Auth
- `POST /auth/register` - Kullanıcı kaydı
- `POST /auth/login` - Giriş
- `GET /auth/profile` - Kullanıcı profili (JWT gerekli)

### Topics
- `GET /topics` - Tüm başlıklar (pagination)
- `GET /topics/:slug` - Başlık detayı
- `POST /topics` - Yeni başlık oluştur (JWT gerekli)

### Entries
- `GET /entries` - Tüm entryler (topicId ile filtreleme)
- `GET /entries/:id` - Entry detayı
- `POST /entries` - Yeni entry oluştur (JWT gerekli)
- `PATCH /entries/:id` - Entry güncelle (JWT gerekli)
- `DELETE /entries/:id` - Entry sil (JWT gerekli)

### Votes
- `POST /votes` - Oy ver (JWT gerekli)
- `GET /votes/entry/:entryId` - Entry oyları

### Users
- `GET /users/:id` - Kullanıcı bilgisi
- `GET /users/username/:username` - Kullanıcı bilgisi (username ile)

## 🎯 Kullanım

1. Frontend ve backend'i başlatın
2. Tarayıcıda `http://localhost:3000` adresine gidin
3. Yeni bir hesap oluşturun veya giriş yapın
4. Başlık oluşturun ve entry ekleyin
5. Entry'lere oy verin

## 🔒 Güvenlik

- Şifreler bcrypt ile hashlenir
- JWT token'lar ile stateless authentication
- Input validation (class-validator)
- XSS ve SQL Injection koruması (Prisma ORM)

## 📝 Notlar

- Bu proje geliştirme amaçlıdır
- Production için ek güvenlik önlemleri alınmalıdır
- Rate limiting ve caching eklenebilir
- Docker containerization yapılabilir

## 📄 Lisans

MIT
=======
# SozlukClone
>>>>>>> 7ecb811a2f474068fc151d6c960e151cd589837e
