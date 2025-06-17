import { CronJob, CronJobExecution } from "./cron.model.js";

class CronController {
  getCronJobs = async (req, res) => {
    try {
      const jobs = await CronJob.findAll({
        include: [
          {
            model: CronJobExecution,
            order: [["startTime", "DESC"]],
            limit: 1,
          },
        ],
      });

      const now = new Date();

      const result = jobs.map((job) => {
        const execution = job.CronJobExecutions[0] || null;

        return {
          id: job.id,
          name: job.name,
          interval: job.interval,
          functionName: job.functionName,
          isActive: job.isActive,
          status: execution?.status || "idle",
          server: execution?.serverId || null,
          duration: execution?.startTime
            ? Math.floor((now - new Date(execution.startTime)) / 1000) // в секундах
            : null,
        };
      });

      res.json(result);
    } catch (error) {
      console.error("❌ Get cron jobs error:", error);
      this.handleError(res, error);
    }
  };

  handleError(res, error) {
    console.error("Cron Controller Error:", error);

    let status = 500;
    let message = "Internal Server Error";

    if (error.name === "SequelizeDatabaseError") {
      status = 400;
      message = "Database error";
    } else if (error.name === "SequelizeConnectionError") {
      status = 503;
      message = "Database unavailable";
    }

    res.status(status).json({
      error: message,
      details:
        process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
}

export const cronController = new CronController();
