import { userService } from "./user.service.js";

class UserController {
  updateBalance = async (req, res) => {
    console.log(req.body);
    const { userId, amount } = req.body;

    const errors = [];

    if (userId === undefined || userId === null) {
      errors.push("userId is required");
    } else {
      const numUserId = Number(userId);
      if (isNaN(numUserId) || !Number.isInteger(numUserId) || numUserId <= 0) {
        errors.push("userId must be a positive integer");
      }
    }

    if (amount === undefined || amount === null) {
      errors.push("amount is required");
    } else {
      const numAmount = Number(amount);
      if (isNaN(numAmount) || !Number.isFinite(numAmount)) {
        errors.push("amount must be a valid number");
      }
    }

    if (errors.length > 0) {
      return res.status(400).json({ errors });
    }

    const numUserId = Number(userId);
    const numAmount = Number(amount);

    try {
      const result = await userService.updateBalance(numUserId, numAmount);
      res.json(result);
    } catch (err) {
      switch (err.message) {
        case "User not found":
          res.status(404).json({ error: err.message });
          break;
        case "Insufficient balance":
        case "Invalid amount":
          res.status(400).json({ error: err.message });
          break;
        default:
          console.error("Balance update error:", err);
          res.status(500).json({ error: "Internal Server Error" });
      }
    }
  };
}

export const userController = new UserController();
