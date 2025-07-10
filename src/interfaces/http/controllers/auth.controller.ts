// src/interfaces/http/controllers/auth.controller.ts

import { NextFunction, Request, Response } from 'express';

import { UnauthorizedError } from '@domain/errors/app.errors';
import { config } from '../../../config'; // Relative path is fine, or use @config alias if configured for this file
import jwt from 'jsonwebtoken'; // Already imported

export class AuthController {
    public login(req: Request, res: Response, next: NextFunction) {
        const { username, password } = req.body;

        // --- Simulación de verificación de credenciales ---
        if (username === 'testuser' && password === 'testpass') {
            // Usuario y contraseña válidos
            const payload = { id: 'user123', username: 'testuser' };

            const token = jwt.sign(
                payload,
                config.jwtSecret,
                {
                    // Explicitly cast expiresIn to its expected type
                    expiresIn: config.jwtExpiresIn as jwt.SignOptions['expiresIn']
                }
            );

            return res.status(200).json({ token });
        } else {
            // Credenciales inválidas
            return next(new UnauthorizedError('Invalid username or password.'));
        }
    }
}