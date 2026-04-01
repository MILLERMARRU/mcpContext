# 📋 Product Requirements Document — contextflow-mcp

> **Versión:** 1.0.0  
> **Fecha:** 2026-03-31  
> **Estado:** 🟢 En producción (MVP)  
> **Autor:** Miller Zamora  
> **Repositorio:** `D:\FREENLANCER\luis\contextflow_mcp`

---

## 📑 Tabla de Contenidos

1. [Resumen Ejecutivo](#1-resumen-ejecutivo)
2. [Contexto y Problema](#2-contexto-y-problema)
3. [Objetivos del Producto](#3-objetivos-del-producto)
4. [Usuarios y Casos de Uso](#4-usuarios-y-casos-de-uso)
5. [Arquitectura del Sistema](#5-arquitectura-del-sistema)
6. [Herramientas MCP (Funcionalidades Core)](#6-herramientas-mcp-funcionalidades-core)
7. [Requisitos de Entorno](#7-requisitos-de-entorno)
8. [Configuración e Integración](#8-configuración-e-integración)
9. [Requisitos No Funcionales](#9-requisitos-no-funcionales)
10. [Stack Tecnológico](#10-stack-tecnológico)
11. [Flujo de Datos End-to-End](#11-flujo-de-datos-end-to-end)
12. [API Reference (Endpoints Internos)](#12-api-reference-endpoints-internos)
13. [Roadmap y Mejoras Futuras](#13-roadmap-y-mejoras-futuras)
14. [Criterios de Aceptación](#14-criterios-de-aceptación)

---

## 1. 🧭 Resumen Ejecutivo

**contextflow-mcp** es un servidor MCP _(Model Context Protocol)_ que actúa como puente entre **Claude AI** y la plataforma **Contextflow** — un motor de búsqueda semántica e IA sobre repositorios de código vectorizados.

El servidor expone **3 herramientas** que Claude puede invocar de forma nativa para:

| # | Herramienta | Descripción corta |
|---|-------------|-------------------|
| 1 | `get_context_info` | 📊 Obtener metadatos del snapshot indexado |
| 2 | `search_context` | 🔍 Búsqueda semántica en el código vectorizado |
| 3 | `ask_context` | 🤖 Q&A con IA sobre la base de código |

> **Propósito central:** Permitir que Claude responda preguntas complejas sobre cualquier repositorio sin necesidad de subir archivos manualmente, aprovechando índices vectoriales preexistentes en Contextflow.

---

## 2. 🧩 Contexto y Problema

### El problema que resuelve

Los desarrolladores y equipos que usan Claude para análisis de código se enfrentan a fricciones constantes:

```
❌ Copiar/pegar código manualmente en cada conversación
❌ Perder contexto entre sesiones
❌ No poder buscar semánticamente en repos grandes
❌ Claude no conoce el estado real del codebase
❌ Sin trazabilidad (sin referencias a archivo/línea exacta)
```

### La solución

```
✅ Claude accede directamente al índice vectorial del repositorio
✅ Búsqueda semántica (no textual) → entiende la intención
✅ Respuestas ancladas a código real con archivo + línea exacta
✅ Metadatos del snapshot accesibles en tiempo real
✅ Sin configuración por sesión — solo token + URL
```

### Contexto técnico

Contextflow preindexó un repositorio completo, dividiéndolo en *chunks* y generando embeddings vectoriales. El MCP server es el adaptador que conecta Claude con esos vectores a través de HTTP REST.

---

## 3. 🎯 Objetivos del Producto

### Objetivos primarios

| Objetivo | Métrica de éxito |
|----------|-----------------|
| 🔗 Integración fluida Claude ↔ Contextflow | Claude invoca las 3 herramientas sin errores |
| ⚡ Respuestas en tiempo real | Latencia total < 5s para búsquedas típicas |
| 🎯 Resultados relevantes | Threshold de similitud ≥ 0.45 por defecto |
| 🔒 Autenticación segura | Token nunca expuesto en logs ni git history |
| 📦 Distribución sencilla | Binary `dist/index.js` ejecutable sin build manual |

### Objetivos secundarios

- Extensibilidad para añadir nuevas herramientas MCP
- Configuración mínima (solo 2 env vars)
- Código limpio y tipado estrictamente con TypeScript

---

## 4. 👥 Usuarios y Casos de Uso

### Usuarios objetivos

| Perfil | Descripción | Dolor principal |
|--------|-------------|----------------|
| 👨‍💻 **Developer individual** | Usa Claude+Contextflow para explorar repos ajenos | Entender codebases desconocidas rápidamente |
| 🏢 **Equipo de desarrollo** | Comparte snapshot de su repo con el equipo | Onboarding técnico, revisiones de código |
| 🔬 **Reviewer/Auditor** | Analiza código de terceros | Encontrar patrones, vulnerabilidades, lógica |
| 🤖 **AI Power User** | Construye flujos Claude + MCP | Automatizar análisis de código |

### Casos de uso principales

#### UC-01: Explorar un repositorio desconocido
```
Como developer que acaba de unirse a un proyecto
Quiero preguntar "¿cómo funciona la autenticación?"
Para entender el flujo sin leer todo el código
```

#### UC-02: Buscar implementaciones específicas
```
Como developer
Quiero buscar "manejo de errores en llamadas API"
Para encontrar todos los patrones usados en el repo
```

#### UC-03: Verificar estado del índice
```
Como administrador del snapshot
Quiero ver cuántos archivos y chunks están indexados
Para confirmar que el índice está actualizado
```

#### UC-04: Code Review asistido por IA
```
Como reviewer
Quiero preguntar "¿hay alguna lógica de retry en las peticiones HTTP?"
Para hacer un review más exhaustivo
```

---

## 5. 🏗️ Arquitectura del Sistema

### Vista general

```
┌─────────────────────────────────────────────────────────────────┐
│  👤 USUARIO                                                      │
│  "¿Cómo funciona el auth en este repo?"                        │
└─────────────────────────────┬───────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│  🤖 CLAUDE AI                                                    │
│  Decide invocar herramienta MCP: ask_context                   │
└─────────────────────────────┬───────────────────────────────────┘
                              │  stdio (MCP Protocol)
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│  📡 contextflow-mcp (Node.js Process)                           │
│  ┌─────────────────────────────────────────────────────────┐  │
│  │  McpServer (SDK @modelcontextprotocol/sdk)              │  │
│  │  ├── Tool: get_context_info                            │  │
│  │  ├── Tool: search_context                              │  │
│  │  └── Tool: ask_context                                 │  │
│  └─────────────────────────────────────────────────────────┘  │
│  CONTEXTFLOW_TOKEN + CONTEXTFLOW_API_URL (env vars)            │
└─────────────────────────────┬───────────────────────────────────┘
                              │  HTTP REST (axios, 30s timeout)
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│  🗄️ CONTEXTFLOW API SERVER (http://localhost:3001)              │
│  ┌──────────────────┐  ┌────────────────┐  ┌───────────────┐  │
│  │ GET /context/:t  │  │ POST .../query │  │ POST .../chat │  │
│  │ Snapshot info    │  │ Semantic search│  │ AI Q&A        │  │
│  └──────────────────┘  └────────────────┘  └───────────────┘  │
│                                                                  │
│  Vector DB (embeddings) ← Repositorio indexado                  │
└─────────────────────────────────────────────────────────────────┘
```

### Estructura de archivos

```
contextflow_mcp/
├── 📁 src/
│   └── index.ts          ← Fuente principal (164 líneas)
├── 📁 dist/
│   └── index.js          ← Binario compilado (distribuible, commiteado)
├── package.json          ← Deps: @modelcontextprotocol/sdk, axios
├── tsconfig.json         ← Target ES2022, Node16 ESM
├── claude-config-example.json  ← Ejemplo config MCP para Claude
├── .gitignore            ← Excluye .env, node_modules
├── README.md             ← Guía de instalación
└── PRD.md                ← Este documento
```

---

## 6. 🔧 Herramientas MCP (Funcionalidades Core)

### 🛠️ Tool 1: `get_context_info`

| Atributo | Valor |
|----------|-------|
| **Nombre** | `get_context_info` |
| **Endpoint** | `GET /context/{TOKEN}` |
| **Parámetros** | Ninguno |
| **Timeout** | 30 segundos |

**Descripción:**  
Obtiene metadatos del snapshot actual de Contextflow. Útil para que Claude sepa con qué repositorio está trabajando antes de hacer búsquedas.

**Datos retornados:**

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `name` | string | Nombre del snapshot/repositorio |
| `branch` | string | Rama de Git indexada |
| `status` | string | Estado del procesamiento |
| `filesCount` | number | Total de archivos indexados |
| `chunksCount` | number | Total de chunks vectorizados |
| `description` | string? | Descripción opcional |
| `createdAt` | string | Fecha de creación del snapshot |

**Ejemplo de respuesta:**
```
Snapshot: my-project
Branch: main
Status: ready
Files indexed: 142
Vectorized chunks: 1,847
Created: 2026-03-15T10:32:00Z
```

---

### 🛠️ Tool 2: `search_context`

| Atributo | Valor |
|----------|-------|
| **Nombre** | `search_context` |
| **Endpoint** | `POST /context/{TOKEN}/query` |
| **Timeout** | 30 segundos |

**Descripción:**  
Realiza búsqueda semántica vectorial sobre el código indexado. Retorna fragmentos de código relevantes con su ubicación exacta.

**Parámetros de entrada:**

| Parámetro | Tipo | Requerido | Default | Rango | Descripción |
|-----------|------|-----------|---------|-------|-------------|
| `query` | string | ✅ Sí | — | — | Consulta en lenguaje natural |
| `top_k` | number | ❌ No | `6` | 1–20 | Número de resultados a retornar |
| `threshold` | number | ❌ No | `0.45` | 0–1 | Score mínimo de similitud |

**Estructura de respuesta por chunk:**

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `filePath` | string | Ruta relativa del archivo |
| `startLine` | number | Línea de inicio del fragmento |
| `endLine` | number | Línea de fin del fragmento |
| `similarity` | number | Score de similitud (0–1) |
| `language` | string | Lenguaje de programación |
| `content` | string | Código fuente del fragmento |

**Ejemplo de respuesta formateada:**
```
Found 3 relevant fragments (87ms):

### [1] src/auth/middleware.ts (L12–45) · 92% match · typescript
```typescript
export async function authMiddleware(req, res, next) {
  const token = req.cookies.session;
  // ...
}
```

### [2] src/auth/jwt.ts (L5–28) · 78% match · typescript
...
```

---

### 🛠️ Tool 3: `ask_context`

| Atributo | Valor |
|----------|-------|
| **Nombre** | `ask_context` |
| **Endpoint** | `POST /context/{TOKEN}/chat` |
| **Timeout** | 30 segundos |

**Descripción:**  
Genera una respuesta con IA anclada en el código real del repositorio. Combina búsqueda semántica + generación de lenguaje natural para responder preguntas complejas sobre el codebase.

**Parámetros de entrada:**

| Parámetro | Tipo | Requerido | Default | Rango | Descripción |
|-----------|------|-----------|---------|-------|-------------|
| `question` | string | ✅ Sí | — | — | Pregunta en lenguaje natural |
| `top_k` | number | ❌ No | `8` | 3–12 | Chunks de código usados como contexto |

**Estructura de respuesta:**

```
[Respuesta generada por IA con explicación detallada]

**Sources used:**
  1. `src/auth/middleware.ts` L12–45 (92% match)
  2. `src/config/jwt.ts` L5–20 (76% match)
  3. `src/routes/login.ts` L88–112 (71% match)

_Generated in 234ms_
```

---

## 7. 🔐 Requisitos de Entorno

### Variables de entorno

| Variable | Requerida | Default | Descripción |
|----------|-----------|---------|-------------|
| `CONTEXTFLOW_TOKEN` | ✅ **Obligatoria** | — | Token público del snapshot de Contextflow. El servidor termina con `exit(1)` si no está definida. |
| `CONTEXTFLOW_API_URL` | ❌ Opcional | `http://localhost:3001` | URL base del servidor API de Contextflow. Puede apuntar a instancia local o remota. |

### Ejemplo de archivo `.env`
```env
CONTEXTFLOW_TOKEN=tu_token_publico_aqui
CONTEXTFLOW_API_URL=http://localhost:3001
```

> ⚠️ **Importante:** El archivo `.env` está en `.gitignore`. Nunca commitear credenciales.

### Requisitos de runtime

| Requisito | Versión mínima |
|-----------|----------------|
| Node.js | ≥ 18.0.0 |
| npm | ≥ 9.0.0 |
| Contextflow API | Corriendo en `CONTEXTFLOW_API_URL` |

---

## 8. ⚙️ Configuración e Integración

### Instalación

```bash
# 1. Clonar repositorio
git clone <repo-url>
cd contextflow_mcp

# 2. Instalar dependencias
npm install

# 3. Configurar variables de entorno
cp .env.example .env
# Editar .env con tu token

# 4. Compilar TypeScript
npm run build

# 5. Ejecutar
npm start
```

### Integración con Claude Desktop

Editar `claude_desktop_config.json` (o añadir al config de Claude Code):

```json
{
  "mcpServers": {
    "contextflow": {
      "command": "node",
      "args": ["/ruta/absoluta/contextflow_mcp/dist/index.js"],
      "env": {
        "CONTEXTFLOW_TOKEN": "tu_token_aqui",
        "CONTEXTFLOW_API_URL": "http://localhost:3001"
      }
    }
  }
}
```

### Integración con Claude Code CLI

```bash
# Agregar servidor MCP al proyecto
claude mcp add contextflow node /ruta/dist/index.js \
  -e CONTEXTFLOW_TOKEN=tu_token \
  -e CONTEXTFLOW_API_URL=http://localhost:3001
```

### Scripts disponibles

| Script | Comando | Descripción |
|--------|---------|-------------|
| Build | `npm run build` | Compila TypeScript → `dist/index.js` |
| Dev | `npm run dev` | Modo watch para desarrollo |
| Start | `npm start` | Ejecuta el servidor compilado |

---

## 9. 📊 Requisitos No Funcionales

### Rendimiento

| Métrica | Objetivo | Crítico |
|---------|----------|---------|
| Latencia `get_context_info` | < 500ms | < 2s |
| Latencia `search_context` | < 2s | < 5s |
| Latencia `ask_context` | < 5s | < 10s |
| Timeout HTTP | — | 30s (hardcoded) |
| Memoria RAM | < 50MB | < 100MB |

### Seguridad

| Requisito | Implementación actual |
|-----------|----------------------|
| 🔑 Token no en git | `.gitignore` protege `.env` |
| 🔒 Token en URL | Pasado en path, nunca en headers visibles |
| 🚫 Validación de env | Exit inmediato si TOKEN falta |
| 📝 Sin logging de credenciales | Solo error messages en stderr |

### Confiabilidad

| Requisito | Estado |
|-----------|--------|
| Manejo de errores HTTP | ✅ axios lanza excepciones capturables |
| Validación de parámetros | ✅ Zod schemas en herramientas |
| Timeout en peticiones | ✅ 30 segundos configurado |
| Startup validation | ✅ Token verificado antes de iniciar |

### Mantenibilidad

| Aspecto | Decisión |
|---------|----------|
| Lenguaje | TypeScript con strict mode |
| Módulos | ES Modules (Node16) |
| Tamaño del proyecto | Minimal — 164 líneas de lógica |
| Dependencias | Solo 2 runtime deps (MCP SDK + axios) |

---

## 10. 🛠️ Stack Tecnológico

### Runtime

| Tecnología | Versión | Rol |
|------------|---------|-----|
| **Node.js** | ≥ 18 | Runtime del servidor |
| **TypeScript** | ^5.4.0 | Lenguaje fuente |
| **ES2022** | — | Target de compilación |

### Dependencias de producción

| Paquete | Versión | Propósito |
|---------|---------|-----------|
| `@modelcontextprotocol/sdk` | ^1.10.2 | SDK oficial MCP para Node.js |
| `axios` | ^1.7.0 | Cliente HTTP para llamadas a Contextflow API |

### Dependencias de desarrollo

| Paquete | Versión | Propósito |
|---------|---------|-----------|
| `typescript` | ^5.4.0 | Compilador TypeScript |
| `@types/node` | ^20.0.0 | Tipos de Node.js para TypeScript |

### Protocolo de comunicación

| Capa | Protocolo | Descripción |
|------|-----------|-------------|
| Claude ↔ MCP Server | **stdio (MCP)** | Comunicación via stdin/stdout |
| MCP Server ↔ Contextflow | **HTTP REST** | JSON sobre HTTP/HTTPS |

---

## 11. 🔄 Flujo de Datos End-to-End

### Flujo: `ask_context`

```
1. Usuario escribe en Claude:
   "¿Cómo funciona el sistema de autenticación?"
        │
        ▼
2. Claude decide invocar: ask_context({ question: "...", top_k: 8 })
        │  (stdio / MCP Protocol)
        ▼
3. contextflow-mcp recibe el tool call
   - Valida parámetros con Zod
   - Construye payload: { question, topK: 8 }
        │  (HTTP POST)
        ▼
4. Contextflow API: POST /context/{TOKEN}/chat
   - Vectoriza la pregunta (embedding)
   - Busca top 8 chunks más similares
   - Genera respuesta con LLM usando chunks como contexto
   - Retorna { answer, chunks[], processingTime }
        │  (JSON response)
        ▼
5. contextflow-mcp formatea la respuesta:
   - Agrega respuesta IA
   - Lista fuentes con ruta, líneas, % similitud
   - Agrega tiempo de generación
        │  (MCP response)
        ▼
6. Claude recibe la respuesta formateada
   - La incluye en su respuesta al usuario
        │
        ▼
7. Usuario ve: explicación clara + fuentes exactas
```

### Manejo de errores

```
Error HTTP de Contextflow API
        │
        ▼
axios lanza excepción
        │
        ▼
MCP server retorna error a Claude
        │
        ▼
Claude informa al usuario del problema
```

---

## 12. 📡 API Reference (Endpoints Internos)

Estos son los endpoints del **Contextflow API Server** que el MCP server consume:

### `GET /context/:token`

```http
GET http://localhost:3001/context/abc123xyz
```

**Respuesta esperada:**
```json
{
  "name": "my-project",
  "branch": "main",
  "status": "ready",
  "filesCount": 142,
  "chunksCount": 1847,
  "description": "Proyecto principal de backend",
  "createdAt": "2026-03-15T10:32:00Z"
}
```

---

### `POST /context/:token/query`

```http
POST http://localhost:3001/context/abc123xyz/query
Content-Type: application/json

{
  "query": "manejo de errores en peticiones HTTP",
  "topK": 6,
  "threshold": 0.45
}
```

**Respuesta esperada:**
```json
{
  "results": [
    {
      "id": "chunk-001",
      "filePath": "src/api/client.ts",
      "language": "typescript",
      "startLine": 45,
      "endLine": 78,
      "content": "export async function fetchWithRetry(...",
      "similarity": 0.91
    }
  ],
  "processingTime": 145
}
```

---

### `POST /context/:token/chat`

```http
POST http://localhost:3001/context/abc123xyz/chat
Content-Type: application/json

{
  "question": "¿Cómo está implementado el retry de peticiones?",
  "topK": 8
}
```

**Respuesta esperada:**
```json
{
  "answer": "El sistema implementa un mecanismo de retry exponencial...",
  "chunks": [
    {
      "filePath": "src/api/client.ts",
      "startLine": 45,
      "endLine": 78,
      "similarity": 0.91
    }
  ],
  "processingTime": 287
}
```

---

## 13. 🚀 Roadmap y Mejoras Futuras

### v1.1.0 — Mejoras de UX

| Feature | Prioridad | Descripción |
|---------|-----------|-------------|
| 🔁 Retry automático | Alta | Reintentar peticiones fallidas con backoff exponencial |
| 📝 Logging estructurado | Media | Logs JSON para debugging en producción |
| ⚙️ Config file support | Baja | Leer config desde archivo `.contextflowrc` |

### v1.2.0 — Nuevas herramientas MCP

| Herramienta | Descripción |
|-------------|-------------|
| `list_files` | Listar todos los archivos indexados en el snapshot |
| `get_file_content` | Obtener el contenido de un archivo específico |
| `find_references` | Encontrar todos los usos de una función/clase |
| `get_chunk_by_id` | Obtener chunk específico por ID |

### v2.0.0 — Multi-snapshot

| Feature | Descripción |
|---------|-------------|
| 🗂️ Múltiples tokens | Soportar N snapshots simultáneos |
| 🔀 Routing inteligente | Claude elige el snapshot correcto automáticamente |
| 🏷️ Snapshot aliasing | Nombrar snapshots con aliases descriptivos |

### v2.1.0 — Publicación npm

| Feature | Descripción |
|---------|-------------|
| 📦 Publish a npm | Disponible como `npx contextflow-mcp` |
| 🐳 Docker image | Imagen oficial para deploy containerizado |
| 🔧 CLI flags | Configuración via argumentos de línea de comandos |

---

## 14. ✅ Criterios de Aceptación

### MVP (v1.0.0) — Estado actual ✅

| Criterio | Estado |
|----------|--------|
| El servidor arranca sin errores si TOKEN está definido | ✅ |
| El servidor termina con error claro si TOKEN falta | ✅ |
| `get_context_info` retorna metadatos del snapshot | ✅ |
| `search_context` retorna chunks con archivo y línea | ✅ |
| `ask_context` retorna respuesta IA con fuentes citadas | ✅ |
| Parámetros opcionales tienen defaults sensatos | ✅ |
| `dist/index.js` está commiteado y es ejecutable | ✅ |
| README documenta setup completo | ✅ |
| `.env` está en `.gitignore` | ✅ |

### Calidad de código

| Criterio | Estado |
|----------|--------|
| TypeScript strict mode sin errores | ✅ |
| Zod schemas para validación de inputs | ✅ |
| Sin dependencias innecesarias | ✅ |
| Código < 200 líneas para el core | ✅ |
| ESM modules (moderno) | ✅ |

---

## 📎 Apéndice

### Glosario

| Término | Definición |
|---------|------------|
| **MCP** | Model Context Protocol — estándar de Anthropic para extender capacidades de Claude |
| **Snapshot** | Índice vectorial de un repositorio en un momento dado |
| **Chunk** | Fragmento de código del repositorio, vectorizado para búsqueda semántica |
| **Embedding** | Representación vectorial de texto para comparación semántica |
| **Threshold** | Umbral mínimo de similitud (0–1) para filtrar resultados irrelevantes |
| **top_k** | Número máximo de resultados más relevantes a retornar |
| **stdio** | Comunicación via stdin/stdout — mecanismo del protocolo MCP |

### Referencias

| Recurso | Descripción |
|---------|-------------|
| [MCP Protocol Spec](https://modelcontextprotocol.io) | Especificación oficial del protocolo |
| [@modelcontextprotocol/sdk](https://www.npmjs.com/package/@modelcontextprotocol/sdk) | SDK oficial Node.js |
| [Contextflow API Docs](#) | Documentación del servidor Contextflow |

---

_Documento generado el 2026-03-31 · contextflow-mcp v1.0.0_
