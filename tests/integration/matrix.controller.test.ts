// tests/integration/interfaces/http/controllers/matrix.controller.test.ts

import { GoApiError, InvalidMatrixError } from '@domain/errors/app.errors';
import { GoApiResponseData, Matrix } from '@domain/entities/matrix';
import { NextFunction, Request, Response } from 'express';

import { GoApiGateway } from '@application/ports/go-api.gateway';
import { MatrixController } from '@interfaces/http/controllers/matrix.controller';
import { ProcessMatrixAndGetStatsUseCase } from '@application/use-cases/matrix/process-matrix-and-get-stats.usecase';

describe('MatrixController (Integration Test)', () => {
    let mockGoApiGateway: jest.Mocked<GoApiGateway>;
    let processMatrixAndGetStatsUseCase: ProcessMatrixAndGetStatsUseCase;
    let matrixController: MatrixController;

    let mockRequest: Partial<Request>;
    let mockResponse: Partial<Response>;
    let mockNext: jest.Mock<NextFunction>;

    // Common setup for each test
    beforeEach(() => {
        mockGoApiGateway = {
            processMatrix: jest.fn(),
        };
        processMatrixAndGetStatsUseCase = new ProcessMatrixAndGetStatsUseCase(mockGoApiGateway);
        matrixController = new MatrixController(processMatrixAndGetStatsUseCase);

        // Reset mocks for request, response, and next for each test
        mockRequest = {};
        mockResponse = {
            status: jest.fn().mockReturnThis(), // Allow chaining .status().json()
            json: jest.fn(),
        };
        mockNext = jest.fn();
    });

    // --- Test Cases ---

    it('should successfully process a matrix and return 200 OK with statistics', async () => {
        const inputMatrix: Matrix = [
            [1, 2],
            [3, 4],
        ];
        mockRequest.body = { matrix: inputMatrix };

        // Mock response from the Go API (only relevant fields for the use case output)
        const mockGoApiResponse: GoApiResponseData = {
            original_matrix: inputMatrix,
            rotated_matrix: [
                [3, 1],
                [4, 2],
            ],
            // Include other fields expected by your GoApiResponseData, even if not directly used in the final response json
            qr_factorization: { 
                Q: [[-0.31, -0.95], [-0.95, 0.31]],
                R: [[-3.16, -4.43], [0.0, -0.63]],
            },
            // flat_matrix, min, max, sum, avg would be calculated by the Node.js API
        };
        mockGoApiGateway.processMatrix.mockResolvedValue(mockGoApiResponse);

        await matrixController.processMatrix(mockRequest as Request, mockResponse as Response, mockNext);

        // Assertions for Go API gateway interaction
        expect(mockGoApiGateway.processMatrix).toHaveBeenCalledTimes(1);
        expect(mockGoApiGateway.processMatrix).toHaveBeenCalledWith(inputMatrix);

        // Assertions for HTTP response
        expect(mockResponse.status).toHaveBeenCalledWith(200);
        expect(mockResponse.json).toHaveBeenCalledWith(expect.objectContaining({ // Use objectContaining for robustness
            matrix: inputMatrix,
            flat_matrix: [1, 2, 3, 4], // Calculate flattened matrix
            inverted_matrix: [
                [1, 3],
                [2, 4],
            ], // Correct inverted matrix based on original_matrix [1,2],[3,4]
            min: 1,
            max: 4,
            sum: 10,
            avg: 2.5,
        }));
        // Ensure no error was passed to next middleware
        expect(mockNext).not.toHaveBeenCalled();
    });

    it('should call next with InvalidMatrixError if matrix is missing from request body', async () => {
        mockRequest.body = {}; // Request body without 'matrix' property

        await matrixController.processMatrix(mockRequest as Request, mockResponse as Response, mockNext);

        // Expect status and json to NOT be called, as the error is passed to next
        expect(mockResponse.status).not.toHaveBeenCalled();
        expect(mockResponse.json).not.toHaveBeenCalled();

        // Expect the error to be passed to next
        expect(mockNext).toHaveBeenCalledTimes(1);
        expect(mockNext).toHaveBeenCalledWith(expect.any(InvalidMatrixError));
        // You can also check the specific message if you want
        expect((mockNext.mock.calls[0][0] as InvalidMatrixError).message).toBe('Request body must contain a "matrix" property with the matrix data.');

        expect(mockGoApiGateway.processMatrix).not.toHaveBeenCalled();
    });

    it('should call next with InvalidMatrixError if matrix contains non-numeric values', async () => {
        mockRequest.body = {
            matrix: [
                [1, 'a'], // Contains a non-numeric value
                [3, 4],
            ],
        };

        await matrixController.processMatrix(mockRequest as Request, mockResponse as Response, mockNext);

        expect(mockResponse.status).not.toHaveBeenCalled();
        expect(mockResponse.json).not.toHaveBeenCalled();

        expect(mockNext).toHaveBeenCalledTimes(1);
        expect(mockNext).toHaveBeenCalledWith(expect.any(InvalidMatrixError));
        expect((mockNext.mock.calls[0][0] as InvalidMatrixError).message).toBe('Invalid matrix format. Matrix must be an array of arrays of numbers.');

        expect(mockGoApiGateway.processMatrix).not.toHaveBeenCalled();
    });

    it('should call next with InvalidMatrixError if Go API returns invalid matrix dimensions error', async () => {
        const inputMatrix: Matrix = [[1, 2, 3]]; // A matrix the Go API might consider invalid
        mockRequest.body = { matrix: inputMatrix };

        const goApiError = new InvalidMatrixError('La matriz debe ser cuadrada.');
        mockGoApiGateway.processMatrix.mockRejectedValue(goApiError);

        await matrixController.processMatrix(mockRequest as Request, mockResponse as Response, mockNext);

        expect(mockResponse.status).not.toHaveBeenCalled();
        expect(mockResponse.json).not.toHaveBeenCalled();

        expect(mockGoApiGateway.processMatrix).toHaveBeenCalledTimes(1);
        expect(mockGoApiGateway.processMatrix).toHaveBeenCalledWith(inputMatrix);
        expect(mockNext).toHaveBeenCalledTimes(1);
        expect(mockNext).toHaveBeenCalledWith(goApiError); // Pass the exact error received
    });

    it('should call next with GoApiError for generic Go API errors', async () => {
        const inputMatrix: Matrix = [[1]];
        mockRequest.body = { matrix: inputMatrix };

        const goApiError = new GoApiError('Error inesperado de la API de Go.', 'GO_API_ERROR', 500);
        mockGoApiGateway.processMatrix.mockRejectedValue(goApiError);

        await matrixController.processMatrix(mockRequest as Request, mockResponse as Response, mockNext);

        expect(mockResponse.status).not.toHaveBeenCalled();
        expect(mockResponse.json).not.toHaveBeenCalled();

        expect(mockGoApiGateway.processMatrix).toHaveBeenCalledTimes(1);
        expect(mockGoApiGateway.processMatrix).toHaveBeenCalledWith(inputMatrix);
        expect(mockNext).toHaveBeenCalledTimes(1);
        expect(mockNext).toHaveBeenCalledWith(goApiError); // Pass the exact error received
    });

    it('should call next with generic Error for unhandled exceptions during processing', async () => {
        const inputMatrix: Matrix = [[1]];
        mockRequest.body = { matrix: inputMatrix };

        const unexpectedError = new Error('Something completely unexpected happened!');
        mockGoApiGateway.processMatrix.mockImplementationOnce(() => {
            throw unexpectedError; // Simulate an unexpected synchronous error
        });

        await matrixController.processMatrix(mockRequest as Request, mockResponse as Response, mockNext);

        expect(mockResponse.status).not.toHaveBeenCalled();
        expect(mockResponse.json).not.toHaveBeenCalled();

        expect(mockGoApiGateway.processMatrix).toHaveBeenCalledTimes(1);
        expect(mockNext).toHaveBeenCalledTimes(1);
        expect(mockNext).toHaveBeenCalledWith(unexpectedError); // Pass the exact error received
    });
});