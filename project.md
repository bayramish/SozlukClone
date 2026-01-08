# Ekşi Sözlük Benzeri Platform – Uçtan Uca Proje Dokümanı

Bu doküman, **Cursor AI** ile geliştirilmeye uygun olacak şekilde; gereksinimler, mimari, ön yüz, arka yüz, veritabanı, güvenlik, ölçeklenebilirlik ve geliştirme adımlarını açık ve net biçimde tanımlar. Amaç; kullanıcıların başlıklar açabildiği, entry girebildiği, oylama ve moderasyon sistemine sahip bir tartışma platformu oluşturmaktır.

---

## 1. Proje Tanımı ve Amaç

**Amaç:**
Ekşi Sözlük tarzında, başlık–entry ilişkisine dayalı, kullanıcı etkileşimi yüksek, ölçeklenebilir bir web uygulaması geliştirmek.

**Temel Özellikler:**

* Başlık (Topic) oluşturma
* Entry yazma / düzenleme / silme
* Entry oylama (artı / eksi)
* Kullanıcı profilleri
* Arama ve filtreleme
* Moderasyon ve raporlama

---

## 2. Teknoloji Yığını (Tech Stack)

### 2.1 Ön Yüz (Frontend)

* Framework: **Next.js (React)**
* Dil: **TypeScript**
* Stil: **Tailwind CSS**
* State Yönetimi: **Zustand** veya **Redux Toolkit**
* API İletişimi: **REST / JSON**

### 2.2 Arka Yüz (Backend)

* Runtime: **Node.js**
* Framework: **NestJS**
* API Mimarisi: **RESTful API**
* Kimlik Doğrulama: **JWT (Access + Refresh Token)**

### 2.3 Veritabanı

* Ana DB: **PostgreSQL**
* ORM: **Prisma**
* Cache (opsiyonel): **Redis**

---

## 3. Sistem Mimarisi

```text
[ Client (Next.js) ]
        |
        | HTTP (REST)
        v
[ API Gateway / NestJS ]
        |
        | Prisma ORM
        v
[ PostgreSQL ]
```

* Frontend yalnızca API ile konuşur
* Business logic tamamen backend tarafındadır
* Veritabanına doğrudan erişim yoktur

---

## 4. Ön Yüz (Frontend) Detayı

### 4.1 Sayfa Yapısı

* `/` → Gündem / Popüler başlıklar
* `/topic/[slug]` → Başlık detay + entry listesi
* `/entry/new` → Yeni entry oluşturma
* `/profile/[username]` → Kullanıcı profili
* `/login` – `/register`

### 4.2 Bileşenler

* Header / Navbar
* TopicList
* EntryCard
* VoteButtons
* UserBadge

### 4.3 State Yönetimi

* Auth State (login, token)
* User bilgileri
* Entry oylama optimistik güncelleme

---

## 5. Arka Yüz (Backend) Detayı

### 5.1 Modül Yapısı (NestJS)

```text
src/
 ├─ auth/
 ├─ users/
 ├─ topics/
 ├─ entries/
 ├─ votes/
 ├─ reports/
 └─ common/
```

### 5.2 API Endpoint Örnekleri

```http
POST   /auth/register
POST   /auth/login

GET    /topics
POST   /topics
GET    /topics/:slug

POST   /entries
PUT    /entries/:id
DELETE /entries/:id

POST   /votes
```

---

## 6. Veritabanı Tasarımı

### 6.1 Tablolar

#### users

* id (PK)
* username (unique)
* email (unique)
* password_hash
* role (user | moderator | admin)
* created_at

#### topics

* id (PK)
* title
* slug (unique)
* created_by (FK -> users.id)
* created_at

#### entries

* id (PK)
* content
* topic_id (FK)
* user_id (FK)
* created_at
* updated_at

#### votes

* id (PK)
* entry_id (FK)
* user_id (FK)
* value (+1 / -1)

---

## 7. Güvenlik

* Şifreler: **bcrypt** ile hashlenir
* JWT ile stateless auth
* Rate limiting (DDOS koruması)
* Input validation (class-validator)
* XSS / SQL Injection önlemleri

---

## 8. Moderasyon Sistemi

* Entry raporlama
* Moderatör paneli
* Soft delete (is_deleted)
* Ban / Shadow ban

---

## 9. Ölçeklenebilirlik

* Pagination (cursor-based)
* Redis cache (popüler başlıklar)
* CDN (static assets)
* Horizontal scaling (Docker)

---

## 10. Geliştirme Adımları (Roadmap)

1. Repo oluşturma
2. Backend (Auth + Users)
3. Topic & Entry CRUD
4. Frontend temel sayfalar
5. Voting sistemi
6. Moderasyon
7. Performans optimizasyonu
8. Deployment (Docker + VPS)

---

## 11. Cursor AI İçin Kullanım Notu

Bu dosya **Cursor AI** içinde:

* Kod üretimi için referans alınabilir
* Her bölüm ayrı prompt olarak parçalanabilir
* API ve model yapıları doğrudan kodlanabilir

---

**Sonuç:**
Bu doküman, Ekşi Sözlük benzeri bir platformu sıfırdan production seviyesine kadar geliştirmek için yeterli teknik rehber niteliğindedir.
