import {
  Injectable,
  UnauthorizedException,
  ConflictException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, IsNull } from 'typeorm';
import { v4 as uuidv4 } from 'uuid';
import * as bcrypt from 'bcrypt';
import axios from 'axios';

import { User } from '../users/user.entity';
import { RefreshToken } from '../tokens/refresh-token.entity';
import { RevokedToken } from '../tokens/revoked-token.entity';

function getEnv(name: string, fallback?: string) {
  return process.env[name] ?? fallback;
}

@Injectable()
export class AuthService {
  constructor(
    private readonly jwtService: JwtService,

    @InjectRepository(User)
    private readonly userRepo: Repository<User>,

    @InjectRepository(RefreshToken)
    private readonly refreshTokenRepo: Repository<RefreshToken>,

    @InjectRepository(RevokedToken)
    private readonly revokedTokenRepo: Repository<RevokedToken>,
  ) {}

  // REGISTER
  async register(
    username: string,
    password: string,
    email?: string,
    firstName?: string,
    lastName?: string,
    role = 'user',
    telefono?: string,
    descripcion?: string,
    ubicacion?: any,
  ) {
    // check duplicates first to return a friendly error
    const existing = await this.userRepo.findOne({ where: [{ username }, { email }] });
    if (existing) {
      if (existing.username === username) throw new ConflictException('Username already exists');
      if (email && existing.email === email) throw new ConflictException('Email already exists');
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const user = await this.userRepo.save({
      username,
      email,
      firstName,
      lastName,
      passwordHash,
      role,
    });

    // Sincronizar con Django: crear cliente o proveedor
    await this.syncWithDjango(user, role, telefono, descripcion, ubicacion);

    return this.login(user);
  }

  // Sincronizar usuario con Django (crear cliente/proveedor)
  private async syncWithDjango(
    user: User,
    role: string,
    telefono?: string,
    descripcion?: string,
    ubicacion?: any,
  ) {
    const base = getEnv('DJANGO_API_BASE');
    const serviceToken = getEnv('DJANGO_SERVICE_TOKEN');
    
    console.log('[syncWithDjango] Starting sync for user:', user.id, 'role:', role);
    console.log('[syncWithDjango] DJANGO_API_BASE:', base ? 'configured' : 'NOT SET');
    console.log('[syncWithDjango] DJANGO_SERVICE_TOKEN:', serviceToken ? 'configured' : 'NOT SET');
    
    if (!base || !serviceToken) {
      console.warn('[syncWithDjango] Django integration not configured, skipping sync');
      return;
    }

    // Validar teléfono (Django requiere exactamente 10 dígitos)
    let telefonoFinal = telefono || '0000000000';
    if (telefonoFinal.length !== 10) {
      telefonoFinal = telefonoFinal.padEnd(10, '0').substring(0, 10);
    }

    // Formatear ubicación para Django (debe tener direccion, ciudad, provincia, pais o ser null)
    let ubicacionFinal: { direccion: string; ciudad: string; provincia: string; pais: string } | null = null;
    if (ubicacion && typeof ubicacion === 'object') {
      if (ubicacion.direccion || ubicacion.ciudad || ubicacion.provincia || ubicacion.pais) {
        ubicacionFinal = {
          direccion: ubicacion.direccion || 'Sin dirección',
          ciudad: ubicacion.ciudad || 'Sin ciudad',
          provincia: ubicacion.provincia || 'Sin provincia',
          pais: ubicacion.pais || 'Ecuador',
        };
      }
    }

    try {
      if (role === 'cliente') {
        const url = `${base.replace(/\/$/, '')}/api_rest/api/v1/cliente/`;
        const payload = {
          user_id: user.id,
          telefono: telefonoFinal,
          ubicacion: ubicacionFinal,
        };
        console.log('Creating cliente in Django:', url, payload);
        const response = await axios.post(url, payload, { headers: { Authorization: `Token ${serviceToken}` } });
        console.log('Cliente created:', response.data);
      } else if (role === 'proveedor') {
        const url = `${base.replace(/\/$/, '')}/api_rest/api/v1/proveedor/`;
        const payload = {
          user_id: user.id,
          telefono: telefonoFinal,
          descripcion: descripcion || 'Sin descripción',
          ubicacion: ubicacionFinal,
        };
        console.log('Creating proveedor in Django:', url, payload);
        const response = await axios.post(url, payload, { headers: { Authorization: `Token ${serviceToken}` } });
        console.log('Proveedor created:', response.data);
      }
    } catch (e: any) {
      console.error('Failed to sync with Django:', e.response?.data ?? e.message);
      // Log más detallado para debugging
      if (e.response?.data) {
        console.error('Django error details:', JSON.stringify(e.response.data, null, 2));
      }
      // No lanzar error para no bloquear el registro
    }
  }

  // LOGIN
  async login(user: User) {
    const payload = {
      sub: user.id,
      username: user.username,
      role: user.role,
      jti: uuidv4(),
    };

    const expiresIn = process.env.ACCESS_TOKEN_EXPIRES_MINUTES ? `${process.env.ACCESS_TOKEN_EXPIRES_MINUTES}m` : '15m';
    const accessToken = this.jwtService.sign(payload, { expiresIn } as any);

    // create refresh token and store hash
    const refreshToken = uuidv4() + uuidv4();
    const refreshTokenHash = await bcrypt.hash(refreshToken, 10);
    const refreshExpiresDays = Number(process.env.REFRESH_TOKEN_EXPIRES_DAYS ?? 7);

    await this.refreshTokenRepo.save({
      userId: user.id,
      tokenHash: refreshTokenHash,
      expiresAt: new Date(Date.now() + refreshExpiresDays * 24 * 60 * 60 * 1000),
    });

    // enforce max active refresh tokens per user
    const maxPerUser = Number(process.env.REFRESH_TOKENS_MAX_PER_USER ?? 5);
    if (maxPerUser > 0) {
      const active = await this.refreshTokenRepo.find({ where: { userId: user.id, revokedAt: IsNull() } });
      if (active.length > maxPerUser) {
        // revoke oldest extra tokens
        const sorted = active.sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
        const toRevoke = sorted.slice(0, active.length - maxPerUser);
        for (const t of toRevoke) {
          await this.refreshTokenRepo.update({ id: t.id }, { revokedAt: new Date() });
        }
      }
    }

    return { accessToken, refreshToken };
  }

  // VALIDAR LOGIN (por username)
  async validateUser(username: string, password: string) {
    const user = await this.userRepo.findOne({ where: { username } });
    if (!user) throw new UnauthorizedException();

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) throw new UnauthorizedException();

    return user;
  }

  // LOGOUT
  async logout(payload: any) {
    // Perform logout atomically: insert revoked jti and revoke refresh tokens
    await this.refreshTokenRepo.manager.transaction(async (manager) => {
      await manager.getRepository(RevokedToken).save({
        jti: payload.jti,
        userId: payload.sub,
        expiresAt: new Date(payload.exp * 1000),
      });

      await manager.getRepository(RefreshToken).update({ userId: payload.sub }, { revokedAt: new Date() });
    });
  }

  // REFRESH TOKEN
  async refresh(refreshToken: string) {
    // find any token (including revoked) that matches
    const tokens = await this.refreshTokenRepo.find({ where: {} });
    let found: RefreshToken | null = null;
    for (const token of tokens) {
      const match = await bcrypt.compare(refreshToken, token.tokenHash);
      if (match) {
        found = token;
        break;
      }
    }

    if (!found) throw new UnauthorizedException('Refresh token inválido');

    // if token was revoked -> possible replay attack: revoke all user's tokens
    if (found.revokedAt) {
      await this.refreshTokenRepo.update({ userId: found.userId }, { revokedAt: new Date() });
      throw new UnauthorizedException('Refresh token reutilizado (posible ataque)');
    }

    if (found.expiresAt < new Date()) {
      throw new UnauthorizedException('Refresh token expirado');
    }

    // Rotate: revoke the current refresh token and issue a new one
    await this.refreshTokenRepo.update({ id: found.id }, { revokedAt: new Date() });

    const newRefresh = uuidv4() + uuidv4();
    const newHash = await bcrypt.hash(newRefresh, 10);
    const refreshExpiresDays = Number(process.env.REFRESH_TOKEN_EXPIRES_DAYS ?? 7);
    await this.refreshTokenRepo.save({
      userId: found.userId,
      tokenHash: newHash,
      expiresAt: new Date(Date.now() + refreshExpiresDays * 24 * 60 * 60 * 1000),
    });

    const payload = {
      sub: found.userId,
      jti: uuidv4(),
    };

    const expiresIn = process.env.ACCESS_TOKEN_EXPIRES_MINUTES ? `${process.env.ACCESS_TOKEN_EXPIRES_MINUTES}m` : '15m';
    const accessToken = this.jwtService.sign(payload, { expiresIn } as any);

    return { accessToken, refreshToken: newRefresh };
  }

  // VALIDATE TOKEN (used by internal endpoint)
  async validateToken(token: string) {
    try {
      const payload: any = this.jwtService.verify(token as string);

      // check revoked tokens
      const revoked = await this.revokedTokenRepo.findOne({ where: { jti: payload.jti } });
      if (revoked) {
        throw new UnauthorizedException('Token revocado');
      }

      return { valid: true, payload };
    } catch (e: any) {
      throw new UnauthorizedException(e.message ?? 'Token inválido');
    }
  }
}
