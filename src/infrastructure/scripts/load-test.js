import http from "http";
import { Agent } from "http";
import { URL } from "url";
import { exec } from "child_process";
import { promisify } from "util";
import chalk from "chalk";

const execAsync = promisify(exec);

const keepAliveAgent = new Agent({
  keepAlive: true,
  maxSockets: 5000,
  maxFreeSockets: 1000,
  timeout: 100,
});

const CONFIG = {
  SERVER_URL: "http://localhost:3000",
  USER_ID: 1,
  DEBIT_AMOUNT: -2,
  TOTAL_REQUESTS: 10000,
  REQUEST_TIMEOUT: 5000,
  MAX_RETRIES: 2,
};

async function seedTestUser() {
  console.log(chalk.blue("⚙️  Запуск seed-скрипта..."));
  try {
    const { stdout } = await execAsync("npm run seed:users");
    console.log(chalk.green("✅ Seed-скрипт успешно выполнен"));
    return true;
  } catch (error) {
    console.error(chalk.red("❌ Ошибка seed-скрипта:"), error);
    return false;
  }
}

async function sendDebitRequest() {
  const postData = JSON.stringify({
    userId: CONFIG.USER_ID,
    amount: CONFIG.DEBIT_AMOUNT,
  });

  return new Promise((resolve) => {
    const startTime = Date.now();

    const req = http.request(
      new URL(`${CONFIG.SERVER_URL}/api/users/balance`),
      {
        agent: keepAliveAgent,
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Content-Length": Buffer.byteLength(postData),
          Connection: "keep-alive",
        },
        timeout: CONFIG.REQUEST_TIMEOUT,
      },
      (res) => {
        const chunks = [];
        res.on("data", (chunk) => chunks.push(chunk));
        res.on("end", () => {
          const duration = Date.now() - startTime;
          try {
            const data = Buffer.concat(chunks).toString();
            const response = data ? JSON.parse(data) : {};
            resolve({
              success: res.statusCode === 200,
              status: res.statusCode,
              error: response.error || "",
              duration,
            });
          } catch (e) {
            resolve({
              success: false,
              status: res.statusCode,
              error: `JSON parse error: ${e.message}`,
              duration,
            });
          }
        });
      },
    );

    req.on("error", (error) => {
      resolve({
        success: false,
        status: 0,
        error: error.code || error.message,
        duration: Date.now() - startTime,
      });
    });

    req.on("timeout", () => {
      req.destroy();
      resolve({
        success: false,
        status: 0,
        error: "Timeout",
        duration: CONFIG.REQUEST_TIMEOUT,
      });
    });

    req.write(postData);
    req.end();
  });
}

async function runLoadTest() {
  if (!(await seedTestUser())) return;

  console.log(
    chalk.blue(`🚀 Запуск теста: ${CONFIG.TOTAL_REQUESTS} запросов...`),
  );

  // Объект для сбора статистики
  const stats = {
    success: 0,
    insufficient: 0,
    errors: 0,
    errorDetails: new Map(),
    durations: [],
    statusCodes: new Map(),
    startTime: Date.now(),
  };

  // Создаем все промисы сразу
  const requests = Array(CONFIG.TOTAL_REQUESTS)
    .fill()
    .map(() => sendDebitRequest());

  const results = await Promise.all(requests);

  for (const result of results) {
    if (result.success) {
      stats.success++;
    } else if (result.error.includes("Insufficient")) {
      stats.insufficient++;
    } else {
      stats.errors++;
    }

    if (result.status) {
      const statusKey = result.status.toString();
      stats.statusCodes.set(
        statusKey,
        (stats.statusCodes.get(statusKey) || 0) + 1,
      );
    }

    if (!result.success) {
      const errorKey = result.error || "unknown-error";
      stats.errorDetails.set(
        errorKey,
        (stats.errorDetails.get(errorKey) || 0) + 1,
      );
    }

    stats.durations.push(result.duration);
  }

  const totalTime = Date.now() - stats.startTime;

  // Расчет перцентилей времени ответа
  stats.durations.sort((a, b) => a - b);
  const p50 = stats.durations[Math.floor(stats.durations.length * 0.5)];
  const p95 = stats.durations[Math.floor(stats.durations.length * 0.95)];
  const p99 = stats.durations[Math.floor(stats.durations.length * 0.99)];
  const avg =
    stats.durations.reduce((sum, d) => sum + d, 0) / stats.durations.length;

  console.log("\n");
  console.log(chalk.green("✅ Тест завершен!"));
  console.log(chalk.blue("📊 Общие результаты:"));
  console.log(`  Общее время: ${(totalTime / 1000).toFixed(2)} сек`);
  console.log(
    `  Скорость: ${(CONFIG.TOTAL_REQUESTS / (totalTime / 1000)).toFixed(2)} запр/сек`,
  );
  console.log(`  Всего запросов: ${CONFIG.TOTAL_REQUESTS}`);
  console.log(`  Успешных списаний: ${chalk.green(stats.success)}`);
  console.log(
    `  Ошибок "Недостаточно средств": ${chalk.yellow(stats.insufficient)}`,
  );
  console.log(`  Других ошибок: ${chalk.red(stats.errors)}`);

  console.log("\n⏱ Время ответа:");
  console.log(`  Среднее: ${avg.toFixed(2)} мс`);
  console.log(`  p50: ${p50} мс`);
  console.log(`  p95: ${p95} мс`);
  console.log(`  p99: ${p99} мс`);

  if (stats.statusCodes.size > 0) {
    console.log("\n📋 Статус-коды:");
    for (const [code, count] of stats.statusCodes) {
      console.log(`  ${code}: ${count} запросов`);
    }
  }

  if (stats.errorDetails.size > 0) {
    console.log("\n❗ Детализация ошибок:");
    for (const [error, count] of stats.errorDetails) {
      console.log(`  ${chalk.red(error)}: ${count} раз`);
    }
  }

  const expectedSuccess = 5000;
  const expectedInsufficient = 5000;

  console.log("\n🔍 Проверка результатов:");
  console.log(`  Ожидается успешных: ${expectedSuccess}`);
  console.log(`  Ожидается ошибок баланса: ${expectedInsufficient}`);

  if (
    stats.success === expectedSuccess &&
    stats.insufficient === expectedInsufficient
  ) {
    console.log(
      chalk.green("🎉 Тест пройден! Результаты соответствуют ожиданиям."),
    );
  } else {
    console.log(
      chalk.red("❌ Тест не пройден! Результаты не соответствуют ожиданиям."),
    );
    console.log(
      `  Расхождение по успешным: ${stats.success - expectedSuccess}`,
    );
    console.log(
      `  Расхождение по ошибкам баланса: ${stats.insufficient - expectedInsufficient}`,
    );
  }
}

runLoadTest();
