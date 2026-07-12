import AccountModel from "../models/accounts.models.js";
import ledgerModel from "../models/ledger.models.js";

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

const verifyBalance = async (req, res) => {
  const accountNumber = req.params.accountNumber;

  try {
    if (!accountNumber) {
      return res.status(400).json({
        message: "please provide your accountNumber",
        success: false,
      });
    }

    const account = await AccountModel.findOne({ accountNumber });

    if (!account) {
      return res.status(404).json({
        message:
          "account not found please create one account to audit and verify",
        success: false,
      });
    }

    const debitLedgers = await ledgerModel.find({
      accountNumber,
      type: "debit",
    });
    const creditLedgers = await ledgerModel.find({
      accountNumber,
      type: "credit",
    });

    const totalDebits = debitLedgers.reduce(
      (sum, ledger) => sum + ledger.amount,
      0,
    );
    const totalCredits = creditLedgers.reduce(
      (sum, ledger) => sum + ledger.amount,
      0,
    );

    const testBalance = totalCredits - totalDebits;

    if (account.balance !== testBalance) {
      return res.status(400).json({
        message:
          "There is an financial transaction issue in your account balance we will suspense that and fix that soon!",
        success: false,
      });
    }

    res.status(200).json({
      message: "Balance verified",
      success: true,
      balance: account.balance,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Internal server error" + error,
      success: false,
    });
  }
};

const statement = async (req, res) => {
  const accountNumber = req.params.accountNumber;

  try {
    if (!accountNumber) {
      return res.status(400).json({
        message: "please provide your account number to get the ledgers",
        success: false,
      });
    }

    const account = await AccountModel.findOne({ accountNumber });

    if (!account) {
      return res.status(404).json({
        message:
          "account not found please create an account to get the ledgers",
        success: false,
      });
    }

    const ledgers = await ledgerModel
      .find({ accountNumber })
      .select("-_id -createdAt -updatedAt -__v ");

    if (!ledgers) {
      return res.status(404).json({
        message: "please make transactions to get the ledgers data",
        success: false,
      });
    }

    res.status(200).json({
      message: "ledgers fetched successfully",
      success: true,
      ledgers,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Internal server error" + error,
      success: false,
    });
  }
};

export { createAccount, getAllAccount, verifyBalance, statement };
