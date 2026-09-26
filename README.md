# Plataforma de Inscripciones

Sistema web para la gestión de inscripciones académicas, compuesto por un frontend y dos microservicios backend independientes, cada uno con su propia responsabilidad.

## ¿De qué se trata el proyecto?

La plataforma permite a los usuarios (estudiantes) registrarse, autenticarse, e inscribirse a materias o actividades académicas. Para lograr esto, el sistema separa las responsabilidades en distintos servicios independientes que se comunican entre sí, en lugar de tener todo en una sola aplicación monolítica.

## Arquitectura

El proyecto sigue una **arquitectura de microservicios**, con tres capas principales (frontend, capa de usuarios, capa académica) y una base de datos compartida:

```
┌─────────────────────┐
│      Frontend        │  (Next.js) — puerto 3000
│  Interfaz de usuario │
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
           └───────────┬──────────────┘
                        ▼
              ┌───────────────────┐
              │      MySQL          │
              │   puerto 3306       │
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
- Es consultado por el `academic-service` para verificar la identidad de un usuario antes de procesar una inscripción.

Se conecta directamente a la base de datos MySQL para guardar y consultar usuarios.

### 3. Academic Service (`academic-service/`)

Microservicio encargado de la lógica académica del sistema:
- Gestión de materias, cursos o actividades disponibles.
- Procesamiento de inscripciones.
- Se comunica con `users-service` (vía HTTP, usando `axios`) para validar que el usuario que se inscribe existe y está autenticado.

También se conecta directamente a la base de datos MySQL, en tablas separadas de las de usuarios.

### Base de datos (MySQL)

Una única instancia de MySQL, compartida por ambos backends (cada uno usa sus propias tablas). Se define y persiste mediante un volumen de Docker (`mysql_data`), así los datos no se pierden al reiniciar los contenedores.

## Por qué esta arquitectura

Separar el sistema en servicios independientes (en vez de un solo backend) permite:
- Que cada equipo/persona pueda trabajar y desplegar su parte sin afectar a las demás.
- Escalar o modificar un servicio (por ejemplo, el académico) sin tocar el de usuarios.
- Que cada servicio tenga su propio ciclo de vida, dependencias y, si hiciera falta, hasta su propia base de datos en el futuro.

## Cómo correr el proyecto completo

Requiere tener **Docker Desktop** instalado y corriendo. Desde la raíz del proyecto:

```bash
docker compose up --build
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

El proyecto usa un archivo `.env` en la raíz (no incluido en el repositorio por seguridad) con, como mínimo:

```
DB_ROOT_PASSWORD=
DB_NAME=
JWT_SECRET=
```