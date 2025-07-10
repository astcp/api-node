// src/application/ports/go-api.gateway.ts

import { GoApiResponseData, Matrix } from '@domain/entities/matrix';

// La interfaz del "Gateway" o "Puerto Saliente"
// Define el contrato para comunicarse con la API de Go.
export interface GoApiGateway {
    processMatrix(matrix: Matrix): Promise<GoApiResponseData>;
}