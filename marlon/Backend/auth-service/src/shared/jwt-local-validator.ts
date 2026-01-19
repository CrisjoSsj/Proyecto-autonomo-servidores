/**
 * Módulo de validación local de JWT para microservicios
 * 
 * Este módulo permite a otros servicios validar tokens JWT localmente
 * sin consultar al Auth Service en cada petición.
 * 
 * USO:
 * 1. Copiar este archivo a tu microservicio
 * 2. Instalar dependencias: npm install jsonwebtoken axios
 * 3. Configurar AUTH_SERVICE_URL en tu .env
 * 4. Usar validateTokenLocally() para validar tokens
 */

import * as jwt from 'jsonwebtoken';
import axios from 'axios';

// Cache de la clave pública (se obtiene una vez y se reutiliza)
let cachedPublicKey: string | null = null;
let cacheExpiry: number = 0;
const CACHE_TTL_MS = 60 * 60 * 1000; // 1 hora

/**
 * Obtiene la clave pública del Auth Service (con cache)
 */
export async function getPublicKey(authServiceUrl: string): Promise<string> {
  const now = Date.now();
  
  // Retornar cache si es válido
  if (cachedPublicKey && now < cacheExpiry) {
    return cachedPublicKey;
  }

  try {
    const jwksUrl = `${authServiceUrl.replace(/\/$/, '')}/.well-known/jwks.json`;
    const response = await axios.get<{ keys: Array<{ pem: string }> }>(jwksUrl, { timeout: 5000 });
    
    if (response.data?.keys?.[0]?.pem) {
      cachedPublicKey = response.data.keys[0].pem;
      cacheExpiry = now + CACHE_TTL_MS;
      return cachedPublicKey;
    }
    
    throw new Error('Invalid JWKS response');
  } catch (error: any) {
    throw new Error(`Failed to fetch public key: ${error.message}`);
  }
}

/**
 * Invalida el cache de la clave pública (útil para rotación de claves)
 */
export function invalidatePublicKeyCache(): void {
  cachedPublicKey = null;
  cacheExpiry = 0;
}

/**
 * Payload del token JWT decodificado
 */
export interface JwtPayload {
  sub: string;      // User ID
  username: string; // Username
  role: string;     // User role
  jti: string;      // JWT ID (para revocación)
  iat: number;      // Issued at
  exp: number;      // Expiration
}

/**
 * Resultado de la validación
 */
export interface ValidationResult {
  valid: boolean;
  payload?: JwtPayload;
  error?: string;
}

/**
 * Valida un token JWT localmente (sin consultar al Auth Service)
 * 
 * @param token - El token JWT a validar
 * @param authServiceUrl - URL del Auth Service (ej: http://localhost:3000)
 * @returns Resultado de la validación con el payload si es válido
 * 
 * NOTA: Esta validación NO verifica si el token está en la blacklist.
 * Para operaciones críticas, usar /auth/validate del Auth Service.
 */
export async function validateTokenLocally(
  token: string,
  authServiceUrl: string
): Promise<ValidationResult> {
  try {
    const publicKey = await getPublicKey(authServiceUrl);
    
    const payload = jwt.verify(token, publicKey, {
      algorithms: ['RS256'],
    }) as JwtPayload;

    // Verificar expiración (jwt.verify ya lo hace, pero doble check)
    if (payload.exp && payload.exp * 1000 < Date.now()) {
      return { valid: false, error: 'Token expired' };
    }

    return { valid: true, payload };
  } catch (error: any) {
    return { valid: false, error: error.message };
  }
}

/**
 * Middleware Express/NestJS para validar tokens localmente
 * 
 * USO en Express:
 *   app.use('/protected', createLocalJwtMiddleware('http://localhost:3000'));
 * 
 * USO en NestJS (crear un Guard):
 *   @Injectable()
 *   export class LocalJwtGuard implements CanActivate {
 *     async canActivate(context: ExecutionContext): Promise<boolean> {
 *       const request = context.switchToHttp().getRequest();
 *       const result = await validateTokenLocally(token, AUTH_URL);
 *       if (!result.valid) throw new UnauthorizedException();
 *       request.user = result.payload;
 *       return true;
 *     }
 *   }
 */
export function createLocalJwtMiddleware(authServiceUrl: string) {
  return async (req: any, res: any, next: any) => {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'No token provided' });
    }

    const token = authHeader.substring(7);
    const result = await validateTokenLocally(token, authServiceUrl);

    if (!result.valid) {
      return res.status(401).json({ message: result.error || 'Invalid token' });
    }

    req.user = result.payload;
    next();
  };
}

/**
 * Ejemplo de uso en un microservicio NestJS
 */
export const EXAMPLE_NESTJS_GUARD = `
// local-jwt.guard.ts
import { Injectable, CanActivate, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { validateTokenLocally } from './jwt-local-validator';

@Injectable()
export class LocalJwtGuard implements CanActivate {
  private readonly authServiceUrl = process.env.AUTH_SERVICE_URL || 'http://localhost:3000';

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const authHeader = request.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedException('No token provided');
    }

    const token = authHeader.substring(7);
    const result = await validateTokenLocally(token, this.authServiceUrl);

    if (!result.valid) {
      throw new UnauthorizedException(result.error || 'Invalid token');
    }

    request.user = result.payload;
    return true;
  }
}

// Uso en un controlador:
// @UseGuards(LocalJwtGuard)
// @Get('protected')
// getProtected(@Req() req) {
//   return { user: req.user };
// }
`;

/**
 * Ejemplo de uso en Express puro
 */
export const EXAMPLE_EXPRESS = `
// server.js
const express = require('express');
const { createLocalJwtMiddleware } = require('./jwt-local-validator');

const app = express();
const AUTH_SERVICE_URL = process.env.AUTH_SERVICE_URL || 'http://localhost:3000';

// Aplicar middleware a rutas protegidas
app.use('/api/protected', createLocalJwtMiddleware(AUTH_SERVICE_URL));

app.get('/api/protected/data', (req, res) => {
  // req.user contiene el payload del token
  res.json({ message: 'Protected data', user: req.user });
});

app.listen(4000, () => console.log('Service running on port 4000'));
`;
