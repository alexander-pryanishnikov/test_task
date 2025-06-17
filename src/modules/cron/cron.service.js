import cron from "node-cron";
import { CronJob, CronJobExecution } from "./cron.model.js";
import { sequelize } from "../../infrastructure/config/db.js";
import { v4 as uuidv4 } from "uuid";
import { someLongTasksService } from "./some-long-task.service.js";
import cluster from "cluster";
import { Op, Transaction } from "sequelize";

const SERVER_ID = uuidv4();
const JOB_LOCK_TIMEOUT_MS = 5 * 60 * 1000;
const MAX_WORKERS = 5;

export class CronService {
  constructor() {
    this.tasks = {};
    this.activeJobs = new Set();
    this.isDbInitialized = false;
  }

  async init() {
    if (cluster.isPrimary) {
      console.log(`Primary process ${process.pid} is running`);
      const numWorkers = Math.min(MAX_WORKERS, require("os").cpus().length);

      for (let i = 0; i < numWorkers; i++) {
        const worker = cluster.fork();

        if (i === 0) {
          worker.on("online", () => {
            worker.send({ type: "MASTER" });
          });
        }
      }
      return;
    }

    try {
      await sequelize.authenticate();
      this.isDbInitialized = true;
      console.log(`Worker ${process.pid} ready (ID: ${SERVER_ID})`);

      process.on("message", async (msg) => {
        if (msg.type === "MASTER") {
          console.log(`Worker ${process.pid} is master`);
          await this.cleanupStaleJobs();
          await this.scheduleJobs();
        }
      });

      await this.startTaskProcessing();
    } catch (error) {
      console.error(`Worker ${process.pid} init failed:`, error.message);
      process.exit(1);
    }
  }

  async startTaskProcessing() {
    setInterval(async () => {
      if (!this.isDbInitialized) return;

      try {
        const availableJobs = await CronJob.findAll({
          where: { isActive: true },
          include: [
            {
              model: CronJobExecution,
              where: {
                status: "running",
                startTime: {
                  [Op.lt]: new Date(Date.now() - JOB_LOCK_TIMEOUT_MS),
                },
              },
              required: false,
            },
          ],
        });

        for (const job of availableJobs) {
          if (!this.activeJobs.has(job.name)) {
            await this.tryExecuteJob(job);
          }
        }
      } catch (error) {
        console.error(`Worker ${process.pid} task check error:`, error.message);
      }
    }, 10000);
  }

  async tryExecuteJob(job) {
    try {
      this.activeJobs.add(job.name);
      const execution = await this.acquireJobExecution(job.id);
      if (!execution) return;

      const startTime = new Date();
      console.log(
        `[${job.name}] STARTED on ${SERVER_ID} at ${startTime.toISOString()}`,
      );

      await someLongTasksService[job.functionName]();

      await execution.update({
        endTime: new Date(),
        status: "completed",
      });

      const duration = Math.round((new Date() - startTime) / 1000);
      console.log(`[${job.name}] COMPLETED in ${duration}s on ${SERVER_ID}`);
    } catch (error) {
      console.error(`[${job.name}] ERROR:`, error.message);
      try {
        await CronJobExecution.update(
          { status: "failed", endTime: new Date() },
          { where: { jobId: job.id, status: "running" } },
        );
      } catch (updateError) {
        console.error(
          `[${job.name}] Status update failed:`,
          updateError.message,
        );
      }
    } finally {
      this.activeJobs.delete(job.name);
    }
  }

  async scheduleJobs() {
    if (!this.isDbInitialized) return;

    try {
      const jobs = await CronJob.findAll({ where: { isActive: true } });
      if (jobs.length === 0) return;

      for (const job of jobs) {
        this.scheduleJob(job);
      }
    } catch (error) {
      console.error(`Worker ${process.pid} scheduling error:`, error.message);
    }
  }

  scheduleJob(job) {
    if (this.tasks[job.name]) {
      this.tasks[job.name].stop();
    }

    this.tasks[job.name] = cron.schedule(job.interval, async () => {
      console.log(`[${job.name}] Triggered at ${new Date().toISOString()}`);
    });

    console.log(`Scheduled ${job.name} (${job.interval})`);
  }

  async acquireJobExecution(jobId) {
    if (!this.isDbInitialized) return null;

    const transaction = await sequelize.transaction({
      isolationLevel: Transaction.ISOLATION_LEVELS.SERIALIZABLE,
    });

    try {
      const [execution, created] = await CronJobExecution.findOrCreate({
        where: { jobId },
        defaults: {
          jobId,
          serverId: SERVER_ID,
          status: "running",
          startTime: new Date(),
        },
        transaction,
      });

      if (!created) {
        if (
          execution.status === "running" &&
          new Date() - execution.startTime < JOB_LOCK_TIMEOUT_MS
        ) {
          await transaction.commit();
          return null;
        }

        await execution.update(
          {
            serverId: SERVER_ID,
            status: "running",
            startTime: new Date(),
          },
          { transaction },
        );
      }

      await transaction.commit();
      return execution;
    } catch (error) {
      await transaction.rollback();
      console.error(`Acquisition error:`, error.message);
      return null;
    }
  }

  async cleanupStaleJobs() {
    if (!this.isDbInitialized) return;

    try {
      const [affectedCount] = await CronJobExecution.update(
        { status: "failed", endTime: new Date() },
        {
          where: {
            status: "running",
            startTime: { [Op.lt]: new Date(Date.now() - JOB_LOCK_TIMEOUT_MS) },
          },
        },
      );

      if (affectedCount > 0) {
        console.log(`Cleaned ${affectedCount} stale jobs`);
      }
    } catch (error) {
      console.error(`Cleanup error:`, error.message);
    }
  }

  cleanup() {
    Object.values(this.tasks).forEach((task) => task.stop());
    this.activeJobs.clear();
  }
}

export const cronService = new CronService();
