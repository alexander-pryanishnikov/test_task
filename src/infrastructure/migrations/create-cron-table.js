export async function up({ context: queryInterface }) {
  await queryInterface.sequelize.query(`
    CREATE TYPE enum_cron_job_executions_status
    AS ENUM ('pending', 'running', 'completed', 'failed')
  `);

  await queryInterface.createTable("cron_jobs", {
    id: {
      type: "INTEGER",
      primaryKey: true,
      autoIncrement: true,
    },
    name: {
      type: "VARCHAR(255)",
      allowNull: false,
      unique: true,
    },
    interval: {
      type: "VARCHAR(255)",
      allowNull: false,
    },
    function_name: {
      type: "VARCHAR(255)",
      allowNull: false,
    },
    is_active: {
      type: "BOOLEAN",
      allowNull: false,
      defaultValue: true,
    },
  });

  await queryInterface.createTable("cron_job_executions", {
    id: {
      type: "INTEGER",
      primaryKey: true,
      autoIncrement: true,
    },
    job_id: {
      type: "INTEGER",
      allowNull: false,
      references: {
        model: "cron_jobs",
        key: "id",
      },
    },
    server_id: {
      type: "VARCHAR(255)",
      allowNull: false,
    },
    start_time: {
      type: "TIMESTAMP",
      allowNull: false,
      defaultValue: queryInterface.sequelize.literal("CURRENT_TIMESTAMP"),
    },
    end_time: {
      type: "TIMESTAMP",
      allowNull: true,
    },
    status: {
      type: "enum_cron_job_executions_status",
      allowNull: false,
    },
  });

  await queryInterface.addIndex("cron_job_executions", ["job_id"]);
}

export async function down({ context: queryInterface }) {
  await queryInterface.dropTable("cron_job_executions");
  await queryInterface.dropTable("cron_jobs");

  await queryInterface.sequelize.query(`
    DROP TYPE IF EXISTS enum_cron_job_executions_status
  `);
}
