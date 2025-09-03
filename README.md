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
9. [Roadmap](#9-roadmap)  
10. [Licencia y créditos](#10-licencia-y-créditos)  
11. [Decisiones explícitas del alumno](#11-decisiones-explícitas-del-alumno)  
12. [Apéndices](#apéndices)


## 1) Descripción

### 1.1 Descripción general
Este proyecto implementa un **honeypot de baja interacción** capaz de simular un servicio expuesto (SSH o HTTP) para registrar intentos de intrusión. Los eventos se almacenan en **SQLite** y se consultan mediante una **API read-only**, que a su vez alimenta un **dashboard web** (Next.js) con métricas y gráficas.

### 1.2 Motivación
El objetivo es practicar y demostrar competencias en:
- **Ciberseguridad práctica (blue team):** captura y análisis básico de intentos de intrusión.
- **Ingeniería de software:** diseño modular, testing, CI/CD, despliegue contenedorizado.
- **Linux & redes:** servicios expuestos de forma controlada, puertos y sockets, firewall mínimo.
- **Buenas prácticas:** seguridad, ética y documentación clara.

### 1.3 Objetivos

**Objetivos del MVP (checklist):**
- [x] Captura de eventos reales/sintéticos.  
- [x] Persistencia en SQLite.  
- [x] API read-only con auth por token.  
- [x] Dashboard con gráficas y tabla.  
- [x] Contenedorización reproducible.  
- [x] Tests básicos + CI.  


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
docker compose up -d --build
docker compose logs -f honeypot
docker compose logs -f api
docker compose logs -f dashboard
docker compose down
```

**Con Make (opcional):**

``` bash
make dev
make demo
make test
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
Abrir `http://localhost:3001`:
- Gráficas: intentos por día, top IPs, top usernames/paths.
- Tabla: últimos eventos (con búsqueda y ordenación).


## 5) API

> **Auth:** enviar `Authorization: Bearer <HNY_ADMIN_TOKEN>`.

### 5.1 Endpoints

- `GET /api/stats/summary`

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

``` json
{
  "items": [],
  "page": { "limit": 50, "offset": 0, "total": 0 }
}
```

### 5.2 Ejemplos de uso

``` bash
curl -s -H "Authorization: Bearer $HNY_ADMIN_TOKEN" \
  "$BASE_API_URL/api/stats/summary"

curl -s -H "Authorization: Bearer $HNY_ADMIN_TOKEN" \
  "$BASE_API_URL/api/events?limit=50&offset=0&service=http"
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

**Tipos:**
- Unitarias (parser, normalizador, validadores).
- Integración (eventos sintéticos → API).
- E2E opcional en CI con Docker.

``` bash
npm run lint
npm test
```

Errores frecuentes corregidos durante el desarrollo:
- Variables de entorno mal definidas (`.env.local`).
- Problemas de compatibilidad con Next.js 15 y Jest.
- Configuración de CI/CD con GitHub Actions + Vercel.
- Manejo correcto de `searchParams` en App Router.


## 9) Roadmap

### MVP (cerrado)
✔ Captura de eventos, almacenamiento en SQLite, API con token, dashboard básico, contenedores, CI/CD y tests.

### Pro (pendiente)
- [ ] Multi-servicio (SSH + HTTP)
- [ ] GeoIP (país/ASN)
- [ ] Alertas (Discord/Slack)
- [ ] Endpoint `/metrics` (Prometheus)
- [ ] Mapa de ataques en dashboard
- [ ] Exportación CSV/NDJSON
- [ ] Rate-limit + WAF ligero
- [ ] TLS con reverse proxy
- [ ] Despliegue infra (Terraform + Ansible)
- [ ] Logs firmados / hash chain


## 10) Licencia y créditos

- **Licencia:** MIT (pendiente confirmación).  
- **Créditos:** librerías usadas (`ssh2`, `better-sqlite3`, `Next.js`, `Recharts`).


## 11) Decisiones explícitas del alumno

- **Servicio MVP:** SSH con `ssh2`. Se eligió por generar eventos más ricos (user/pass, cliente).  
- **Arquitectura:** servicios separados (honeypot, api, dashboard) dentro de un monorepo con `pnpm workspaces`.  
- **Despliegue:** Docker + Docker Compose. CI/CD en GitHub Actions (lint/test/build) y despliegue en Vercel para el dashboard.  
- **Paquetes:**  
  - Honeypot: `ssh2` (modo servidor).  
  - API: Express + `better-sqlite3`.  
  - Dashboard: Next.js 15 (App Router), Recharts.  
- **Logs:** SQLite con rotación documentada. Retención estimada: 60 días.  


## Apéndices

### A) Estructura del repositorio

``` bash
honeypot-ui-lab/
├─ apps/
│  ├─ honeypot/            
│  ├─ api/                 
│  └─ dashboard/           
├─ packages/
│  ├─ db/                  
│  └─ common/              
├─ docker/
│  └─ Dockerfile.*         
├─ docker-compose.yml
├─ .env.example
├─ Makefile
└─ README.md
```

### B) docker-compose (esqueleto)

``` yaml

```

### C) CI (GitHub Actions — esqueleto)

``` yaml

```
