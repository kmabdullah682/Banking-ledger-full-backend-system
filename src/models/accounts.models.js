import mongoose from "mongoose";

const accountSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "User ID is required"],
    },

    accountType: {
      type: String,
      enum: ["savings", "checking"],
      required: [true, "Account type is required"],
    },

    accountNumber: {
      type: String,
      required: [true, "Account number is required"],
      unique: true,
      trim: true,
    },

    balance: {
      type: Number,
      default: 0.0,
      validate: {
        validator: Number.isInteger,
        message: "{VALUE} is not an integer balance value.",
      },
    },

    currency: {
      type: String,
      enum: ["USD", "EUR", "GBP"],
      required: [true, "Currency is required"],
    },

    status: {
      type: String,
      enum: ["active", "frozen", "closed"],
      default: "active",
    },
  },
  { timestamps: true },
);

const AccountModel = mongoose.model("Account", accountSchema);
export default AccountModel;
