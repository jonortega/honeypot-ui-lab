# HoneypotUiLab — Honeypot de baja interacción con dashboard

> **Repositorio:** `honeypot-ui-lab`  
> **Demo local rápida:** ver sección **3. Guía de ejecución**



## Tabla de contenidos

1. [Descripción](#1-descripción)  
2. [Arquitectura](#2-arquitectura)  
3. [Guía de ejecución](#3-guía-de-ejecución)  
4. [Demo](#4-demo)  
5. [API](#5-api)  
6. [Esquema de datos](#6-esquema-de-datos)  
7. [Seguridad](#7-seguridad)  
8. [Tests](#8-tests)  
9. [Problemas y soluciones](#9-problemas-y-soluciones)  
10. [Roadmap](#10-roadmap)  
11. [Decisiones explícitas del alumno](#11-decisiones-explícitas-del-alumno)



## 1) Descripción

### 1.1 Descripción general
Este proyecto implementa un **honeypot de baja interacción** que simula un servicio expuesto (SSH o HTTP) para registrar intentos de intrusión. Los eventos se almacenan en **SQLite**, se consultan mediante una **API read-only** y se visualizan en un **dashboard web** (Next.js) con métricas y gráficas.

### 1.2 Motivación
Este proyecto nace de mi interés por aprender cómo se diseña y despliega un honeypot de manera **segura y ética**, sin exponer el sistema a riesgos innecesarios. El reto va más allá de programar: quiero adquirir experiencia en la construcción de un sistema modular, donde cada parte (servicio honeypot, base de datos, API, dashboard) encaja dentro de una arquitectura clara.  

Me interesa reforzar conceptos de **ingeniería de software**: diseño limpio, despliegue reproducible con un solo comando, integración de CI/CD, pruebas y documentación. Busco demostrar que no solo sé programar, sino que tengo una **visión completa de todo el ciclo de desarrollo**, desde la captura de datos hasta la visualización en un dashboard. Para lograrlo necesito aplicar gestión, planificación y seguimiento, asegurando que las distintas fases del proyecto estén conectadas.


## 2) Arquitectura

**Diagrama de alto nivel (Mermaid):**

``` mermaid
flowchart LR
  A[Internet] -->|conexiones reales| B[Servicio Honeypot<br/>SSH o HTTP]
  B --> C[Collector/<br/>Normalizador]
  C --> D[(SQLite)]
  D --> E[API REST<br/>read-only]
  E --> F[Dashboard<br/>Next.js]
```



## 3) Guía de ejecución

### 3.1 Requisitos
- **Docker** y **Docker Compose** instalados.  
- Recursos mínimos: 2 núcleos, 2 GB RAM, 1 GB disco.

### 3.2 Variables de entorno
Crea un fichero `.env` en la raíz a partir de este ejemplo:

``` bash
# .env.local

```

### 3.3 Generar la clave de host SSH (obligatoria)
Desde `apps/honeypot/`:

``` bash
ssh-keygen -t rsa -b 2048 -m PEM -f host.key -N ""
chmod 600 host.key
# Añadido a .gitignore local: host.key y host.key.pub
```

### 3.4 Arranque (desarrollo)
Desde la **raíz del repo**:

``` bash
pnpm -w --filter honeypot dev
# Salida esperada:
# [hp/ssh] SSH honeypot escuchando en puerto 2222
```

### 3.4 Puesta en marcha (local)

**Con Docker Compose:**

``` bash
docker compose up -d --build
docker compose logs -f honeypot
docker compose logs -f api
docker compose logs -f dashboard
docker compose down
```

**Endpoints (por defecto):**
- API: `http://localhost:3000`  
- Dashboard: `http://localhost:3001`  
- Honeypot: puerto configurado en `HNY_PORT`  



## 4) Demo

### 4.1 Generar eventos de prueba

**HTTP:**
``` bash
curl -i -X POST "http://localhost:8080/login" \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"123456"}'
```

**SSH:**
``` bash
ssh -p 2222 root@localhost
```

### 4.2 Ver el dashboard
Accede a `http://localhost:3001` y revisa:
- Gráficas: intentos por día, top IPs, top usernames/paths.  
- Tabla: últimos eventos (con búsqueda y ordenación).  



## 5) API

> **Auth:** enviar `Authorization: Bearer <HNY_ADMIN_TOKEN>` en cada petición.

### 5.1 Endpoints

#### `GET /api/stats/summary`  
Devuelve estadísticas agregadas: número total de eventos, eventos por día y rankings básicos.

**Ejemplo de respuesta:**
``` json
{
  "totalEvents": 42,
  "byDay": [
    { "date": "2025-09-01", "count": 10 },
    { "date": "2025-09-02", "count": 32 }
  ],
  "topIPs": [
    { "ip": "192.168.1.10", "count": 15 }
  ],
  "topUsernames": [
    { "username": "root", "count": 20 }
  ],
  "topPaths": [
    { "path": "/login", "count": 12 }
  ]
}
```

#### `GET /api/events`  
Devuelve eventos de manera paginada, con filtros opcionales.

**Parámetros de query:**
- `limit` (int, por defecto 50) → número de eventos a devolver.  
- `offset` (int, por defecto 0) → desplazamiento para la paginación.  
- `service` (string, opcional) → filtrar por tipo de servicio (`ssh` | `http`).  
- `ip` (string, opcional) → filtrar por dirección IP origen.  
- `from` / `to` (string ISO 8601, opcionales) → rango de fechas.  

**Ejemplo de respuesta:**
``` json
{
  "items": [
    {
      "id": 1,
      "ts_utc": "2025-09-01T10:23:45Z",
      "src_ip": "192.168.1.10",
      "service": "ssh",
      "username": "root",
      "password": "123456"
    }
  ],
  "page": { "limit": 50, "offset": 0, "total": 1 }
}
```



## 6) Esquema de datos

``` sql
CREATE TABLE IF NOT EXISTS events (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  ts_utc TEXT NOT NULL,
  src_ip TEXT NOT NULL,
  src_port INTEGER,
  service TEXT NOT NULL,
  username TEXT,
  password TEXT,
  http_method TEXT,
  http_path TEXT,
  http_status INTEGER,
  user_agent TEXT,
  raw JSON,
  country TEXT,
  asn TEXT
);

CREATE INDEX IF NOT EXISTS idx_events_ts ON events(ts_utc);
CREATE INDEX IF NOT EXISTS idx_events_ip ON events(src_ip);
CREATE INDEX IF NOT EXISTS idx_events_service ON events(service);
```



## 7) Seguridad

- Honeypot de **baja interacción** (no ejecutar binarios ni comandos).  
- Procesos sin root en contenedores.  
- Solo se expone el puerto honeypot.  
- Retención limitada: se documentará (30–90 días).  
- Uso exclusivamente didáctico y ético.  



## 8) Tests

Actualmente solo hay **comprobaciones manuales** (insertar datos y verificarlos en dashboard/API).  
Pendiente de añadir:  
- Tests unitarios.  
- Tests de integración.  
- Tests E2E con Docker Compose.  

**Ejecución de tests (cuando estén disponibles):**

``` bash
pnpm run lint
pnpm run test
```



## 9) Problemas y soluciones

Durante el desarrollo se han identificado y resuelto varios problemas:

- **Variables de entorno incorrectas**: al inicio los nombres no coincidían, provocando que la API devolviera errores. Se solucionó corrigiendo el `.env.local`.  
- **Error de fechas inválidas en el Dashboard**: aparecía `Invalid time value` al formatear timestamps. Se corrigió revisando cómo se generaban y guardaban las fechas en la DB.  
- **Compatibilidad Next.js + Jest**: algunos errores al configurar tests en App Router (Next.js 15). Se solucionó mapeando módulos correctamente y usando queries accesibles (`findByRole` en lugar de `findByText` en diálogos).  
- **Problemas con `searchParams` en tests**: se corrigió usando `Promise.resolve({ timeRange: "short_term" })` para igualar tipos.  
- **CI/CD inicial**: dificultades en GitHub Actions para ejecutar Next.js y testear antes del despliegue. Se ajustó el workflow para lanzar el servidor (`pnpm start &`) antes de correr los tests.  
- **Import CJS (`ssh2`) en proyecto ESM:** error `does not provide an export named 'Server'`.  
  **Solución:** configurar TypeScript con `module: "NodeNext"`, `moduleResolution: "NodeNext"`, habilitar `esModuleInterop` y usar `import ssh2 from "ssh2"` (namespace) o `createRequire(import.meta.url)`.

- **Extensiones en imports ESM:** con `NodeNext`, los imports relativos requieren **extensión `.js`** en tiempo de ejecución.  
  **Solución:** actualizar imports internos (`../config.js`, `../collector/collector.js`).

- **Clave de host ausente:** `ENOENT: open 'host.key'`.  
  **Solución:** generación guiada de `host.key` y lectura vía `HNY_HOST_KEY_PATH` con mensaje de error claro si falta.

- **Permisos al abrir puerto 22:** `EACCES` en Linux y colisión con `sshd`.  
  **Solución:** usar **puerto alto (p. ej. 2222)** en dev (`HNY_PORT=2222`).

- **Carga de `.env.local`:** inicialmente solo se leía `.env`.  
  **Solución:** el servicio carga **`.env.local`** explícitamente en la raíz del repo.

- **Resolución de ruta a la DB:** los paths relativos se resuelven frente a `process.cwd()`.  
  **Solución:** normalización a **ruta absoluta** en el collector y creación de directorio si no existe.

- **Múltiples eventos por conexión:** clientes SSH suelen probar varios métodos (`none`, `publickey`, `keyboard-interactive`, `password`) en una misma conexión.  
  **Solución adoptada:** registrar cada intento de autenticación (comportamiento actual). *(Se puede filtrar en el futuro si se desea.)*



## 10) Roadmap

### Próximas tareas (pendientes de MVP)
- [ ] Implementar servicio honeypot HTTP.  
- [ ] Añadir tests unitarios, de integración y E2E.  
- [ ] Configurar CI/CD en GitHub Actions con pnpm.  
- [ ] Crear Dockerfiles para honeypot, API y dashboard.  
- [ ] Probar despliegue local completo con Docker Compose.  
- [ ] Preparar despliegue en VPS.  

### Futuro (nivel Pro)
- [ ] Multi-servicio (SSH + HTTP).  
- [ ] GeoIP (país/ASN).  
- [ ] Alertas (Discord/Slack).  
- [ ] Endpoint `/metrics` (Prometheus).  
- [ ] Mapa de ataques en el dashboard.  
- [ ] Exportación CSV/NDJSON.  
- [ ] Rate-limit y WAF ligero.  
- [ ] TLS con reverse proxy.  
- [ ] Despliegue infra con Terraform + Ansible.  
- [ ] Logs firmados / hash chain.  



## 11) Decisiones explícitas del alumno

- **Uso de monorepo con pnpm workspaces**: decisión tomada para agrupar `api`, `db`, `dashboard` y `honeypot` bajo un mismo repositorio, facilitando compartir tipos y librerías.  
- **Variables de entorno separadas**: se discutió la conveniencia de `.env` por cada workspace. Actualmente hay un `.env.local` en la raíz, pero la idea es independizar cada servicio.  
- **Dashboard con Next.js (App Router)**: se eligió para practicar con la última versión (Next.js 15) y aprovechar gráficos interactivos (Recharts).  
- **API con Node.js + SQLite**: enfoque simple y eficiente para persistencia. Se planteó `better-sqlite3` por rendimiento y sencillez.  
- **Testing**: decidido integrar Jest para pruebas unitarias e integración, con GitHub Actions como CI. Se registraron bloqueos iniciales (Radix UI + accesibilidad, `searchParams`), ya documentados.  
- **Despliegue**: estrategia progresiva → primero desarrollo local, luego contenerización con Docker, y finalmente despliegue en VPS. El dashboard se desplegará en Vercel en producción, mientras que el honeypot y la API estarán en la VPS.  
- **ESM + TypeScript (`NodeNext`)** para backend, manteniendo compatibilidad con `ssh2` (CJS) mediante `esModuleInterop` / `createRequire`.
- **Servicio SSH** de **baja interacción** con `ssh2.Server`, captura de `authentication` y rechazo sistemático.
- **Collector como única vía de escritura** a la DB (normaliza/sanea y llama a `insertEvent(dbPath, ev)`).
- **Configuración por `.env.local`** en la raíz: `HNY_SERVICE`, `HNY_PORT`, `HNY_DB_PATH`, `HNY_HOST_KEY_PATH`.
- **Gestión de rutas**: normalización a absoluta para `HNY_DB_PATH`; recomendación de puerto alto en dev.
- **Logs de consola** informativos (conexión y auth) sin ejecutar contenido del atacante.
