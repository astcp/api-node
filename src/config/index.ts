// src/config/index.ts

import { AppError } from '../domain/errors/app.errors'; // <--- ¡Importación corregida!
import dotenv from 'dotenv';

// CAMBIO AQUÍ: Usar ruta relativa para AppError


dotenv.config();

interface AppConfig {
    nodeApiPort: number;
    goApiBaseUrl: string;
    goApiAppAccessToken: string;
    jwtSecret: string; 
    jwtExpiresIn: string; 
}

const config: AppConfig = {
    nodeApiPort: parseInt(process.env.NODE_API_PORT || '3000', 10),
    goApiBaseUrl: process.env.GO_API_BASE_URL || 'http://localhost:8080/api',
    goApiAppAccessToken: process.env.GO_API_APP_ACCESS_TOKEN || '',
    jwtSecret: process.env.JWT_SECRET || 'supersecretjwtkeyforexample', 
    jwtExpiresIn: process.env.JWT_EXPIRES_IN || '1h', // Duración del token
};

// Validar que las variables críticas estén presentes
if (!config.goApiAppAccessToken) {
    // Usar AppError aquí está bien porque ya se importó relativamente
    console.error(new AppError('La variable de entorno GO_API_APP_ACCESS_TOKEN no está definida.', 500, 'ENV_CONFIG_ERROR').message);
    process.exit(1); // Terminar la aplicación si una variable crítica falta
}

export { config };