import path from "path";
import { fileURLToPath } from "url";
import { Umzug, SequelizeStorage } from "umzug";
import { sequelize } from "../config/db.js";
import dotenv from "dotenv";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, "../.env") });

async function runMigrations() {
  try {
    await sequelize.authenticate();

    const migrator = new Umzug({
      storage: new SequelizeStorage({
        sequelize,
        modelName: "SchemaMigration",
      }),
      migrations: {
        glob: [path.resolve(__dirname, "../migrations/*.js")],
        resolve: ({ name, path, context }) => {
          const migration = import(path);
          return {
            name,
            up: async () => (await migration).up({ context }),
            down: async () => (await migration).down({ context }),
          };
        },
      },
      context: sequelize.getQueryInterface(),
      logger: console,
    });

    const command = process.argv[2];

    switch (command) {
      case "up":
        await migrator.up();
        console.log("🚀 All migrations applied successfully.");
        break;

      case "down":
        await migrator.down({ to: 0, step: 1 });
        console.log("🔙 Last migration reverted successfully.");
        break;

      default:
        console.error("❌ Unknown command. Use 'up' or 'down'");
        process.exit(1);
    }
  } catch (error) {
    console.error("❌ Migration error:", error);
    process.exit(1);
  } finally {
    await sequelize.close();
  }
}

runMigrations();
