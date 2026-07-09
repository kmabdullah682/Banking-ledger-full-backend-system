import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },

    email: {
      type: String,
      required: true,
      lowercase: true,
      unique: true,
      match: [
        /^\w+([-+.']\w+)*@\w+([-.]\w+)*\.\w{2,64}$/,
        "Please fill a valid email address",
      ],
    },

    password: {
      type: String,
      required: true,
      length: [8, "Password must be at least 8 characters long"],
      select: false,
    },
  },
  { timestamps: true },
);

const userModel = mongoose.model("User", userSchema);
export default userModel;
