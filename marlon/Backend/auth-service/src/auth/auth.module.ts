import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';
import * as fs from 'fs';

function readKeyFromEnv(varName: string): string {
  const p = process.env[varName];
  if (!p) {
    throw new Error(`Environment variable ${varName} is required and was not provided.`);
  }
  return fs.readFileSync(p, 'utf8');
}

import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { JwtStrategy } from './jwt.strategy';

import { User } from '../users/user.entity';
import { RefreshToken } from '../tokens/refresh-token.entity';
import { RevokedToken } from '../tokens/revoked-token.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([User, RefreshToken, RevokedToken]),
    JwtModule.register({
      privateKey: readKeyFromEnv('JWT_PRIVATE_KEY_PATH'),
      publicKey: readKeyFromEnv('JWT_PUBLIC_KEY_PATH'),
      signOptions: {
        algorithm: 'RS256',
        expiresIn: '15m',
        keyid: 'auth-service-key-1',  // Debe coincidir con el kid en JWKS
      },
    }),
  ],
  providers: [AuthService, JwtStrategy],
  controllers: [AuthController],
})
export class AuthModule {}

