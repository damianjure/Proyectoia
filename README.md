# Church Planning Hub

Aplicación de planificación y coordinación para una iglesia, construida con `Next.js`, `NextAuth`, `Prisma` y `PostgreSQL`.

## Stack recomendado para producción

- App: `Vercel`
- Base de datos: `Supabase Postgres`
- Backups de la app: `Supabase Storage` en bucket privado

## Variables de entorno

Tomá como base [`.env.example`](/Users/damian/Documents/Dev/church-planning-hub/.env.example).

### Base de datos

- `DATABASE_URL`
  - URL del pooler de Supabase para el runtime de la app.
- `DIRECT_URL`
  - URL directa de Supabase para migraciones Prisma.

### Auth

- `NEXTAUTH_URL`
  - URL pública de la app. En local: `http://localhost:3000`.
- `NEXTAUTH_SECRET`
  - Generala con `openssl rand -base64 32`.
- `SKIP_AUTH`
  - Dejalo en `false`. Solo sirve para desarrollo controlado.

### Backups

- `BACKUP_STORAGE`
  - `local` en desarrollo local.
  - `supabase` en Vercel.
- `SUPABASE_URL`
  - URL del proyecto de Supabase.
- `SUPABASE_SERVICE_ROLE_KEY`
  - Service role key del proyecto. Solo servidor.
- `SUPABASE_BACKUP_BUCKET`
  - Nombre del bucket privado para backups. Recomendado: `backups`.

## Desarrollo local

1. Instalá dependencias:

```bash
npm install
```

2. Configurá `.env` a partir de `.env.example`.

3. Generá Prisma y corré migraciones:

```bash
npm run prisma:generate
npm run db:migrate
```

4. Seed opcional:

```bash
npm run db:seed
```

5. Levantá la app:

```bash
npm run dev
```

## Preparación para Vercel + Supabase

### 1. Crear la base en Supabase

- Creá un proyecto nuevo en Supabase.
- Copiá:
  - la URL del pooler para `DATABASE_URL`
  - la conexión directa para `DIRECT_URL`
- Corré las migraciones contra esa base:

```bash
npm run db:deploy
```

### 2. Crear bucket privado para backups

- En Supabase Storage, creá un bucket privado llamado `backups`.
- Cargá en Vercel:
  - `SUPABASE_URL`
  - `SUPABASE_SERVICE_ROLE_KEY`
  - `SUPABASE_BACKUP_BUCKET=backups`
  - `BACKUP_STORAGE=supabase`

### 3. Configurar Vercel

- Importá el repo en Vercel.
- Definí estas variables:
  - `DATABASE_URL`
  - `DIRECT_URL`
  - `NEXTAUTH_URL`
  - `NEXTAUTH_SECRET`
  - `BACKUP_STORAGE`
  - `SUPABASE_URL`
  - `SUPABASE_SERVICE_ROLE_KEY`
  - `SUPABASE_BACKUP_BUCKET`
  - `SKIP_AUTH=false`

La app ya está preparada para:
- generar Prisma en build con `npm run build`
- usar `DATABASE_URL` para runtime
- usar `DIRECT_URL` para migraciones
- guardar backups fuera del filesystem local cuando `BACKUP_STORAGE=supabase`

## Scripts útiles

- `npm run dev`
- `npm run build`
- `npm run start`
- `npm run lint`
- `npm run test`
- `npm run prisma:generate`
- `npm run db:migrate`
- `npm run db:deploy`
- `npm run db:seed`

## Validación recomendada antes de subir

```bash
npm run lint
npm run test
npm run build
```
