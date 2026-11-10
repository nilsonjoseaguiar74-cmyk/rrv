import { closePool } from "./db.js";
import { startVerifyExecutionWorker } from "./workers/verify-execution-worker.js";

const stopWorker = startVerifyExecutionWorker();
let shutdownPromise;

function shutdown() {
  if (!shutdownPromise) {
    shutdownPromise = (async () => {
      await stopWorker();
      await closePool();
    })();
  }
  return shutdownPromise;
}

for (const signal of ["SIGINT", "SIGTERM"]) {
  process.once(signal, () => {
    void shutdown().then(
      () => process.exit(0),
      () => {
        console.error("verify_execution_worker_shutdown_failed");
        process.exit(1);
      },
    );
  });
}
