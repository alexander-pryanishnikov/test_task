import { DataTypes } from "sequelize";
import { sequelize } from "../../infrastructure/config/db.js";

export const CronJob = sequelize.define(
  "CronJob",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
    },
    interval: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: "*/5 * * * *",
    },
    functionName: {
      type: DataTypes.STRING,
      allowNull: false,
      field: "function_name",
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
      field: "is_active",
    },
  },
  {
    tableName: "cron_jobs",
    timestamps: false,
  },
);

export const CronJobExecution = sequelize.define(
  "CronJobExecution",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    jobId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: "job_id",
    },
    serverId: {
      type: DataTypes.STRING,
      allowNull: false,
      field: "server_id",
    },
    startTime: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
      field: "start_time",
    },
    endTime: {
      type: DataTypes.DATE,
      allowNull: true,
      field: "end_time",
    },
    status: {
      type: DataTypes.ENUM("pending", "running", "completed", "failed"),
      allowNull: false,
      defaultValue: "pending",
    },
  },
  {
    tableName: "cron_job_executions",
    timestamps: false,
  },
);

CronJob.hasMany(CronJobExecution, { foreignKey: "jobId" });
CronJobExecution.belongsTo(CronJob, { foreignKey: "jobId" });
