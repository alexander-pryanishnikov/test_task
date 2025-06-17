import cluster from "cluster";
import os from "os";
import { createServer } from "http";
import app from "./app.js";
import { sequelize } from "./infrastructure/config/db.js";
import { cronService } from "./modules/cron/cron.service.js";

const PORT = process.env.PORT || 3000;
const numCPUs = os.cpus().length;

async function startServer() {
  try {
    await sequelize.authenticate();

    await cronService.init();

    const server = createServer(app);
    server.listen(PORT, () => {
      console.log(`Server worker ${process.pid} started on port ${PORT}`);
    });
  } catch (error) {
    console.error("❌ Server startup error:", error);
    process.exit(1);
  }
}

if (cluster.isPrimary) {
  console.log(`Primary process ${process.pid} is running`);

  for (let i = 0; i < numCPUs; i++) {
    cluster.fork();
  }

  cluster.on("exit", (worker, code, signal) => {
    console.log(`Worker ${worker.process.pid} died. Restarting...`);
    cluster.fork();
  });
} else {
  startServer().catch((error) => {
    console.error("❌ Worker startup failed:", error);
    process.exit(1);
  });
}
