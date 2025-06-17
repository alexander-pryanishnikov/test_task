import { Sequelize } from "sequelize";
import dotenv from "dotenv";
dotenv.config();

export const sequelize = new Sequelize({
  dialect: process.env.DB_DIALECT,
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  username: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  logging: false,
  pool: {
    max: 300,
    min: 0,
    acquire: 60000,
    idle: 10000,
  },
});
