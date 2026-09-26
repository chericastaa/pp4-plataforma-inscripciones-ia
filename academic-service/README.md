# Academic Service

Microservicio encargado de la lógica académica de la plataforma (inscripciones, materias, y demás información académica). Se comunica con el `users-service` para validar información de usuarios.

## Tecnologías

- Node.js 20
- Express 5
- MySQL (via `mysql2`)
- JWT para autenticación (`jsonwebtoken`)
- `axios` para comunicarse con otros servicios (como `users-service`)
- `dotenv` para variables de entorno
- `cors`

## Requisitos previos

- Node.js 20 o superior (si se corre local, sin Docker)
- Docker y Docker Compose (si se corre con contenedores)
- Una base de datos MySQL 8.0 accesible
- El `users-service` corriendo y accesible, ya que este servicio depende de él

## Variables de entorno

| Variable | Descripción |
|---|---|
| `DB_HOST` | Host de la base de datos (`mysql` si se usa Docker Compose) |
| `DB_USER` | Usuario de la base de datos |
| `DB_PASSWORD` | Contraseña del usuario de la base de datos |
| `DB_NAME` | Nombre de la base de datos |
| `DB_PORT` | Puerto de MySQL (por defecto `3306`) |
| `PORT` | Puerto en el que corre este servicio (`4000`) |
| `JWT_SECRET` | Clave secreta usada para validar los tokens JWT |
| `USERS_SERVICE_URL` | URL base del `users-service` (`http://users-service:3001` en Docker Compose) |

## Cómo correrlo

### Con Docker Compose (recomendado)

Desde la raíz del proyecto (donde está el `docker-compose.yml`):

```bash
docker compose up --build academic-service
```

O para levantar todo el sistema junto (recomendado, ya que depende de MySQL y de `users-service`):

```bash
docker compose up --build
```

El servicio queda expuesto en el puerto **4000**.

### En local, sin Docker

```bash
cd academic-service
npm install
npm run dev
```

Asegurate de tener un archivo `.env` en esta carpeta con las variables de entorno listadas arriba, MySQL corriendo, y el `users-service` levantado y accesible en la URL configurada en `USERS_SERVICE_URL`.

## Scripts disponibles

| Comando | Descripción |
|---|---|
| `npm run dev` | Levanta el servicio con `node server.js` |
| `npm start` | Igual que `dev`, pensado para producción |

## Puerto

El servicio corre por defecto en el puerto **4000**.