// src/domain/entities/matrix.ts

/**
 * @typedef {number[][]} Matrix
 * @description Define un tipo para representar una matriz como un array de arrays de números.
 */
export type Matrix = number[][];

/**
 * @interface QRFactorization
 * @description Define la estructura para la factorización QR de una matriz.
 * Contiene dos matrices: Q (ortogonal) y R (triangular superior).
 */
export interface QRFactorization {
    Q: Matrix;
    R: Matrix;
}

/**
 * @interface GoApiResponseData
 * @description Define la estructura de la respuesta de datos exitosa esperada de la API de Go
 * cuando es consultada por el cliente principal (ej. el frontend).
 * Incluye la matriz original, la rotada y su factorización QR.
 *
 * NOTA: En el flujo actual del desafío, esta es la respuesta que Go le da al frontend.
 * Go NO le envía directamente este tipo a Node.js.
 */
export interface GoApiResponseData {
    original_matrix: Matrix;
    rotated_matrix: Matrix;
    qr_factorization: QRFactorization;
}

/**
 * @interface GoApiErrorResponse
 * @description Define la estructura de un objeto de error esperado de la API de Go.
 * Contiene un código de error y detalles adicionales.
 */
export interface GoApiErrorResponse {
    error: string;
    details: string;
}

/**
 * @interface GoApiResponse
 * @description Define la estructura general de una respuesta de la API de Go.
 * Puede contener datos de éxito (`GoApiResponseData`) o información de error.
 */
export interface GoApiResponse {
    data?: GoApiResponseData;
    message?: string;
    error?: string; // Usado para mensajes de error generales
    details?: string; // Detalles adicionales para errores
}

/**
 * @interface MatrixProcessingRequest
 * @description Define la estructura esperada para la solicitud de procesamiento de una matriz
 * que se envía a la API de Go (o que podría haber sido procesada en Node.js originalmente).
 */
export interface MatrixProcessingRequest {
    matrix: Matrix;
}

/**
 * @interface GoToNodeReceivedData
 * @description Define la estructura EXACTA de los datos que la API de Node.js ESPERA recibir
 * del POST interno que realiza la API de Go.
 * Incluye la matriz original, la matriz rotada y la factorización QR.
 */
export interface GoToNodeReceivedData {
    original_matrix: Matrix;
    rotated_matrix: Matrix;
    qr_factorization: QRFactorization;
}

/**
 * @interface MatrixStatistics
 * @description Define la estructura de las estadísticas específicas que la API de Node.js
 * debe calcular sobre las matrices recibidas de Go, según el desafío.
 * Esto incluye valores máximos, mínimos, promedios, sumas y la propiedad de ser diagonal.
 */
export interface MatrixStatistics {
    maxValue: number;
    minValue: number;
    average: number;
    totalSum: number;
    isDiagonalOriginal: boolean; // Indica si la matriz original es diagonal
    isDiagonalRotated: boolean;  // Indica si la matriz rotada es diagonal
}

/**
 * @interface MatrixStatsResponse
 * @description Define la estructura de la respuesta JSON que la API de Node.js enviará
 * de vuelta a la API de Go después de calcular las estadísticas.
 * Contiene un mensaje, y un objeto `data` con las matrices, QR y las estadísticas calculadas.
 */
export interface MatrixStatsResponse {
    message: string;
    data: {
        originalMatrix: Matrix;
        rotatedMatrix: Matrix;
        qrFactorization: QRFactorization;
        statistics: MatrixStatistics; // Las estadísticas calculadas por Node.js
    };
}

/**
 * @interface ProcessedMatrixResult
 * @description Define una estructura combinada para un resultado completo de procesamiento
 * de matriz, incluyendo la matriz original, rotada, su factorización QR y las estadísticas calculadas.
 * Este tipo podría ser el valor de retorno final de un caso de uso que orquesta tanto la llamada
 * a Go como el cálculo de estadísticas (si ese fuera el flujo).
 *
 * NOTA: En el flujo actual del desafío (Go llama a Node.js), este tipo puede ser menos directamente usado
 * para la comunicación inter-API, pero es útil para representar el resultado final en el lado de Node.js.
 */
export interface ProcessedMatrixResult {
    originalMatrix: Matrix;
    rotatedMatrix: Matrix;
    qrFactorization: QRFactorization;
    statistics: MatrixStatistics;
}