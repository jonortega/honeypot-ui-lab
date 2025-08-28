# HoneypotUiLab — Honeypot de baja interacción con dashboard
 
> **Repositorio:** `honeypot-ui-lab`
> **Demo local rápida:** ver sección **3. Guía de ejecución**

---

## Tabla de contenidos

1. [Descripción](#1-descripción)
2. [Arquitectura](#2-arquitectura)
3. [Guía de ejecución](#3-guía-de-ejecución)
4. [Demo](#4-demo)
5. [API](#5-api)
6. [Esquema de datos](#6-esquema-de-datos)
7. [Seguridad](#7-seguridad)
8. [Tests](#8-tests)
9. [Roadmap](#9-roadmap)
10. [Licencia y créditos](#10-licencia-y-créditos)
11. [Decisiones explícitas del alumno](#11-decisiones-explícitas-del-alumno)
12. [Apéndices](#apéndices)

---

## 1) Descripción

### 1.1 Descripción general


### 1.2 Motivación


### 1.3 Objetivos

**Objetivos del MVP (checklist):**
- [ ] Captura de eventos reales/sintéticos.
- [ ] Persistencia en SQLite.
- [ ] API read-only con auth por token.
- [ ] Dashboard con gráficas y tabla.
- [ ] Contenedorización reproducible.
- [ ] Tests básicos + CI.


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
- Recursos mínimos: _Núcleos, RAM, disco_ (placeholder).

### 3.2 Variables de entorno

Crea un fichero `.env` en la raíz a partir de este ejemplo:

``` bash
# .env.local
HNY_SERVICE=ssh              # o http
HNY_PORT=22                  # 22 si ssh, 80/8080 si http
HNY_DB_PATH=./data/events.db
HNY_ADMIN_TOKEN=change-me
BASE_API_URL=http://api:3000
DASHBOARD_BASE_URL=http://localhost:3001
```

### 3.3 Puesta en marcha (local)

**Con Docker Compose (recomendado):**

``` bash
# 1) Construir e iniciar
docker compose up -d --build

# 2) Ver logs (cualquiera de los servicios)
docker compose logs -f honeypot
docker compose logs -f api
docker compose logs -f dashboard

# 3) Parar
docker compose down
```

**Con Make (opcional):**

``` bash
make dev        # entorno de desarrollo
make demo       # demo rápida con datos sintéticos
make test       # ejecutar tests
```

**Endpoints (por defecto):**
- **API:** `http://localhost:3000` (o `BASE_API_URL`)  
- **Dashboard:** `http://localhost:3001` (o `DASHBOARD_BASE_URL`)  
- **Honeypot:** puerto `HNY_PORT` publicado (expuesto según docker-compose)


## 4) Demo

### 4.1 Generar eventos de prueba

**Si el servicio es HTTP:**

``` bash
# Ejemplo: intento de login falso
curl -i -X POST "http://localhost:8080/login" \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"123456"}'
```

**Si el servicio es SSH:**

``` bash
# Intenta conectar al puerto del honeypot (no abrirá shell real)
ssh -p 2222 root@localhost
# Probar diversas credenciales y observar logs
```

### 4.2 Ver el dashboard

- Abre `http://localhost:3001` y revisa:
  - **Gráficas**: intentos por día, top IPs, top usernames/paths.  
  - **Tabla**: últimos N eventos (búsqueda/orden básico).

*(Inserta capturas o GIFs aquí cuando estén listos.)*


## 5) API

> **Auth:** enviar `Authorization: Bearer <HNY_ADMIN_TOKEN>` en cada petición.

### 5.1 Endpoints

- `GET /api/stats/summary`  
  **Descripción:** métricas agregadas (totales, por día, top IPs, etc.).  
  **Respuesta (ejemplo mínima):**

``` json
{
  "totalEvents": 0,
  "byDay": [],
  "topIPs": [],
  "topUsernames": [],
  "topPaths": []
}
```

- `GET /api/events?limit=50&offset=0&service=ssh|http&ip=...&from=...&to=...`  
  **Descripción:** eventos paginados con filtros básicos.  
  **Respuesta (ejemplo mínima):**

``` json
{
  "items": [],
  "page": { "limit": 50, "offset": 0, "total": 0 }
}
```

### 5.2 Ejemplos de uso (curl)

``` bash
# Summary
curl -s \
  -H "Authorization: Bearer $HNY_ADMIN_TOKEN" \
  "$BASE_API_URL/api/stats/summary"

# Eventos (paginado + filtro por servicio)
curl -s \
  -H "Authorization: Bearer $HNY_ADMIN_TOKEN" \
  "$BASE_API_URL/api/events?limit=50&offset=0&service=http"
```

*(Añade códigos de estado de error y mensajes una vez implementado.)*


## 6) Esquema de datos

**Tabla principal `events` (SQLite):**

``` sql
CREATE TABLE IF NOT EXISTS events (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  ts_utc TEXT NOT NULL,          -- ISO 8601
  src_ip TEXT NOT NULL,
  src_port INTEGER,
  service TEXT NOT NULL,         -- 'ssh' | 'http'
  username TEXT,                 -- ssh
  password TEXT,                 -- ssh (opcional)
  http_method TEXT,              -- http
  http_path TEXT,                -- http
  http_status INTEGER,           -- http (si simulas respuesta)
  user_agent TEXT,               -- http
  raw JSON,                      -- campos extra según servicio (limitado)
  country TEXT,                  -- pro (GeoIP)
  asn TEXT                       -- pro (GeoIP)
);

CREATE INDEX IF NOT EXISTS idx_events_ts ON events(ts_utc);
CREATE INDEX IF NOT EXISTS idx_events_ip ON events(src_ip);
CREATE INDEX IF NOT EXISTS idx_events_service ON events(service);
```

*(Agrega diagramas de relaciones si añades más tablas.)*


## 7) Seguridad

**Principios (resumen):**
- Baja interacción: **no** ejecutar binarios ni comandos de atacante.
- Mínimos privilegios: procesos sin root dentro de contenedores.
- Exponer **solo** el puerto del honeypot.
- Retención limitada: define plazos (p. ej., 30–90 días) y política de purga.
- **Ética y legalidad:** uso didáctico, sin contraataques ni escaneos de vuelta.
- Privacidad: almacenar solo metadatos técnicos necesarios.

*(Detallar headers de seguridad si habilitas reverse proxy/TLS en Pro.)*


## 8) Tests

**Tipos de prueba:**
- **Unitarias:** parser/normalizador de eventos, validadores.  
- **Integración:** levantar servicio y generar 2–3 eventos; verificar persistencia y API.  
- **E2E (opcional):** `docker compose` en CI.

**Cómo ejecutarlos:**

``` bash
# Lint + unit + integration
npm run lint
npm test

# E2E opcional (si aplica)
npm run test:e2e
```

**Cobertura (placeholder):** _inserta badge/report cuando esté._


## 9) Roadmap

**MVP (cierre):**
- [ ] Todos los requisitos de MVP marcados en la sección 1.

**Pro (elige ≥5):**
- [ ] Multi-servicio (SSH + HTTP / +Telnet/FTP falsos).  
- [ ] GeoIP (país/ASN).  
- [ ] Alertas (Discord/Slack) ante umbrales.  
- [ ] `/metrics` Prometheus.  
- [ ] Mapa de ataques por país en el dashboard.  
- [ ] Filtros avanzados en UI.  
- [ ] Exportación CSV/NDJSON; (opcional) integración ELK.  
- [ ] Rate-limit & WAF light en API/dashboard.  
- [ ] TLS tras reverse proxy + CSP/HSTS.  
- [ ] Despliegue reproducible (Terraform + Ansible).  
- [ ] Logs firmados / hash chain.  
- [ ] Panel “acciones rápidas” (bloqueo IP simulado/real).

*(Añade issues/enlaces a tareas cuando existan.)*


## 10) Licencia y créditos

- **Licencia:** _elige y enlaza (MIT/Apache-2.0/GPL-3.0/…)._  
- **Créditos / Agradecimientos:**  
  - Librerías y assets relevantes (enlaces).  
  - Inspiración/recursos consultados.


## 11) Decisiones explícitas del alumno

> Explica brevemente **qué** has elegido y **por qué**.

- **Servicio MVP:** ☐ SSH ☐ HTTP — _justificación breve (p. ej., complejidad, tipo de eventos)._  
- **Arquitectura:** ☐ Monolito ☐ Servicios separados — _criterios: simplicidad, despliegue, mantenimiento._  
- **Paquetes/librerías:** _lista corta + por qué (rendimiento, DX, compatibilidad)._  
- **Retención de logs y límites:** _p. ej., 60 días; rotación/tamaño máx. del fichero; procedimiento de purga._


## Apéndices

### A) Estructura del repositorio (sugerida)

``` bash
honeypot-ui-lab/
├─ apps/
│  ├─ honeypot/            # servicio (ssh|http) + collector
│  ├─ api/                 # API REST read-only
│  └─ dashboard/           # Next.js (App Router)
├─ packages/
│  ├─ db/                  # schema y cliente sqlite
│  └─ common/              # tipos compartidos
├─ docker/
│  └─ Dockerfile.*         # imágenes por servicio
├─ docker-compose.yml
├─ .env.example
├─ Makefile
└─ README.md
```

### B) docker-compose (esqueleto mínimo)

``` yaml

```

### C) CI (GitHub Actions — esqueleto)

``` yaml

```

