import { Worker } from 'worker_threads';
import path from 'node:path';
import { ipcMain } from 'electron';
import winston from 'winston';
import { ParseOpts, ParseResult } from '../../models/parse';

// Configure logger for main process
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  transports: [
    new winston.transports.File({ filename: 'main-process.log' })
  ]
});

if (process.env.NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console({
    format: winston.format.simple()
  }));
}

/**
 * Register IPC handler for file parsing
 */
export function registerParseFileHandler(): void {
  ipcMain.handle('parse-file', async (event, filePath: string, opts: ParseOpts) => {
    return new Promise<ParseResult>((resolve, reject) => {
      logger.info('Starting file parse', { filePath, opts });

      // Create worker thread
      const workerPath = path.resolve(__dirname, '../services/SmartParse.worker.js');
      const worker = new Worker(workerPath, {
        workerData: { filePath, opts }
      });

      // Handle worker messages
      worker.on('message', (msg: any) => {
        switch (msg.type) {
          case 'progress':
            // Forward progress to renderer
            event.sender.send('parse-progress', msg.value);
            break;
          case 'done':
            logger.info('Parse completed successfully', { filePath, stats: msg.result.stats });
            resolve(msg.result as ParseResult);
            break;
          case 'error':
            logger.error('Parse failed in worker', { filePath, error: msg.error });
            reject(msg.error);
            break;
        }
      });

      // Handle worker errors
      worker.on('error', (error) => {
        logger.error('Worker thread error', { filePath, error });
        reject(error);
      });

      // Handle worker exit
      worker.on('exit', (code) => {
        if (code !== 0) {
          const error = new Error(`Worker stopped with exit code ${code}`);
          logger.error('Worker exited unexpectedly', { filePath, code });
          reject(error);
        }
      });
    }).catch((err) => {
      logger.error('Parse file handler error', { filePath, error: err });
      throw err;
    });
  });

  logger.info('Parse file IPC handler registered');
} 