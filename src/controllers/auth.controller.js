import userModel from "../models/user.models.js";

const registerUser = async (req, res) => {
  const { name, email, password } = req.body;

  if (!name || !email || !password) {
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
      });
    }
  } catch (error) {
    return res.status(500).json({
      message: "Error occurred while registering user",
      error: error.message,
    });
  }
};
