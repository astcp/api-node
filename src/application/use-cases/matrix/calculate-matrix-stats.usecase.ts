// src/application/use-cases/matrix/calculate-matrix-stats.usecase.ts

import { GoToNodeReceivedData, MatrixStatistics } from '@domain/entities/matrix';

import { InvalidMatrixError } from '@domain/errors/app.errors';

/**
 * @class CalculateMatrixStatsUseCase
 * @description Caso de uso para calcular estadísticas específicas sobre matrices recibidas.
 * Calcula el valor máximo, mínimo, promedio, suma total y verifica si las matrices son diagonales.
 */
export class CalculateMatrixStatsUseCase {
    /**
     * @method execute
     * @description Ejecuta el cálculo de estadísticas sobre los datos de matriz proporcionados.
     * @param data Los datos de la matriz recibidos de la API de Go (original, rotada, QR).
     * @returns Un objeto MatrixStatistics con los resultados calculados.
     * @throws {InvalidMatrixError} Si los datos de la matriz son inválidos o están vacíos.
     */
    execute(data: GoToNodeReceivedData): MatrixStatistics {
        const { original_matrix, rotated_matrix } = data;

        // Validaciones básicas de las matrices recibidas
        if (!original_matrix || original_matrix.length === 0 || !rotated_matrix || rotated_matrix.length === 0) {
            throw new InvalidMatrixError('Matrices provided are empty or invalid for statistics calculation.');
        }

        // Concatenar todos los valores de ambas matrices para calcular estadísticas globales
        let allValues: number[] = [];
        original_matrix.forEach(row => allValues = allValues.concat(row));
        rotated_matrix.forEach(row => allValues = allValues.concat(row));

        if (allValues.length === 0) {
            throw new InvalidMatrixError('No numeric values found in matrices to calculate statistics.');
        }

        // Calcular Estadísticas Requeridas
        const maxValue = Math.max(...allValues);
        const minValue = Math.min(...allValues);
        const totalSum = allValues.reduce((sum, val) => sum + val, 0);
        const average = totalSum / allValues.length;

        /**
         * @private
         * @function isDiagonal
         * @description Función auxiliar para verificar si una matriz es diagonal.
         * Una matriz diagonal debe ser cuadrada y tener ceros fuera de la diagonal principal.
         * @param matrix La matriz a verificar.
         * @returns {boolean} True si la matriz es diagonal, false en caso contrario.
         */
        const isDiagonal = (matrix: number[][]): boolean => {
            if (!matrix || matrix.length === 0) return false;
            const rows = matrix.length;
            const cols = matrix[0].length;
            if (rows !== cols) return false; // Una matriz diagonal debe ser cuadrada

            for (let i = 0; i < rows; i++) {
                for (let j = 0; j < cols; j++) {
                    // Si no estamos en la diagonal principal (i !== j) y el valor no es cero, no es diagonal.
                    if (i !== j && matrix[i][j] !== 0) {
                        return false;
                    }
                }
            }
            return true;
        };

        const isDiagonalOriginal = isDiagonal(original_matrix);
        const isDiagonalRotated = isDiagonal(rotated_matrix);

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