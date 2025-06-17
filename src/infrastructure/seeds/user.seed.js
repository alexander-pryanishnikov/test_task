import { User } from "../../modules/user/user.model.js";

export async function userSeed() {
  await User.upsert({
    id: 1,
    balance: 10000,
  });

  console.log("Test user seeded successfully.");

  return true;
}
