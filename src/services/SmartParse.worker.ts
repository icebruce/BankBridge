import { parentPort, workerData } from 'worker_threads';
import { smartParse } from './SmartParse';

(async () => {
  try {
    const result = await smartParse(
      workerData.filePath,
      workerData.opts,
      (progress) => parentPort?.postMessage({ type: 'progress', value: progress })
    );
    parentPort?.postMessage({ type: 'done', result });
  } catch (err) {
    parentPort?.postMessage({ type: 'error', error: err });
  }
})(); 