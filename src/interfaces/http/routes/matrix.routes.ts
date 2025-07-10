// src/interfaces/http/routes/matrix.routes.ts

import { MatrixController } from '@interfaces/http/controllers/matrix.controller';
import { Router } from 'express';

/**
 * @class MatrixRoutes
 * @description Define las rutas HTTP para las operaciones de matrices en la API de Node.js.
 * Expone un endpoint para que los clientes procesen matrices.
 */
export class MatrixRoutes {
    public router: Router;
    private readonly matrixController: MatrixController;

    constructor(matrixController: MatrixController) {
        this.matrixController = matrixController;
        this.router = Router();
        this.initializeRoutes();
    }

    private initializeRoutes(): void {
        // Endpoint para que el cliente envíe una matriz a procesar
        this.router.post('/process-matrix', this.matrixController.processMatrix.bind(this.matrixController));
    }
}