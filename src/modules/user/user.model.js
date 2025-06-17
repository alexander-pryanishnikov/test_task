import { DataTypes } from "sequelize";
import { sequelize } from "../../infrastructure/config/db.js";

export const User = sequelize.define(
  "User",
  {
    balance: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
    },
  },
  {
    tableName: "users",
    timestamps: false,
  },
);
