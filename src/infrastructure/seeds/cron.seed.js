import { CronJob } from "../../modules/cron/cron.model.js";

const jobs = [
  {
    name: "Task 1",
    interval: "*/2 * * * *",
    functionName: "task1",
  },
  {
    name: "Task 2",
    interval: "*/3 * * * *",
    functionName: "task2",
  },
  {
    name: "Task 3",
    interval: "*/4 * * * *",
    functionName: "task3",
  },
  {
    name: "Task 4",
    interval: "*/5 * * * *",
    functionName: "task4",
  },
  {
    name: "Task 5",
    interval: "*/6 * * * *",
    functionName: "task5",
  },
];

export async function cronJobsSeed() {
  for (const job of jobs) {
    const [createdJob] = await CronJob.upsert(job);
    console.log(
      `${createdJob.isNewRecord ? "Created" : "Updated"} cron job: ${job.name}`,
    );
  }

  console.log("Cron jobs seeded successfully.");

  return true;
}
