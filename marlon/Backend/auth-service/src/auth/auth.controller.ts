import {
  Controller,
  Post,
  Body,
  Req,
  UseGuards,
  Get,
  Query,
  Headers,
  NotFoundException,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthGuard } from '@nestjs/passport';
// Note: throttle removed to avoid runtime issues with @nestjs/throttler in this environment
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../users/user.entity';
import axios from 'axios';

function getEnv(name: string, fallback?: string) {
  const v = process.env[name];
  return v ?? fallback;
}

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
  ) {}

  @Post('register')
  register(@Body() body) {
    return this.authService.register(
      body.username,
      body.password,
      body.email,
      body.firstName,
      body.lastName,
      body.role,
      body.telefono,
      body.descripcion,
      body.ubicacion,
    );
  }

  @Post('login')
  async login(@Body() body) {
    const user = await this.authService.validateUser(
      body.username,
      body.password,
    );
    return this.authService.login(user);
  }

  @Get('validate')
  async validate(
    @Query('token') tokenQuery: string,
    @Headers('authorization') authHeader: string,
    @Headers('x-service-token') serviceToken: string,
  ) {
    // Proteger endpoint interno: requiere service token válido
    const expectedServiceToken = getEnv('INTERNAL_SERVICE_TOKEN');
    if (expectedServiceToken && serviceToken !== expectedServiceToken) {
      throw new NotFoundException('Unauthorized: invalid service token');
    }
    const token = tokenQuery ?? (authHeader ? authHeader.replace(/^Bearer\s+/i, '') : null);
    if (!token) throw new NotFoundException('Token not provided');
    return this.authService.validateToken(token);
  }

  @Get('me')
  @UseGuards(AuthGuard('jwt'))
  async me(@Req() req) {
    const userId = req.user?.sub ?? req.user?.id;
    if (!userId) throw new NotFoundException('Usuario no identificado');

    const user = await this.userRepo.findOne({ where: { id: userId } });
    if (!user) throw new NotFoundException('Usuario no encontrado');

    const base = getEnv('DJANGO_API_BASE');
    const serviceToken = getEnv('DJANGO_SERVICE_TOKEN');

    const result: any = {
      id: user.id,
      user: {
        username: user.username,
        first_name: user.firstName,
        last_name: user.lastName,
        email: user.email,
      },
      telefono: '',
      descripcion: null,
      ubicacion: null,
      rol: user.role,
    };

    if (base && serviceToken) {
      try {
        const clienteUrl = `${base.replace(/\/$/, '')}/api_rest/api/v1/cliente/?user__username=${encodeURIComponent(user.username)}`;
        const clienteRes = await axios.get(clienteUrl, { headers: { Authorization: `Token ${serviceToken}` } });
        if (clienteRes.status === 200 && Array.isArray(clienteRes.data) && clienteRes.data.length > 0) {
          const c = clienteRes.data[0];
          result.telefono = c.telefono ?? '';
          result.ubicacion = c.ubicacion ?? null;
          result.descripcion = c.descripcion ?? null;
          if (c.id) result.id = c.id;
          return result;
        }

        const provUrl = `${base.replace(/\/$/, '')}/api_rest/api/v1/proveedor/?user__username=${encodeURIComponent(user.username)}`;
        const provRes = await axios.get(provUrl, { headers: { Authorization: `Token ${serviceToken}` } });
        if (provRes.status === 200 && Array.isArray(provRes.data) && provRes.data.length > 0) {
          const p = provRes.data[0];
          result.telefono = p.telefono ?? '';
          result.ubicacion = p.ubicacion ?? null;
          result.descripcion = p.descripcion ?? null;
          if (p.id) result.id = p.id;
          return result;
        }
      } catch (e) {
        console.warn('Could not fetch extended profile from Django:', (e as any).message ?? e);
      }
    }

    return result;
  }

  @Post('logout')
  @UseGuards(AuthGuard('jwt'))
  logout(@Req() req) {
    return this.authService.logout(req.user);
  }

  @Post('refresh')
  refresh(@Body('refreshToken') token: string) {
    return this.authService.refresh(token);
  }
}
