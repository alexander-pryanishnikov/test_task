import { User } from "./user.model.js";
import { Sequelize } from "sequelize";

const { Op } = Sequelize;

class UserService {
  updateBalance = async (userId, amount) => {
    const result = await User.update(
      { balance: Sequelize.literal(`balance + ${amount}`) },
      {
        where: {
          id: userId,
          ...(amount < 0 && { balance: { [Op.gte]: -amount } }),
        },
        returning: true,
      },
    );

    const [rowCount, [updatedUser]] = result;

    if (rowCount === 0) {
      if (amount < 0) throw new Error("Insufficient balance");

      const userExists = await User.count({
        where: { id: userId },
        attributes: [],
      });

      if (!userExists) throw new Error("User not found");
      throw new Error("Balance update failed");
    }

    return { balance: updatedUser.balance };
  };
}

export const userService = new UserService();
