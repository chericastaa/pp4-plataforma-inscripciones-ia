# Users Service

Microservicio encargado de la gestión de usuarios y autenticación de la plataforma de inscripciones.

## Tecnologías

- Node.js 20
- Express 5
- MySQL (via `mysql2`)
- JWT para autenticación (`jsonwebtoken`)
- `bcrypt` para hash de contraseñas
- `dotenv` para variables de entorno
- `cors`

## Requisitos previos

- Node.js 20 o superior (si se corre local, sin Docker)
- Docker y Docker Compose (si se corre con contenedores)
- Una base de datos MySQL 8.0 accesible (el proyecto ya provee una vía `docker-compose`)

## Variables de entorno

Este servicio necesita las siguientes variables (definidas en el `.env` de la raíz del proyecto o pasadas por `docker-compose.yml`):

| Variable | Descripción |
|---|---|
| `DB_HOST` | Host de la base de datos (`mysql` si se usa Docker Compose) |
| `DB_USER` | Usuario de la base de datos |
| `DB_PASSWORD` | Contraseña del usuario de la base de datos |
| `DB_NAME` | Nombre de la base de datos |
| `DB_PORT` | Puerto de MySQL (por defecto `3306`) |
| `JWT_SECRET` | Clave secreta usada para firmar los tokens JWT |

## Cómo correrlo

### Con Docker Compose (recomendado)

Desde la raíz del proyecto (donde está el `docker-compose.yml`):

```bash
docker compose up --build users-service
```

O para levantar todo el sistema junto (recomendado, ya que este servicio depende de MySQL):

```bash
docker compose up --build
```

El servicio queda expuesto en el puerto **3001**.

### En local, sin Docker

```bash
cd users-service
npm install
npm run dev
```

Asegurate de tener un archivo `.env` en esta carpeta con las variables de entorno listadas arriba, y una instancia de MySQL corriendo y accesible.

## Scripts disponibles

| Comando | Descripción |
|---|---|
| `npm run dev` | Levanta el servicio con `node server.js` |
| `npm start` | Igual que `dev`, pensado para producción |

## Puerto

El servicio corre por defecto en el puerto **3001**.