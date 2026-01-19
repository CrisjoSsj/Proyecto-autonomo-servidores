import 'dotenv/config';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import * as dotenv from 'dotenv';
import rateLimit from 'express-rate-limit';
import * as fs from 'fs';
import * as crypto from 'crypto';

async function bootstrap() {
  dotenv.config();
  const app = await NestFactory.create(AppModule);

  // Habilitar CORS para permitir peticiones desde el frontend (Vite dev server)
  app.enableCors({
    origin: process.env.CORS_ORIGIN ?? 'http://localhost:5173',
    credentials: true,
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    allowedHeaders: 'Origin, X-Requested-With, Content-Type, Accept, Authorization, X-Service-Token',
  });

  // Rate limiting para /auth/login (5 intentos por minuto por IP)
  const loginLimiter = rateLimit({
    windowMs: 60 * 1000, // 1 minuto
    max: 5, // 5 intentos
    message: { statusCode: 429, message: 'Demasiados intentos de login. Intenta de nuevo en 1 minuto.' },
    standardHeaders: true,
    legacyHeaders: false,
  });
  app.use('/auth/login', loginLimiter);

  // Endpoint JWKS para que otros servicios validen tokens localmente
  const expressApp = app.getHttpAdapter().getInstance();
  expressApp.get('/.well-known/jwks.json', (req: any, res: any) => {
    const publicKeyPath = process.env.JWT_PUBLIC_KEY_PATH;
    if (!publicKeyPath) {
      return res.status(500).json({ error: 'JWT_PUBLIC_KEY_PATH not configured' });
    }
    try {
      const publicKeyPem = fs.readFileSync(publicKeyPath, 'utf8');
      
      // Crear un KeyObject desde el PEM para extraer n y e
      const keyObject = crypto.createPublicKey(publicKeyPem);
      const jwk = keyObject.export({ format: 'jwk' });
      
      // Devolver la clave pública en formato JWKS estándar con n y e
      res.json({
        keys: [
          {
            kty: 'RSA',
            use: 'sig',
            alg: 'RS256',
            kid: 'auth-service-key-1',
            n: jwk.n,  // Modulus en Base64URL
            e: jwk.e,  // Exponent en Base64URL
          },
        ],
      });
    } catch (e) {
      console.error('Error reading/parsing public key:', e);
      res.status(500).json({ error: 'Could not read public key' });
    }
  });

  await app.listen(process.env.PORT ?? 3000);
  console.log(`Auth service running on port ${process.env.PORT ?? 3000}`);
}
bootstrap();
