import { Controller, Get, Req, UseGuards, NotFoundException, Post, Body } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './user.entity';
import axios from 'axios';

function getEnv(name: string, fallback?: string) {
  const v = process.env[name];
  return v ?? fallback;
}

@Controller('users')
export class UsersController {
  constructor(
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
  ) {}

  /**
   * @deprecated Use GET /auth/me instead. This endpoint is kept for backwards compatibility.
   */
  @Get('me')
  @UseGuards(AuthGuard('jwt'))
  async me(@Req() req) {
    const userId = req.user?.sub ?? req.user?.id;
    if (!userId) throw new NotFoundException('Usuario no identificado');

    const user = await this.userRepo.findOne({ where: { id: userId } });
    if (!user) throw new NotFoundException('Usuario no encontrado');

    // Devolver campos públicos que usa el frontend
    const base = getEnv('DJANGO_API_BASE');
    const serviceToken = getEnv('DJANGO_SERVICE_TOKEN');

    // Estructura básica
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

    // Si hay configuración de Django, intentar recuperar datos extendidos
    if (base && serviceToken) {
      try {
        // Buscar cliente por user_id (UUID del auth-service)
        const clienteUrl = `${base.replace(/\/$/, '')}/api_rest/api/v1/cliente/?user_id=${encodeURIComponent(user.id)}`;
        const clienteRes = await axios.get(clienteUrl, { headers: { Authorization: `Token ${serviceToken}` } });
        if (clienteRes.status === 200 && Array.isArray(clienteRes.data) && clienteRes.data.length > 0) {
          const c = clienteRes.data[0];
          result.telefono = c.telefono ?? '';
          result.ubicacion = c.ubicacion ?? null;
          result.descripcion = c.descripcion ?? null;
          // Devolver el ID numérico de Django para las queries de reservas
          if (c.id) result.id = c.id;
          return result;
        }

        // Intentar buscar proveedor por user_id
        const provUrl = `${base.replace(/\/$/, '')}/api_rest/api/v1/proveedor/?user_id=${encodeURIComponent(user.id)}`;
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
        // no romper si falla la consulta a Django; devolver info básica
        console.warn('Could not fetch extended profile from Django:', e.message ?? e);
      }
    }

    return result;
  }

  @Post('sync')
  async sync(@Body() body: any) {
    const base = getEnv('DJANGO_API_BASE');
    const serviceToken = getEnv('DJANGO_SERVICE_TOKEN');
    if (!base || !serviceToken) {
      throw new NotFoundException('Django integration not configured');
    }

    const role = body.role;
    const payload = body.payload;

    try {
      if (role === 'cliente') {
        const url = `${base.replace(/\/$/, '')}/api_rest/api/v1/cliente/`;
        const res = await axios.post(url, payload, { headers: { Authorization: `Token ${serviceToken}` } });
        return res.data;
      } else if (role === 'proveedor') {
        const url = `${base.replace(/\/$/, '')}/api_rest/api/v1/proveedor/`;
        const res = await axios.post(url, payload, { headers: { Authorization: `Token ${serviceToken}` } });
        return res.data;
      } else {
        throw new NotFoundException('Role not supported');
      }
    } catch (e: any) {
      // Propagar error simplificado
      throw new NotFoundException(e.response?.data ?? e.message ?? 'Sync failed');
    }
  }
}
