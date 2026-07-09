import AccountModel from "../models/accounts.models.js";

const createAccount = async (req, res) => {
  const { userId, accountType, currency, status } = req.body;

  try {
    if (!userId || !accountType || !currency || !status) {
      res.status(400).json({
        message: "Please fill all the required fields",
        success: false,
      });
    }

    const accountNumber = Math.floor(
      1000000000 + Math.random() * 9000000000,
    ).toString();

    const newAccount = AccountModel.create({
      userId,
      accountType,
      accountNumber,
      currency,
      status,
    });

    res.status(201).json({
      message: "Account has been created successfully",
      accountNumber,
      success: true,
    });
  } catch (error) {
    res.status(500).json({
      message: "Internal server error",
      success: false,
    });
  }
};

const getAllAccount = async (req, res) => {
  const userId = req.id;

  try {
    if (!userId) {
      return res.status(401).json({
        message: "Unauthorized please sign up or login",
        success: false,
      });
    }

    const accounts = await AccountModel.find({ userId }).select(
      "-_id -userId -createdAt -updatedAt -__v",
    );

    if (!accounts) {
      return res.status(404).json({
        message: "Please create at least one account",
        success: false,
      });
    }

    res.status(200).json({
      message: "accounts found successfully",
      success: true,
      accounts,
    });
  } catch (error) {
    res.status(500).json({
      message: "Internal server error",
      success: false,
    });
  }
};

export { createAccount, getAllAccount };
