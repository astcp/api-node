// src/interfaces/http/middleware/auth.middleware.ts

import { NextFunction, Request, Response } from 'express';

import { UnauthorizedError } from '@domain/errors/app.errors';
import { config } from '../../../config'; // Usamos el alias para la configuración
import jwt from 'jsonwebtoken';

// Extender el Request de Express para añadir la información del usuario
declare global {
  namespace Express {
    interface Request {
      user?: { // Puedes definir un tipo más específico para tu usuario si lo necesitas
        id: string;
        username: string;
      };
    }
  }
}

export const authMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return next(new UnauthorizedError('No token provided or malformed token.'));
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, config.jwtSecret) as { id: string; username: string };
    req.user = decoded;
    next();
  } catch (err: any) {
    if (err.name === 'TokenExpiredError') {
      return next(new UnauthorizedError('Token expired. Please log in again.'));
    }
    if (err.name === 'JsonWebTokenError') {
      return next(new UnauthorizedError('Invalid token.'));
    }
    // Otros errores inesperados al verificar el token
    return next(new UnauthorizedError('Authentication failed.'));
  }
};