// tests/unit/application/use-cases/matrix/process-matrix-and-get-stats.usecase.test.ts

import { GoApiError, InvalidMatrixError } from '@domain/errors/app.errors';
import { GoApiResponseData, Matrix, ProcessedMatrixResult } from '@domain/entities/matrix';

import { GoApiGateway } from '@application/ports/go-api.gateway';
import { ProcessMatrixAndGetStatsUseCase } from '@application/use-cases/matrix/process-matrix-and-get-stats.usecase';

describe('ProcessMatrixAndGetStatsUseCase (Unit Test)', () => {
    let mockGoApiGateway: jest.Mocked<GoApiGateway>;
    let useCase: ProcessMatrixAndGetStatsUseCase;

    beforeEach(() => {
        // Initialize the mock for the Go API Gateway before each test
        mockGoApiGateway = {
            processMatrix: jest.fn(),
        };
        // Initialize the use case with the mocked gateway
        useCase = new ProcessMatrixAndGetStatsUseCase(mockGoApiGateway);
    });

    // --- Test Cases ---

    it('should process a valid matrix and return results with correct statistics', async () => {
        const inputMatrix: Matrix = [
            [1, 2, 3],
            [4, 5, 6],
            [7, 8, 9],
        ];

        // Mock response that the Go API would return to Node.js
        const mockGoApiResponse: GoApiResponseData = {
            original_matrix: inputMatrix, // Go returns the original matrix it received
            rotated_matrix: [
                [7, 4, 1],
                [8, 5, 2],
                [9, 6, 3],
            ], // Example rotated matrix from Go
            qr_factorization: {
                Q: [[-0.13, -0.9, -0.4], [-0.5, -0.0, 0.8], [-0.8, 0.4, -0.2]],
                R: [[-7.48, -8.76, -10.04], [0.0, -1.33, -2.66], [0.0, 0.0, 0.0]],
            },
        };
        // Configure the Go API gateway mock to resolve with this response
        mockGoApiGateway.processMatrix.mockResolvedValue(mockGoApiResponse);

        // Execute the use case
        const result: ProcessedMatrixResult = await useCase.execute({ matrix: inputMatrix });

        // Assertions:
        // 1. Verify that the Go API gateway was called correctly
        expect(mockGoApiGateway.processMatrix).toHaveBeenCalledTimes(1);
        expect(mockGoApiGateway.processMatrix).toHaveBeenCalledWith(inputMatrix);

        // 2. Verify the structure and content of the returned result
        expect(result.originalMatrix).toEqual(inputMatrix);
        expect(result.rotatedMatrix).toEqual(mockGoApiResponse.rotated_matrix);
        expect(result.qrFactorization).toEqual(mockGoApiResponse.qr_factorization);

        // 3. Verify the calculated statistics
        // Combined values from both matrices: [1,2,3,4,5,6,7,8,9,7,4,1,8,5,2,9,6,3]
        // Total sum: 45 (original) + 45 (rotated) = 90
        // Number of elements: 9 (original) + 9 (rotated) = 18
        // Average: 90 / 18 = 5
        // Max: 9, Min: 1
        expect(result.statistics.maxValue).toBe(9);
        expect(result.statistics.minValue).toBe(1);
        expect(result.statistics.totalSum).toBe(90);
        expect(result.statistics.average).toBe(5);
        expect(result.statistics.isDiagonalOriginal).toBe(false); // inputMatrix is not diagonal
        expect(result.statistics.isDiagonalRotated).toBe(false);  // rotated_matrix is not diagonal
    });

    it('should throw InvalidMatrixError if input matrix is empty', async () => {
        const inputMatrix: Matrix = [];
        // Expect the use case execution to reject with InvalidMatrixError
        await expect(useCase.execute({ matrix: inputMatrix })).rejects.toThrow(InvalidMatrixError);
        await expect(useCase.execute({ matrix: inputMatrix })).rejects.toHaveProperty('message', 'Input matrix is empty or malformed.');
        // Ensure the Go API gateway was NOT called as validation failed before that step
        expect(mockGoApiGateway.processMatrix).not.toHaveBeenCalled();
    });

    it('should throw InvalidMatrixError if input matrix is not rectangular', async () => {
        const inputMatrix: Matrix = [
            [1, 2],
            [3, 4, 5], // Row with different number of columns
        ];
        await expect(useCase.execute({ matrix: inputMatrix })).rejects.toThrow(InvalidMatrixError);
        await expect(useCase.execute({ matrix: inputMatrix })).rejects.toHaveProperty('message', 'Matrix must be rectangular (all rows must have the same number of columns).');
        expect(mockGoApiGateway.processMatrix).not.toHaveBeenCalled();
    });

    it('should throw InvalidMatrixError if input matrix contains non-numeric values', async () => {
        const inputMatrix: Matrix = [
            [1, 2],
            [3, 'a' as any], // Contains a non-numeric value (explicitly cast for test)
        ];
        await expect(useCase.execute({ matrix: inputMatrix })).rejects.toThrow(InvalidMatrixError);
        await expect(useCase.execute({ matrix: inputMatrix })).rejects.toHaveProperty('message', 'Matrix must contain only arrays of numbers.');
        expect(mockGoApiGateway.processMatrix).not.toHaveBeenCalled();
    });

    it('should re-throw GoApiError if Go API returns a non-400 error', async () => {
        const inputMatrix: Matrix = [[1]];
        // Simulate a 500 error from the Go API, wrapped in our GoApiError
        const goError = new GoApiError('Something went wrong on Go API', 'INTERNAL_GO_SERVER_ERROR', 500);

        mockGoApiGateway.processMatrix.mockRejectedValue(goError);

        await expect(useCase.execute({ matrix: inputMatrix })).rejects.toThrow(GoApiError);
        await expect(useCase.execute({ matrix: inputMatrix })).rejects.toHaveProperty('statusCode', 500);
        await expect(useCase.execute({ matrix: inputMatrix })).rejects.toHaveProperty('errorCode', 'INTERNAL_GO_SERVER_ERROR');
        expect(mockGoApiGateway.processMatrix).toHaveBeenCalledTimes(1);
    });

    it('should map Go API 400 matrix dimension error to InvalidMatrixError', async () => {
        const inputMatrix: Matrix = [[1, 2], [3]]; // Invalid matrix for Go (e.g., not square)
        // Simulate the AxiosError that the GoApiHttpClient would re-throw for this specific 400 case
        const axiosErrorMock: any = new Error('Request failed with status code 400');
        axiosErrorMock.isAxiosError = true;
        axiosErrorMock.response = {
            status: 400,
            data: { error: 'dimensiones_de_matriz_invalidas', details: 'La matriz debe ser cuadrada.' },
        };

        mockGoApiGateway.processMatrix.mockRejectedValue(axiosErrorMock);

        await expect(useCase.execute({ matrix: inputMatrix })).rejects.toThrow(InvalidMatrixError);
        await expect(useCase.execute({ matrix: inputMatrix })).rejects.toHaveProperty('message', 'La matriz debe ser cuadrada.');
        expect(mockGoApiGateway.processMatrix).toHaveBeenCalledTimes(1);
    });

    it('should throw GoApiError for network issues with Go API', async () => {
        const inputMatrix: Matrix = [[1]];
        // Simulate a network error (no HTTP response)
        const networkError = new Error('Network Error');
        // The GoApiHttpClient should wrap this into a GoApiError with 'NETWORK_ERROR' code
        mockGoApiGateway.processMatrix.mockRejectedValue(networkError);

        await expect(useCase.execute({ matrix: inputMatrix })).rejects.toThrow(GoApiError);
        await expect(useCase.execute({ matrix: inputMatrix })).rejects.toHaveProperty('errorCode', 'NETWORK_ERROR');
        expect(mockGoApiGateway.processMatrix).toHaveBeenCalledTimes(1);
    });

    it('should throw InvalidMatrixError if Go API returns an empty or malformed result for statistics calculation', async () => {
        const inputMatrix: Matrix = [[1]]; // Valid input matrix

        // Simulate a scenario where Go API returns data, but the matrices within are empty or malformed
        const mockGoApiResponse: GoApiResponseData = {
            original_matrix: [[]], // Empty row, or empty matrix
            rotated_matrix: [[]],
            qr_factorization: { Q: [], R: [] },
        };
        mockGoApiGateway.processMatrix.mockResolvedValue(mockGoApiResponse);

        await expect(useCase.execute({ matrix: inputMatrix })).rejects.toThrow(InvalidMatrixError);
        await expect(useCase.execute({ matrix: inputMatrix })).rejects.toHaveProperty('message', 'No numeric values found in matrices to calculate statistics.');
        expect(mockGoApiGateway.processMatrix).toHaveBeenCalledTimes(1);
    });

    it('should correctly identify diagonal matrices in statistics', async () => {
        const inputMatrix: Matrix = [[1, 0], [0, 2]]; // Original is diagonal
        const mockGoApiResponse: GoApiResponseData = {
            original_matrix: inputMatrix,
            rotated_matrix: [[1, 1], [0, 2]], // Rotated is NOT diagonal
            qr_factorization: { Q: [[1, 0], [0, 1]], R: [[1, 2], [0, 3]] },
        };
        mockGoApiGateway.processMatrix.mockResolvedValue(mockGoApiResponse);

        const result: ProcessedMatrixResult = await useCase.execute({ matrix: inputMatrix });
        expect(result.statistics.isDiagonalOriginal).toBe(true);
        expect(result.statistics.isDiagonalRotated).toBe(false);
    });

    it('should correctly calculate statistics for a 1x1 matrix', async () => {
        const inputMatrix: Matrix = [[5]];
        const mockGoApiResponse: GoApiResponseData = {
            original_matrix: inputMatrix,
            rotated_matrix: [[5]],
            qr_factorization: { Q: [[1]], R: [[5]] },
        };
        mockGoApiGateway.processMatrix.mockResolvedValue(mockGoApiResponse);

        const result: ProcessedMatrixResult = await useCase.execute({ matrix: inputMatrix });
        expect(result.statistics.maxValue).toBe(5);
        expect(result.statistics.minValue).toBe(5);
        expect(result.statistics.totalSum).toBe(10); // 5 (original) + 5 (rotated)
        expect(result.statistics.average).toBe(5);   // 10 / 2 elements
        expect(result.statistics.isDiagonalOriginal).toBe(true); // 1x1 is always diagonal
        expect(result.statistics.isDiagonalRotated).toBe(true);
    });
});