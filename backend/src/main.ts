import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // CORS Ayarlarını Detaylandıralım
  app.enableCors({
    // Vercel adresini buraya açıkça eklemek en güvenli yoldur
    // Eğer birden fazla adresin varsa array kullanabilirsin: ['https://site.vercel.app', 'http://localhost:3000']
    origin: '*', 
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    credentials: true,
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  // Render için kritik: 0.0.0.0 üzerinden dinlemesi gerekir
  const port = process.env.PORT || 3001;
  await app.listen(port, '0.0.0.0'); 
  
  console.log(`Application is running on port: ${port}`);
}
bootstrap();