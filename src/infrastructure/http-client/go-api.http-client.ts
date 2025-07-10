// src/infrastructure/http-client/go-api.http-client.ts

import { GoApiError, UnauthorizedError } from '@domain/errors/app.errors';
import { GoApiResponse, GoApiResponseData, Matrix } from '@domain/entities/matrix';
import axios, { AxiosError, AxiosInstance } from 'axios';

import { GoApiGateway } from '@application/ports/go-api.gateway';

// Ya no necesitamos importar 'config' aquí si los valores se pasan al constructor
// import { config } from '../../config'; // Elimina o comenta esta línea si pasas los valores por constructor

export class GoApiHttpClient implements GoApiGateway {
    private readonly client: AxiosInstance;
    // Ya no necesitamos 'appAccessToken' como propiedad de la clase si solo se usa en el constructor de Axios
    // private readonly appAccessToken: string;

    // EL CONSTRUCTOR DEBE ACEPTAR DOS ARGUMENTOS: baseURL y appAccessToken
    constructor(baseURL: string, appAccessToken: string) { // <-- ¡ESTO ES LO CLAVE!
        if (!baseURL) {
            throw new Error("GoApiHttpClient: baseURL is required.");
        }
        if (!appAccessToken) {
            throw new Error("GoApiHttpClient: appAccessToken is required.");
        }

        // Ya no se lee de 'config' directamente aquí, sino de los parámetros del constructor
        // this.appAccessToken = appAccessToken; // Si decides guardarlo como propiedad

        this.client = axios.create({
            baseURL: baseURL, // <-- Usa el parámetro baseURL
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${appAccessToken}`, // <-- Usa el parámetro appAccessToken
            },
            timeout: 10000, // 10 segundos de timeout
        });

        // Interceptor para manejar errores de la API de Go de forma consistente
        this.client.interceptors.response.use(
            response => response,
            (error: AxiosError<GoApiResponse>) => {
                if (error.response) {
                    const errorData = error.response.data;
                    const status = error.response.status;

                    if (status === 401) {
                        return Promise.reject(new UnauthorizedError(errorData.details || 'Token de acceso de la aplicación inválido o expirado.'));
                    }
                    if (status === 400 && errorData.error === 'dimensiones_de_matriz_invalidas') {
                        // El use case maneja este error específicamente para lanzar InvalidMatrixError
                        return Promise.reject(error); // Re-lanzar el error Axios original para que el use case lo procese
                    }
                    // Para otros errores 4xx/5xx de la API de Go
                    return Promise.reject(new GoApiError(
                        errorData.message || errorData.details || `Go API responded with status ${status}`,
                        errorData.error || `HTTP_STATUS_${status}`,
                        status
                    ));
                } else if (error.request) {
                    // La solicitud fue hecha pero no se recibió respuesta (ej. red caída, CORS)
                    return Promise.reject(new GoApiError('No response received from Go API. It might be down or unreachable.', 'NETWORK_ERROR'));
                } else {
                    // Algo sucedió al configurar la solicitud que disparó un Error
                    return Promise.reject(new GoApiError(`Error setting up request to Go API: ${error.message}`));
                }
            }
        );
    }

    async processMatrix(matrix: Matrix): Promise<GoApiResponseData> {
        try {
            const response = await this.client.post<GoApiResponse>('/process-matrix', { matrix });
            if (!response.data || !response.data.data) {
                throw new GoApiError('Go API response data is malformed or missing.');
            }
            return response.data.data;
        } catch (error) {
            // El interceptor ya ha envuelto los errores de Axios en AppError, solo re-lanzamos
            throw error;
        }
    }
}