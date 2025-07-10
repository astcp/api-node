// src/interfaces/http/routes/auth.routes.ts

import { AuthController } from '@interfaces/http/controllers/auth.controller'; // Usamos el alias
import { Router } from 'express';

export class AuthRoutes {
    public router: Router;
    private readonly authController: AuthController;

    constructor(authController: AuthController) {
        this.authController = authController;
        this.router = Router();
        this.initializeRoutes();
    }

    private initializeRoutes(): void {
        this.router.post('/login', this.authController.login.bind(this.authController));
    }
}