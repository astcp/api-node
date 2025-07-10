// src/app.ts

// Make sure dotenv is loaded at the very beginning to ensure environment variables are available

import 'dotenv/config';

import express, { Application } from 'express';

import { AppError } from '@domain/errors/app.errors';
import { AuthController } from '@interfaces/http/controllers/auth.controller';
import { AuthRoutes } from '@interfaces/http/routes/auth.routes';
import { GoApiHttpClient } from '@infrastructure/http-client/go-api.http-client';
import { MatrixController } from '@interfaces/http/controllers/matrix.controller';
import { MatrixRoutes } from '@interfaces/http/routes/matrix.routes';
import { ProcessMatrixAndGetStatsUseCase } from '@application/use-cases/matrix/process-matrix-and-get-stats.usecase';
import { authMiddleware } from '@interfaces/http/middleware/auth.middleware';
import { config } from './config';

// --- IMPORTANT CHANGE: Import config using the alias @config ---


// --- NEW IMPORTS FOR JWT AUTHENTICATION ---




class App {
    public app: Application;
    public port: number;

    constructor() {
        this.app = express();
        this.port = config.nodeApiPort;
        this.initializeMiddlewares();
        this.initializeRoutes();
        this.initializeErrorHandling();
    }

    private initializeMiddlewares(): void {
        // Allows Express to parse JSON in the request body
        this.app.use(express.json()); 
    }

    private initializeRoutes(): void {
        // --- Authentication Routes (Public) ---
        // These routes do not require a JWT to be accessed (e.g., /api/auth/login)
        const authController = new AuthController();
        const authRoutes = new AuthRoutes(authController);
        this.app.use('/api/auth', authRoutes.router); // Prefix for authentication routes

        // --- Initialize dependencies for the Matrix API ---
        // Initializes the HTTP client for the Go API
        const goApiHttpClient = new GoApiHttpClient(config.goApiBaseUrl, config.goApiAppAccessToken);

        // Initializes the main use case with its dependency (the Go HTTP client)
        const processMatrixAndGetStatsUseCase = new ProcessMatrixAndGetStatsUseCase(goApiHttpClient);

        // Initializes the controller with the use case
        const matrixController = new MatrixController(processMatrixAndGetStatsUseCase);

        // --- Matrix Routes (PROTECTED WITH JWT!) ---
        // Apply the authentication middleware to all routes under /api/matrix
        // Any request to /api/matrix/... will now require a valid JWT.
        this.app.use('/api/matrix', authMiddleware);

        // Define the routes for the Matrix API.
        // Now, the matrix processing endpoint will be /api/matrix/process-matrix
        const matrixRoutes = new MatrixRoutes(matrixController);
        this.app.use('/api/matrix', matrixRoutes.router); // Use the /api/matrix prefix
    }

    private initializeErrorHandling(): void {
        // Centralized middleware for error handling
        this.app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
            if (err instanceof AppError) {
                console.error(`[AppError] ${err.name}: ${err.message} (Code: ${err.errorCode}, Status: ${err.statusCode})`);
                res.status(err.statusCode).json({
                    error: err.errorCode,
                    details: err.message,
                    ...(err.details && { message: err.details })
                });
            } else {
                console.error(`[Unhandled Error] ${err.name}: ${err.message}`, err.stack);
                res.status(500).json({
                    error: 'INTERNAL_SERVER_ERROR',
                    details: 'An unexpected error occurred.',
                });
            }
        });
    }

    public listen(): void {
        this.app.listen(this.port, () => {
            console.log(`⚡️Node.js API listening on port ${this.port}`);
            console.log(`🔗 Go API URL: ${config.goApiBaseUrl}`); // Shows the Go API base URL
            // Verify JWT secret configuration for debugging
            console.log(`🔐 JWT Secret: ${config.jwtSecret ? 'Configured' : 'NOT CONFIGURED'}`); 
        });
    }
}

// Create an instance of the application and start it
const app = new App();
app.listen();