<p align="center">
  <a href="http://nestjs.com/" target="blank"><img src="https://nestjs.com/img/logo-small.svg" width="120" alt="Nest Logo" /></a>
</p>

[circleci-image]: https://img.shields.io/circleci/build/github/nestjs/nest/master?token=abc123def456
[circleci-url]: https://circleci.com/gh/nestjs/nest

  <p align="center">A progressive <a href="http://nodejs.org" target="_blank">Node.js</a> framework for building efficient and scalable server-side applications.</p>
    <p align="center">
<a href="https://www.npmjs.com/~nestjscore" target="_blank"><img src="https://img.shields.io/npm/v/@nestjs/core.svg" alt="NPM Version" /></a>
<a href="https://www.npmjs.com/~nestjscore" target="_blank"><img src="https://img.shields.io/npm/l/@nestjs/core.svg" alt="Package License" /></a>
<a href="https://www.npmjs.com/~nestjscore" target="_blank"><img src="https://img.shields.io/npm/dm/@nestjs/common.svg" alt="NPM Downloads" /></a>
<a href="https://circleci.com/gh/nestjs/nest" target="_blank"><img src="https://img.shields.io/circleci/build/github/nestjs/nest/master" alt="CircleCI" /></a>
<a href="https://discord.gg/G7Qnnhy" target="_blank"><img src="https://img.shields.io/badge/discord-online-brightgreen.svg" alt="Discord"/></a>
<a href="https://opencollective.com/nest#backer" target="_blank"><img src="https://opencollective.com/nest/backers/badge.svg" alt="Backers on Open Collective" /></a>
<a href="https://opencollective.com/nest#sponsor" target="_blank"><img src="https://opencollective.com/nest/sponsors/badge.svg" alt="Sponsors on Open Collective" /></a>
  <a href="https://paypal.me/kamilmysliwiec" target="_blank"><img src="https://img.shields.io/badge/Donate-PayPal-ff3f59.svg" alt="Donate us"/></a>
    <a href="https://opencollective.com/nest#sponsor"  target="_blank"><img src="https://img.shields.io/badge/Support%20us-Open%20Collective-41B883.svg" alt="Support us"></a>
  <a href="https://twitter.com/nestframework" target="_blank"><img src="https://img.shields.io/twitter/follow/nestframework.svg?style=social&label=Follow" alt="Follow us on Twitter"></a>
</p>
  <!--[![Backers on Open Collective](https://opencollective.com/nest/backers/badge.svg)](https://opencollective.com/nest#backer)
  [![Sponsors on Open Collective](https://opencollective.com/nest/sponsors/badge.svg)](https://opencollective.com/nest#sponsor)-->

## Description

[Nest](https://github.com/nestjs/nest) framework TypeScript starter repository.

## Project setup

```bash
$ npm install
```

## Configuración de Integración con Django

Este servicio se integra con Django para sincronizar usuarios (clientes/proveedores). Para que funcione correctamente:

### 1. Configurar el archivo .env

Crea o edita el archivo `.env` con las siguientes variables:

```env
# Claves JWT (RS256)
JWT_PRIVATE_KEY_PATH=keys/private.pem
JWT_PUBLIC_KEY_PATH=keys/public.pem
JWT_ALGORITHM=RS256

# Tokens
ACCESS_TOKEN_EXPIRES_MINUTES=15
REFRESH_TOKEN_EXPIRES_DAYS=7

# Integración Django (IMPORTANTE)
DJANGO_API_BASE=http://127.0.0.1:8000
DJANGO_SERVICE_TOKEN=<token_generado_por_django>

# CORS / puerto
CORS_ORIGIN=http://localhost:5173
PORT=3000
```

### 2. Generar el token de servicio en Django

Antes de iniciar auth-service, ejecuta en el directorio de Django:

```bash
cd ../Python
python setup_service_token.py
```

Este script:
- Crea un usuario de servicio en Django
- Genera un token de autenticación
- Actualiza automáticamente el archivo `.env` de auth-service

### 3. Generar claves RSA (si no existen)

```bash
mkdir -p keys
openssl genrsa -out keys/private.pem 2048
openssl rsa -in keys/private.pem -pubout -out keys/public.pem
```

## Compile and run the project

```bash
# development
$ npm run start

# watch mode
$ npm run start:dev

# production mode
$ npm run start:prod
```

## Run tests

```bash
# unit tests
$ npm run test

# e2e tests
$ npm run test:e2e

# test coverage
$ npm run test:cov
```

## Deployment

When you're ready to deploy your NestJS application to production, there are some key steps you can take to ensure it runs as efficiently as possible. Check out the [deployment documentation](https://docs.nestjs.com/deployment) for more information.

If you are looking for a cloud-based platform to deploy your NestJS application, check out [Mau](https://mau.nestjs.com), our official platform for deploying NestJS applications on AWS. Mau makes deployment straightforward and fast, requiring just a few simple steps:

```bash
$ npm install -g @nestjs/mau
$ mau deploy
```

With Mau, you can deploy your application in just a few clicks, allowing you to focus on building features rather than managing infrastructure.

## Resources

Check out a few resources that may come in handy when working with NestJS:

- Visit the [NestJS Documentation](https://docs.nestjs.com) to learn more about the framework.
- For questions and support, please visit our [Discord channel](https://discord.gg/G7Qnnhy).
- To dive deeper and get more hands-on experience, check out our official video [courses](https://courses.nestjs.com/).
- Deploy your application to AWS with the help of [NestJS Mau](https://mau.nestjs.com) in just a few clicks.
- Visualize your application graph and interact with the NestJS application in real-time using [NestJS Devtools](https://devtools.nestjs.com).
- Need help with your project (part-time to full-time)? Check out our official [enterprise support](https://enterprise.nestjs.com).
- To stay in the loop and get updates, follow us on [X](https://x.com/nestframework) and [LinkedIn](https://linkedin.com/company/nestjs).
- Looking for a job, or have a job to offer? Check out our official [Jobs board](https://jobs.nestjs.com).

## Support

Nest is an MIT-licensed open source project. It can grow thanks to the sponsors and support by the amazing backers. If you'd like to join them, please [read more here](https://docs.nestjs.com/support).

## Stay in touch

- Author - [Kamil Myśliwiec](https://twitter.com/kammysliwiec)
- Website - [https://nestjs.com](https://nestjs.com/)
- Twitter - [@nestframework](https://twitter.com/nestframework)

## License

Nest is [MIT licensed](https://github.com/nestjs/nest/blob/master/LICENSE).

## Cambios realizados (resumen)

- Implementación de autenticación basada en JWT (RS256) y refresh tokens.
- Tokens de acceso: JWT firmado con clave privada (RS256), expiración por defecto 15 minutos.
- Refresh tokens: UUIDs generados, almacenados en la BD con hash (bcrypt) y expiración (7 días).
- Logout: registra `jti` como revocado y marca los refresh tokens del usuario como revocados.
- Sincronización opcional con un backend Django: creación/búsqueda de `cliente` o `proveedor` mediante `DJANGO_API_BASE` y `DJANGO_SERVICE_TOKEN`.
- Endpoints protegidos con `passport-jwt` y estrategia que lee la clave pública desde `JWT_PUBLIC_KEY_PATH`.
- Entidades principales: `User`, `RefreshToken`, `RevokedToken` (migraciones/TypeORM automáticas según configuración).

## API REST (endpoints principales)

- **POST /auth/register**
  - Descripción: crear un usuario y devolver tokens.
  - Body (JSON): `username`, `password`, opcional: `email`, `firstName`, `lastName`, `role`, `telefono`, `descripcion`, `ubicacion`.
  - Respuesta (200): `{ "accessToken": "<jwt>", "refreshToken": "<token>" }`

- **POST /auth/login**
  - Descripción: autenticar por `username` + `password`.
  - Body (JSON): `username`, `password`.
  - Respuesta (200): `{ "accessToken": "<jwt>", "refreshToken": "<token>" }`
  - Seguridad: este endpoint tiene rate limiting (por defecto 5 intentos por 60s).

- **POST /auth/logout**
  - Descripción: cerrar sesión (revoca el `jti` del access token y marca los refresh tokens del usuario como revocados).
  - Headers: `Authorization: Bearer <accessToken>`
  - Respuesta: 200 OK (vacío)

- **POST /auth/refresh**
  - Descripción: intercambiar un refresh token válido por un nuevo access token.
  - Body (JSON): `{ "refreshToken": "<token>" }`
  - Respuesta (200): `{ "accessToken": "<jwt>" }`

- **GET /users/me**
  - Descripción: devuelve el perfil unificado del usuario (datos locales + datos extendidos de Django si está configurado).
  - Headers: `Authorization: Bearer <accessToken>`
  - Respuesta: objeto con `id`, `user` (username, first_name, last_name, email), `telefono`, `descripcion`, `ubicacion`, `rol`.

- **GET /auth/me**
  - Descripción: alias protegido que devuelve el mismo perfil unificado que `/users/me`.
  - Headers: `Authorization: Bearer <accessToken>`
  - Respuesta: objeto de perfil.

- **GET /auth/validate** (interno)
  - Descripción: valida un JWT y comprueba que no esté en la blacklist de tokens revocados.
  - Parámetros: `token` (query) o `Authorization: Bearer <token>` header.
  - Respuesta (200): `{ "valid": true, "payload": { ... } }` o 401 si no válido/expirado/revocado.

- **POST /users/sync**
  - Descripción: endpoint para solicitar sincronización con Django (creación de cliente/proveedor). Requiere que `DJANGO_API_BASE` y `DJANGO_SERVICE_TOKEN` estén configurados.
  - Body (JSON): `{ "role": "cliente|proveedor", "payload": { ... } }`

## Cómo funciona la autenticación (flujo)

- Al registrarse o iniciar sesión el servicio genera:
  - `accessToken` (JWT RS256). Contiene `sub` (user id), `username`, `role`, `jti`.
  - `refreshToken` (string tipo UUID doble) que se guarda en BD con hash (bcrypt).
- Los clientes usan `Authorization: Bearer <accessToken>` para acceder a rutas protegidas.
- Cuando el access token expira, el cliente llama a `/auth/refresh` con el `refreshToken` para obtener un nuevo `accessToken`.
- Al hacer logout, el `jti` se inserta en la tabla de tokens revocados y los refresh tokens del usuario se marcan como revocados.

### Rotación de refresh tokens

- El servicio implementa rotación de refresh tokens: al usar `/auth/refresh` con un refresh token válido, ese refresh token se marca como revocado y se emite un nuevo `refreshToken` junto al nuevo `accessToken`.
- Si se detecta que un refresh token ya fue revocado (reutilización), se considera un posible ataque y se revocan todos los refresh tokens del usuario.
- Hay un límite configurable de refresh tokens activos por usuario (`REFRESH_TOKENS_MAX_PER_USER`) — los tokens más antiguos se revocan automáticamente.

### Configuraciones importantes

- `ACCESS_TOKEN_EXPIRES_MINUTES` : minutos de vigencia del access token (default 15).
- `REFRESH_TOKEN_EXPIRES_DAYS` : días de vigencia del refresh token (default 7).
- `REFRESH_TOKENS_MAX_PER_USER` : número máximo de refresh tokens activos por usuario (default 5).

## Variables de entorno importantes

- `JWT_PRIVATE_KEY_PATH` : ruta al archivo PEM con la clave privada (usada para firmar JWT).
- `JWT_PUBLIC_KEY_PATH`  : ruta al archivo PEM con la clave pública (usada por la estrategia para verificar JWT).
- `DJANGO_API_BASE`      : (opcional) URL base del backend Django para sincronización.
- `DJANGO_SERVICE_TOKEN` : (opcional) token de servicio para autenticación hacia Django.
- Configuración de base de datos: configure TypeORM según su entorno (archivo `ormconfig` o variables de entorno). El proyecto incluye `sqlite3` en dependencias para uso local.

Ejemplo mínimo `.env` local:

```
JWT_PRIVATE_KEY_PATH=./keys/jwt_private.pem
JWT_PUBLIC_KEY_PATH=./keys/jwt_public.pem
DJANGO_API_BASE=
DJANGO_SERVICE_TOKEN=
```

## Ejecutar el servicio (desarrollo)

1. Instalar dependencias:

```bash
npm install
```

2. Asegurarse de tener las claves en `./keys` y las variables de entorno configuradas.

3. Ejecutar en modo desarrollo:

```bash
npm run start:dev
```

## Ejemplos rápidos (curl)

- Registro:

```bash
curl -X POST http://localhost:3000/auth/register \
  -H "Content-Type: application/json" \
  -d '{"username":"juan","password":"secret"}'
```

- Login:

```bash
curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"juan","password":"secret"}'
```

- Acceder a `me` con token:

```bash
curl http://localhost:3000/users/me \
  -H "Authorization: Bearer <accessToken>"
```

- Refresh:

```bash
curl -X POST http://localhost:3000/auth/refresh \
  -H "Content-Type: application/json" \
  -d '{"refreshToken":"<refreshToken>"}'
```

## Notas y consideraciones

- La verificación de JWT usa `JWT_PUBLIC_KEY_PATH` y la firma usa `JWT_PRIVATE_KEY_PATH` (RS256). Asegúrese de que las rutas apunten a archivos PEM válidos.
- Los refresh tokens se guardan con hash para no almacenar tokens en texto plano.
- La sincronización con Django es opcional; si no se configura, el servicio funciona localmente pero no empujará datos a Django.
- Para producción, rote claves, asegure las variables de entorno y configure HTTPS en el proxy frontal.

## Seguridad implementada

### Rate Limiting
- El endpoint `POST /auth/login` tiene rate limiting configurado (5 intentos por minuto por IP).
- Implementado con `express-rate-limit` en `main.ts`.
- Respuesta 429 si se excede el límite.

### Blacklist de tokens revocados
- Al hacer logout, el `jti` del access token se guarda en la tabla `revoked_tokens`.
- El endpoint `/auth/validate` verifica que el token no esté en la blacklist antes de considerarlo válido.
- Los refresh tokens se marcan como revocados en la tabla `refresh_tokens`.

### Protección de endpoint interno
- `GET /auth/validate` requiere header `X-Service-Token` con el valor de `INTERNAL_SERVICE_TOKEN`.
- Esto previene que clientes externos usen el endpoint de validación interno.

## Validación local de tokens (otros microservicios)

Los demás microservicios pueden validar tokens **sin consultar al Auth Service** en cada petición:

### Opción 1: Endpoint JWKS (recomendado)
El Auth Service expone la clave pública en:
```
GET /.well-known/jwks.json
```

Otros servicios pueden:
1. Descargar la clave pública una vez al iniciar (o cachearla con TTL).
2. Usar la clave para verificar la firma RS256 del JWT localmente.
3. Verificar `exp` (expiración) localmente.

Ejemplo en Node.js:
```javascript
const jwt = require('jsonwebtoken');
const axios = require('axios');

// Cachear la clave pública
let publicKey = null;
async function getPublicKey() {
  if (!publicKey) {
    const res = await axios.get('http://auth-service:3000/.well-known/jwks.json');
    publicKey = res.data.keys[0].pem;
  }
  return publicKey;
}

// Validar token localmente
async function validateTokenLocally(token) {
  const key = await getPublicKey();
  return jwt.verify(token, key, { algorithms: ['RS256'] });
}
```

### Opción 2: Copiar clave pública
Distribuir el archivo `jwt_public.pem` a todos los microservicios y usarlo directamente.

### Opción 3: Usar el módulo compartido (recomendado para NestJS/Express)
El Auth Service incluye un módulo de validación local en `src/shared/jwt-local-validator.ts` que puedes copiar a otros microservicios:

```typescript
// Copiar jwt-local-validator.ts a tu microservicio
import { validateTokenLocally, createLocalJwtMiddleware } from './jwt-local-validator';

// Uso directo
const result = await validateTokenLocally(token, 'http://auth-service:3000');
if (result.valid) {
  console.log('Usuario:', result.payload.username);
}

// Como middleware Express
app.use('/api/protected', createLocalJwtMiddleware('http://auth-service:3000'));

// Como Guard NestJS (ver ejemplo en el archivo)
@UseGuards(LocalJwtGuard)
@Get('protected')
getProtected(@Req() req) {
  return req.user;
}
```

El módulo incluye:
- Cache automático de la clave pública (1 hora TTL)
- Validación de firma RS256 y expiración
- Middleware listo para Express
- Ejemplo de Guard para NestJS

### Cuándo consultar /auth/validate
- Solo usar `/auth/validate` cuando se necesite verificar si el token está en la blacklist (ej. operaciones críticas).
- Para la mayoría de requests, la validación local de firma + expiración es suficiente.

## Base de datos (entidades)

### User
| Campo | Tipo | Descripción |
|-------|------|-------------|
| id | UUID | Identificador único |
| username | string | Nombre de usuario único |
| email | string | Email único |
| passwordHash | string | Hash bcrypt de la contraseña |
| firstName | string | Nombre |
| lastName | string | Apellido |
| role | string | Rol (cliente, proveedor, admin) |
| createdAt | timestamp | Fecha de creación |

### RefreshToken
| Campo | Tipo | Descripción |
|-------|------|-------------|
| id | UUID | Identificador único |
| userId | string | ID del usuario |
| tokenHash | string | Hash bcrypt del refresh token |
| expiresAt | timestamp | Fecha de expiración (7 días) |
| revokedAt | timestamp | Fecha de revocación (null si activo) |

### RevokedToken (blacklist)
| Campo | Tipo | Descripción |
|-------|------|-------------|
| jti | string | ID único del JWT (PK) |
| userId | string | ID del usuario |
| expiresAt | timestamp | Fecha de expiración original del JWT |
| revokedAt | timestamp | Fecha de revocación |

## Generación de claves RSA

Ejecutar una vez para generar las claves:

```bash
mkdir -p keys
openssl genrsa -out keys/jwt_private.pem 2048
openssl rsa -in keys/jwt_private.pem -pubout -out keys/jwt_public.pem
```

---

Documento generado automáticamente: resumen de cambios y funcionamiento REST del microservicio de autenticación.
