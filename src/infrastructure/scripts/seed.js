import { sequelize } from "../config/db.js";
import { runSeeds, getAvailableSeedTypes } from "../seeds/index.js";

const args = process.argv.slice(2);
const seedType = args[0]?.replace("--", "");

async function seed() {
  try {
    await sequelize.authenticate();

    const availableTypes = getAvailableSeedTypes();

    if (seedType && !availableTypes.includes(seedType) && seedType !== "all") {
      throw new Error(
        `Неверный тип сида: ${seedType}. Доступные типы: ${availableTypes.join(", ")}, all`,
      );
    }

    const seedsToRun =
      !seedType || seedType === "all" ? availableTypes : [seedType];

    console.log("🚀 Начало выполнения сидов...");
    console.log(`🔧 Типы сидов для выполнения: ${seedsToRun.join(", ")}`);

    const startTime = Date.now();
    const results = await runSeeds(seedsToRun);

    const duration = (Date.now() - startTime) / 1000;
    console.log(`\n⌛ Общее время выполнения: ${duration.toFixed(2)} сек`);

    const success = Object.values(results).filter(Boolean).length;
    const total = seedsToRun.length;

    console.log(`\n📊 Результаты:`);
    console.log(`  Успешно выполнено: ${success} из ${total}`);

    if (success < total) {
      throw new Error("Некоторые сиды завершились с ошибкой");
    }

    console.log("✅ Все сиды успешно выполнены");
  } catch (error) {
    console.error("❌ Ошибка при выполнении сидов:", error.message);
    throw error;
  } finally {
    await sequelize.close();
    console.log("🔒 Соединение с базой данных закрыто");
  }
}

seed()
  .then(() => process.exit(0))
  .catch(() => process.exit(1));
