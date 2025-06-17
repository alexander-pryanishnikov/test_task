import { userSeed } from "./user.seed.js";
import { cronJobsSeed } from "./cron.seed.js";

const seedRegistry = {
  users: userSeed,
  cron: cronJobsSeed,
};

export function getAvailableSeedTypes() {
  return Object.keys(seedRegistry);
}

export async function runSeeds(seedTypes) {
  const results = {};

  for (const seedType of seedTypes) {
    try {
      if (seedRegistry[seedType]) {
        console.log(`\n🏁 Запуск сида: ${seedType}`);
        results[seedType] = await seedRegistry[seedType]();
        console.log(`✅ Сид ${seedType} успешно выполнен`);
      } else {
        console.warn(`⚠️ Неизвестный тип сида: ${seedType}`);
        results[seedType] = false;
      }
    } catch (error) {
      console.error(`❌ Ошибка выполнения сида ${seedType}:`, error.message);
      results[seedType] = false;
    }
  }

  return results;
}
