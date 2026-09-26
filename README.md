# Plataforma de Inscripciones

Sistema web para la gestión de inscripciones académicas, compuesto por un frontend y dos microservicios backend independientes, cada uno con su propia responsabilidad.

## ¿De qué se trata el proyecto?

La plataforma permite a los usuarios (estudiantes) registrarse, autenticarse, e inscribirse a materias o actividades académicas. Para lograr esto, el sistema separa las responsabilidades en distintos servicios independientes que se comunican entre sí, en lugar de tener todo en una sola aplicación monolítica.

## Arquitectura

El proyecto sigue una **arquitectura de microservicios**, con tres capas principales (frontend, capa de usuarios, capa académica) y **bases de datos separadas por servicio**:

```
┌─────────────────────┐
│      Frontend         │  (Next.js) — puerto 3000
│  Interfaz de usuario  │
└──────────┬───────────┘
           │ HTTP
           ├─────────────────────┐
           ▼                     ▼
┌─────────────────────┐  ┌─────────────────────┐
│   Users Service       │  │  Academic Service     │
│   puerto 3001         │◄─┤  puerto 4000          │
│   (auth y usuarios)   │  │  (lógica académica)   │
└──────────┬───────────┘  └──────────┬───────────┘
           │                          │
           ▼                          ▼
┌─────────────────────┐  ┌─────────────────────┐
│      users_db          │  │     academic_db       │
└─────────────────────┘  └─────────────────────┘
           │                          │
           └───────────┬──────────────┘
                        ▼
              ┌───────────────────┐
              │   MySQL (una sola      │
              │   instancia, dos        │
              │   bases separadas)     │
              │   puerto 3306           │
              └───────────────────┘
```

Todo el sistema se levanta junto mediante **Docker Compose**, que orquesta los 4 contenedores (frontend, users-service, academic-service, mysql) y se asegura de que arranquen en el orden correcto (por ejemplo, los backends esperan a que MySQL esté lista antes de conectarse).

## Las tres capas

### 1. Frontend (`plataforma-inscripciones-frontend/`)

Es la interfaz con la que interactúa el usuario final. Construida con **Next.js** (React), se encarga de:
- Mostrar las pantallas de login, registro, e inscripción a materias.
- Consumir las APIs de `users-service` y `academic-service` mediante peticiones HTTP (Axios).
- Manejar el estado de la aplicación en el cliente (Zustand) y la validación de formularios (React Hook Form + Zod).

No accede directamente a la base de datos — toda la información pasa por los backends.

### 2. Users Service (`users-service/`)

Microservicio encargado de todo lo relacionado a usuarios y autenticación:
- Registro y login de usuarios.
- Hasheo seguro de contraseñas (`bcrypt`).
- Generación y validación de tokens de sesión (JWT).
- Se conecta a su propia base de datos, `users_db`, donde vive la tabla `usuarios`.

### 3. Academic Service (`academic-service/`)

Microservicio encargado de la lógica académica del sistema:
- Gestión de materias, correlativas, inscripciones y calificaciones.
- Se conecta a su propia base de datos, `academic_db`, separada de la de usuarios.
- Se comunica con `users-service` **vía HTTP** (usando `axios`, a través de la variable `USERS_SERVICE_URL`) para validar datos del usuario antes de procesar una inscripción.
- Valida los JWT emitidos por `users-service` de forma local, usando un `JWT_SECRET` compartido entre ambos servicios (sin necesidad de consultar la base de usuarios para eso).

### Base de datos (MySQL)

Una única instancia de MySQL sirve a ambos backends, pero cada uno tiene su **propia base de datos separada**, sin tablas compartidas:

- `users_db` → usada exclusivamente por `users-service` (tabla `usuarios`).
- `academic_db` → usada exclusivamente por `academic-service` (tablas `materias`, `correlativas`, `inscripciones`, `calificaciones`).

Los dos servicios no acceden a la base del otro por SQL. Cuando `academic-service` necesita datos de un usuario, lo hace por HTTP contra `users-service`, no consultando su base directamente.

Las bases y sus tablas se crean automáticamente la primera vez que el contenedor de MySQL arranca con el volumen vacío, mediante los scripts SQL en `init-scripts/` (montados en `/docker-entrypoint-initdb.d`). Los datos persisten entre reinicios gracias al volumen de Docker `mysql_data` — pero si se borra ese volumen (`docker-compose down -v`), las bases se recrean desde cero a partir de esos scripts.

## Por qué esta arquitectura

Separar el sistema en servicios independientes, cada uno con su propia base de datos, permite:
- Que cada equipo/persona pueda trabajar y desplegar su parte sin afectar a las demás.
- Escalar o modificar un servicio (por ejemplo, el académico) sin tocar el de usuarios ni su base de datos.
- Que cada servicio tenga su propio ciclo de vida, dependencias y esquema de datos, de forma totalmente aislada.

## Cómo correr el proyecto completo

Requiere tener **Docker Desktop** instalado y corriendo. Desde la raíz del proyecto:

```bash
docker compose up -d --build
```

Esto levanta los 4 servicios juntos:

| Servicio | Puerto | URL local |
|---|---|---|
| Frontend | 3000 | http://localhost:3000 |
| Users Service | 3001 | http://localhost:3001 |
| Academic Service | 4000 | http://localhost:4000 |
| MySQL | 3306 | (uso interno, no se accede desde el navegador) |

## Documentación por servicio

Cada servicio tiene su propio README con más detalle sobre sus variables de entorno, scripts y cómo correrlo de forma individual:

- [`users-service/README.md`](./users-service/README.md)
- [`academic-service/README.md`](./academic-service/README.md)
- [`plataforma-inscripciones-frontend/README.md`](./plataforma-inscripciones-frontend/README.md)

## Variables de entorno

Cada servicio backend usa su propio `.env` (no incluido en el repositorio por seguridad).

**users-service:**
```
DB_HOST=mysql
DB_USER=root
DB_PASSWORD=
DB_NAME=users_db
DB_PORT=3306
PORT=3001
JWT_SECRET=
```

**academic-service:**
```
DB_HOST=mysql
DB_USER=root
DB_PASSWORD=
DB_NAME=academic_db
DB_PORT=3306
PORT=4000
JWT_SECRET=
USERS_SERVICE_URL=http://users-service:3001
```

`JWT_SECRET` debe ser **idéntico** en ambos servicios, ya que `academic-service` valida localmente los tokens emitidos por `users-service`.