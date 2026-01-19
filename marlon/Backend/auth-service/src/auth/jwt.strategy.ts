import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import * as fs from 'fs';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor() {
    function readKeyFromEnv(varName: string): string {
      const p = process.env[varName];
      if (!p) {
        throw new Error(`Environment variable ${varName} is required and was not provided.`);
      }
      return fs.readFileSync(p, 'utf8');
    }

    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey: readKeyFromEnv('JWT_PUBLIC_KEY_PATH'),
      algorithms: ['RS256'],
    });
  }

  async validate(payload: any) {
    return payload;
  }
}
