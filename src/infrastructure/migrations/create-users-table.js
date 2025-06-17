export async function up({ context: queryInterface }) {
  await queryInterface.createTable("users", {
    id: {
      type: "INTEGER",
      primaryKey: true,
      autoIncrement: true,
    },
    balance: {
      type: "INTEGER",
      defaultValue: 0,
      allowNull: false,
    },
  });
}

export async function down({ context: queryInterface }) {
  await queryInterface.dropTable("users");
}
