# Backend - Ekşi Sözlük Benzeri Platform

NestJS ile geliştirilmiş RESTful API backend.

## Kurulum

```bash
npm install
```

## Veritabanı

PostgreSQL veritabanı gereklidir. `.env` dosyasında `DATABASE_URL` ayarlayın.

```bash
# Migration çalıştır
npx prisma migrate dev

# Prisma Client generate et
npx prisma generate
```

## Çalıştırma

```bash
# Development
npm run start:dev

# Production
npm run build
npm run start:prod
```

## API Dokümantasyonu

Backend `http://localhost:3001` adresinde çalışır.
