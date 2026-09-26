# Plataforma de Inscripciones — Frontend

Cliente web de la plataforma de inscripciones, construido con Next.js. Consume los servicios `users-service` y `academic-service`.

## Tecnologías

- Next.js 16 (React 19)
- TypeScript
- Tailwind CSS 4
- Radix UI (componentes accesibles: dialog, popover, select, tabs, etc.)
- React Hook Form + Zod (formularios y validación)
- Zustand (manejo de estado)
- Axios (llamadas a la API)
- Nodemailer (envío de emails, si aplica)

## Requisitos previos

- Node.js 20 o superior (si se corre local, sin Docker)
- Docker y Docker Compose (si se corre con contenedores)
- Los servicios `users-service` y `academic-service` deben estar corriendo y accesibles

## Variables de entorno

Revisar si el proyecto tiene un archivo `.env.example` con las variables necesarias. Como mínimo, probablemente se necesite configurar las URLs de los backends, por ejemplo:

| Variable | Descripción |
|---|---|
| `NEXT_PUBLIC_USERS_SERVICE_URL` | URL pública del `users-service` |
| `NEXT_PUBLIC_ACADEMIC_SERVICE_URL` | URL pública del `academic-service` |

> Si el proyecto usa Nodemailer para enviar correos (por ejemplo, notificaciones o recuperación de contraseña), probablemente también se necesiten variables como `EMAIL_HOST`, `EMAIL_USER`, `EMAIL_PASSWORD`. Confirmar cuáles se usan revisando el código donde se llama a `nodemailer`.

## Cómo correrlo

### Con Docker Compose (recomendado)

Desde la raíz del proyecto (donde está el `docker-compose.yml`):

```bash
docker compose up --build frontend
```

O para levantar todo el sistema junto (recomendado, ya que depende de los dos backends):

```bash
docker compose up --build
```

El frontend queda expuesto en el puerto **3000**.

### En local, sin Docker

```bash
cd plataforma-inscripciones-frontend
npm install
npm run dev
```

Asegurate de tener los backends (`users-service` y `academic-service`) corriendo y accesibles, y las variables de entorno configuradas.

## Scripts disponibles

| Comando | Descripción |
|---|---|
| `npm run dev` | Levanta el servidor de desarrollo de Next.js |
| `npm run build` | Genera el build de producción |
| `npm start` | Corre el build de producción |
| `npm run lint` | Corre el linter (ESLint) |

## Puerto

El frontend corre por defecto en el puerto **3000**.