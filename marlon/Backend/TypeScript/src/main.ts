import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import * as express from 'express';
import * as path from 'path';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  // Configurar CORS
  const corsOrigin = (process.env.CORS_ORIGIN || 
    'http://localhost:5173,http://localhost:3000,http://localhost:8000'
  ).split(',').map(url => url.trim());

  app.enableCors({
    origin: corsOrigin,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  });

  // Middleware
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ limit: '10mb', extended: true }));

  // Servir archivos estáticos
  app.use(express.static(path.join(__dirname, '..', 'public')));

  // Rutas
  app.setGlobalPrefix('api');

  const PORT = parseInt(process.env.PORT || '4000', 10);
  const NODE_ENV = process.env.NODE_ENV || 'development';
  
  await app.listen(PORT, '0.0.0.0');
  
  console.log(`\n${'='.repeat(60)}`);
  console.log(`🚀 Servidor WebSocket ejecutándose`);
  console.log(`${'='.repeat(60)}`);
  console.log(`📍 Puerto: ${PORT}`);
  console.log(`🔧 Entorno: ${NODE_ENV}`);
  console.log(`📊 Dashboard: http://localhost:5173/negocio/dashboard/ and http://localhost:4000/index.html`);
  console.log(`🔌 WebSocket: ws://localhost:${PORT}/ws`);
  console.log(`❤️  Health Check: http://localhost:${PORT}/api/health`);
  console.log(`📋 API Base: http://localhost:${PORT}/api`);
  console.log(`${'='.repeat(60)}\n`);

  // Graceful shutdown
  process.on('SIGTERM', async () => {
    console.log('⚠️  SIGTERM recibido, cerrando servidor...');
    await app.close();
    process.exit(0);
  });

  process.on('SIGINT', async () => {
    console.log('\n⚠️  SIGINT recibido, cerrando servidor...');
    await app.close();
    process.exit(0);
  });
}

bootstrap().catch(err => {
  console.error('❌ Error iniciando servidor:', err);
  process.exit(1);
});
