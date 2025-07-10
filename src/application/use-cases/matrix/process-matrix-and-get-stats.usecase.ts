// src/application/use-cases/matrix/process-matrix-and-get-stats.usecase.ts

import { GoApiError, InvalidMatrixError } from '@domain/errors/app.errors';
import { GoApiResponseData, Matrix, MatrixProcessingRequest, MatrixStatistics, ProcessedMatrixResult } from '@domain/entities/matrix';

import { GoApiGateway } from '@application/ports/go-api.gateway';

/**
 * @class ProcessMatrixAndGetStatsUseCase
 * @description Caso de uso para procesar una matriz:
 * 1. Valida la matriz de entrada.
 * 2. Envía la matriz a la API de Go para rotación y factorización QR.
 * 3. Recibe los resultados de Go.
 * 4. Calcula estadísticas adicionales sobre las matrices (original y rotada).
 * 5. Retorna un resultado completo que incluye todo lo anterior.
 */
export class ProcessMatrixAndGetStatsUseCase {
    private readonly goApiGateway: GoApiGateway;

    /**
     * @constructor
     * @param goApiGateway La implementación del gateway para la API de Go.
     */
    constructor(goApiGateway: GoApiGateway) {
        this.goApiGateway = goApiGateway;
    }

    /**
     * @method execute
     * @description Ejecuta el caso de uso para procesar una matriz.
     * @param request Un objeto que contiene la matriz a procesar.
     * @returns Una promesa que resuelve con los resultados de la matriz procesada y sus estadísticas.
     * @throws {InvalidMatrixError} Si la matriz de entrada es inválida (vacía, mal formada, no rectangular o contiene no numéricos).
     * @throws {GoApiError} Si ocurre un error al comunicarse con la API de Go.
     */
    async execute(request: MatrixProcessingRequest): Promise<ProcessedMatrixResult> {
        const { matrix } = request;

        // 1. Validación inicial de la matriz de entrada.
        if (!matrix || matrix.length === 0 || !Array.isArray(matrix[0])) {
            throw new InvalidMatrixError('Input matrix is empty or malformed.');
        }

        const numRows = matrix.length;
        const numCols = matrix[0].length;

        // 2. Validación de que la matriz sea rectangular y contenga solo números.
        for (const row of matrix) {
            if (row.length !== numCols) {
                throw new InvalidMatrixError('Matrix must be rectangular (all rows must have the same number of columns).');
            }
            // Verificar que todos los elementos de la fila sean números
            if (!row.every(item => typeof item === 'number')) {
                throw new InvalidMatrixError('Matrix must contain only arrays of numbers.');
            }
        }

        // 3. Llama a la API de Go para procesar la matriz (rotación y factorización QR).
        let goResult: GoApiResponseData;
        try {
            goResult = await this.goApiGateway.processMatrix(matrix);
        } catch (error: any) {
            console.error('Error al llamar a la API de Go:', error.message, error.response?.data);

            if (error.response?.status) {
                // Si la API de Go devuelve un error 400 por dimensiones inválidas, lo mapeamos a InvalidMatrixError.
                if (error.response.status === 400 && error.response.data?.error === 'dimensiones_de_matriz_invalidas') {
                    throw new InvalidMatrixError(error.response.data.details || 'Las dimensiones de la matriz son inválidas según la API de Go.');
                }
                // Para otros errores específicos de la API de Go (ej. 401 Unauthorized, 500 Internal Server Error).
                throw new GoApiError(
                    error.response.data?.details || `Error de la API de Go con estado ${error.response.status}.`,
                    error.response.data?.error || 'GO_API_ERROR',
                    error.response.status
                );
            }
            // Si no hay respuesta HTTP (ej. error de red, API de Go caída).
            throw new GoApiError(`Fallo al conectar o error desconocido de la API de Go: ${error.message}`, 'NETWORK_ERROR');
        }

        // 4. Calcula las estadísticas adicionales sobre las matrices.
        const statistics: MatrixStatistics = this.calculateMatrixStatistics(goResult.original_matrix, goResult.rotated_matrix);

        // 5. Retorna el resultado combinado de la API de Go y las estadísticas calculadas localmente.
        return {
            originalMatrix: goResult.original_matrix,
            rotatedMatrix: goResult.rotated_matrix,
            qrFactorization: goResult.qr_factorization,
            statistics: statistics,
        };
    }

    /**
     * @private
     * @method calculateMatrixStatistics
     * @description Calcula las estadísticas específicas (max, min, promedio, suma total, es diagonal)
     * para las matrices dadas (original y rotada).
     * @param originalMatrix La matriz original.
     * @param rotatedMatrix La matriz rotada.
     * @returns Un objeto MatrixStatistics con las estadísticas calculadas.
     * @throws {InvalidMatrixError} Si no se encuentran valores numéricos para calcular estadísticas.
     */
    private calculateMatrixStatistics(originalMatrix: Matrix, rotatedMatrix: Matrix): MatrixStatistics {
        let allValues: number[] = [];
        originalMatrix.forEach(row => allValues = allValues.concat(row));
        rotatedMatrix.forEach(row => allValues = allValues.concat(row));

        if (allValues.length === 0) {
            // Este caso debería ser cubierto por la validación de la matriz de entrada en execute,
            // pero se añade como un guardrail defensivo si por algún motivo una matriz llega vacía de Go.
            throw new InvalidMatrixError('No numeric values found in matrices to calculate statistics.');
        }

        const maxValue = Math.max(...allValues);
        const minValue = Math.min(...allValues);
        const totalSum = allValues.reduce((sum, val) => sum + val, 0);
        const average = totalSum / allValues.length;

        const isDiagonal = (matrix: Matrix): boolean => {
            if (!matrix || matrix.length === 0) return false;
            const rows = matrix.length;
            const cols = matrix[0].length;
            if (rows !== cols) return false; // Una matriz diagonal debe ser cuadrada

            for (let i = 0; i < rows; i++) {
                for (let j = 0; j < cols; j++) {
                    if (i !== j && matrix[i][j] !== 0) {
                        return false;
                    }
                }
            }
            return true;
        };

        const isDiagonalOriginal = isDiagonal(originalMatrix);
        const isDiagonalRotated = isDiagonal(rotatedMatrix);

        return {
            maxValue,
            minValue,
            average,
            totalSum,
            isDiagonalOriginal,
            isDiagonalRotated,
        };
    }
}