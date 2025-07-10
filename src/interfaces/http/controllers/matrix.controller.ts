// src/interfaces/http/controllers/matrix.controller.ts

import { AppError, InvalidMatrixError } from '@domain/errors/app.errors';
import { NextFunction, Request, Response } from 'express';

import { MatrixProcessingRequest } from '@domain/entities/matrix';
import { ProcessMatrixAndGetStatsUseCase } from '@application/use-cases/matrix/process-matrix-and-get-stats.usecase';

/**
 * @class MatrixController
 * @description Maneja las solicitudes HTTP relacionadas con operaciones de matrices.
 * Recibe una matriz del cliente, delega su procesamiento a un caso de uso,
 * y devuelve el resultado completo, incluyendo las estadísticas.
 */
export class MatrixController {
    private readonly processMatrixAndGetStatsUseCase: ProcessMatrixAndGetStatsUseCase;

    constructor(
        processMatrixAndGetStatsUseCase: ProcessMatrixAndGetStatsUseCase
    ) {
        this.processMatrixAndGetStatsUseCase = processMatrixAndGetStatsUseCase;
    }

    /**
     * @method processMatrix
     * @description Endpoint principal para procesar una matriz.
     * 1. Recibe la matriz del cuerpo de la solicitud.
     * 2. Delega la lógica de negocio al caso de uso.
     * 3. Envía la respuesta con la matriz procesada y estadísticas.
     * @param req Objeto de solicitud de Express (espera 'matrix' en el body).
     * @param res Objeto de respuesta de Express.
     * @param next Función para pasar el control al siguiente middleware de error.
     */
    public async processMatrix(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const { matrix } = req.body as MatrixProcessingRequest;

            // Validaciones básicas de entrada directamente en el controlador antes de pasar al caso de uso
            if (!matrix) {
                throw new InvalidMatrixError('Matrix is required in the request body.');
            }
            if (!Array.isArray(matrix)) {
                throw new InvalidMatrixError('Matrix must be an array.');
            }
            if (matrix.length === 0 || !Array.isArray(matrix[0])) {
                throw new InvalidMatrixError('Matrix is empty or malformed.');
            }

            // Delegar el procesamiento y cálculo de estadísticas al caso de uso
            const result = await this.processMatrixAndGetStatsUseCase.execute({ matrix });

            res.status(200).json({
                message: 'Matrix processed and statistics generated successfully.',
                data: result, // result ya contiene originalMatrix, rotatedMatrix, qrFactorization y statistics
            });

        } catch (error: any) {
            console.error('Error in MatrixController.processMatrix:', error);
            // Pasa el error al middleware de manejo de errores centralizado
            if (error instanceof AppError) {
                next(error);
            } else {
                // Envuelve errores inesperados en un AppError genérico
                next(new AppError('An unexpected error occurred during matrix processing.', 500, 'INTERNAL_SERVER_ERROR', error.message));
            }
        }
    }
}