import userModel from "../models/user.models.js";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";

const registerUser = async (req, res) => {
  const { name, email, password, testPass } = req.body;

  if (!name || !email || !password || !testPass) {
    return res
      .status(400)
      .json({ message: "Please provide all required fields" });
  }

  try {
    const existingUser = await userModel.findOne({
      $or: [{ email }, { name }],
    });

    if (existingUser) {
      return res.status(400).json({
        message: "User with the same email or name already exists",
        success: false,
      });
    }

    if (password !== testPass) {
      return res.status(400).json({
        message: "Passwords do not match",
        success: false,
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await userModel.create({
      name,
      email,
      password: hashedPassword,
    });

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
      expiresIn: "5d",
    });

    res.cookie("token", token);

    return res.status(201).json({
      message: "User registered successfully",
      success: true,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Error occurred while registering user",
      error: error.message,
    });
  }
};

const loginUser = async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await userModel.findOne({ email }).select("+password");

    if (!user) {
      return res.status(401).json({
        message: "Invalid email",
        success: false,
      });
    }

    const isPassword = await bcrypt.compare(password, user.password);

    if (!isPassword) {
      return res.status(401).json({
        message: "Invalid password",
        success: false,
      });
    }

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
      expiresIn: "5d",
    });

    res.cookie("token", token);

    return res.status(200).json({
      message: "User logged in successfully",
      success: true,
    });
  } catch (error) {
    res.status(500).json({
      message: "Internal server error " + error,
      success: false,
    });
  }
};

export { registerUser, loginUser };
