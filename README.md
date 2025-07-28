# API de Procesamiento de Matrices (Node.js)

Esta es una API RESTful desarrollada con Node.js y Express, diseñada para recibir matrices numéricas, validarlas, enviarlas a una API de Go para su procesamiento, y luego calcular estadísticas adicionales antes de devolver el resultado. La API incluye un sistema de autenticación JWT para proteger sus endpoints.

---

## 🚀 Características

- **API RESTful:** Endpoints bien definidos para la interacción.
- **Validación de Entrada:** Verificación robusta de las matrices de entrada.
- **Comunicación entre Microservicios:** Se integra con una API externa (desarrollada en Go) para el procesamiento central de matrices.
- **Autenticación JWT:** Protección de los endpoints mediante JSON Web Tokens.
- **Manejo Centralizado de Errores:** Errores de la aplicación y de la API externa son gestionados de forma consistente.
- **Estructura de Proyecto Limpia:** Basada en principios de arquitectura limpia para facilitar la escalabilidad y el mantenimiento.
- **TypeScript:** Código tipado para una mayor robustez y menos errores en tiempo de ejecución.

---

## 📦 Tecnologías Utilizadas

- **Node.js**
- **Express.js:** Framework web para Node.js.
- **TypeScript:** Lenguaje de programación.
- **Axios:** Cliente HTTP para realizar solicitudes a la API de Go.
- **jsonwebtoken:** Para la implementación de JWT.
- **dotenv:** Para la gestión de variables de entorno.
- **Jest:** Framework de pruebas unitarias.
- **ts-node-dev:** Para desarrollo con recarga en caliente.

---

## 📋 Requisitos Previos

Antes de empezar, asegúrate de tener instalado lo siguiente:

- **Node.js** (v18 o superior recomendado)
- **npm** (viene con Node.js)
- **API de Go:** Esta API depende de una API de Go externa que realiza el procesamiento de las matrices. Asegúrate de tenerla en funcionamiento y accesible.

---

## 🛠️ Instalación y Configuración

### 1. Instala las Dependencias

```bash
npm install
```

### 2. Configura las Variables de Entorno

Crea un archivo `.env` en la raíz del proyecto con las siguientes variables:

```dotenv
# Puerto donde se ejecutará la API de Node.js
NODE_API_PORT=3000

# URL base de la API de Go para el procesamiento de matrices
GO_API_BASE_URL=http://localhost:8080/api

# Token de acceso interno que la API de Node.js usará para autenticarse con la API de Go (si Go lo requiere)
GO_API_APP_ACCESS_TOKEN=xxxxxxxx

# Clave secreta para firmar y verificar los JSON Web Tokens (JWT)
JWT_SECRET=xxxxxxxx

# Tiempo de expiración de los JWT (ej. '1h', '30m', '7d')
JWT_EXPIRES_IN=1h
```

---

## ▶️ Ejecución de la Aplicación

### 🔄 Modo Desarrollo

```bash
npm run dev
```

La API se iniciará en [http://localhost:3000](http://localhost:3000) (o el puerto configurado en `NODE_API_PORT`).

---

### 🚀 Modo Producción

Primero, compila el código TypeScript a JavaScript:

```bash
npm run build
```

Luego, ejecuta la aplicación compilada:

```bash
npm start
```

---

## 🧪 Ejecución de Pruebas

Para ejecutar las pruebas unitarias y de integración (usando Jest):

```bash
npm test
```
---

## 🗺️ Endpoints de la API
Todos los endpoints están prefijados con `/api`.
---

### 1. Autenticación de Usuario (Login)
Este endpoint permite a un usuario obtener un token JWT.

- **URL:** `/api/auth/login`  
- **Método:** `POST`  
- **Headers:**

```http
Content-Type: application/json
```

#### 📝 Cuerpo (JSON)
```json
{
  "username": "testuser",
  "password": "testpass"
}
```

⚠️ Las credenciales `testuser/testpass` son de ejemplo y están "hardcodeadas" para demostración. En una aplicación real, se verificarían contra una base de datos.

#### ✅ Respuesta Exitosa

```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

---

### 2. Procesar Matriz y Obtener Estadísticas

Este endpoint procesa una matriz numérica, interactúa con la API de Go, y devuelve estadísticas calculadas. **Requiere autenticación JWT.**

- **URL:** `/api/matrix/process-matrix`  
- **Método:** `POST`  
- **Headers:**

```http
Content-Type: application/json
Authorization: Bearer <TU_TOKEN_JWT>
```

#### 📝 Cuerpo (JSON)

```json
{
  "matrix": [
    [1, 2, 3],
    [4, 5, 6],
    [7, 8, 9]
  ]
}
```

#### ✅ Respuesta Exitosa (Ejemplo)

```json
{
  "matrix": [
    [1, 2, 3],
    [4, 5, 6],
    [7, 8, 9]
  ],
  "flat_matrix": [1, 2, 3, 4, 5, 6, 7, 8, 9],
  "inverted_matrix": [
    [1, 4, 7],
    [2, 5, 8],
    [3, 6, 9]
  ],
  "min": 1,
  "max": 9,
  "sum": 45,
  "avg": 5
}
```
### 📄 Licencia

Este proyecto está bajo la Licencia MIT.
