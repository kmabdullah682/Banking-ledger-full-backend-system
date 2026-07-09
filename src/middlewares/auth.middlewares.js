import express from "express";
import jwt from "jsonwebtoken";

const authMiddleware = (req, res, next) => {
  try {
    const token = req.cookies.token;

    if (!token) {
      return res.status(401).json({
        message: "Unauthorized",
        success: false,
      });
    }

    const decode = jwt.decode(token, process.env.JWT_SECRET);

    if (!decode) {
      return res.status(401).json({
        message: "Invalid token",
        success: false,
      });
    }

    req.id = decode.id;

    next();
  } catch (error) {
    res.status(401).json({ message: "Unauthorized" });
  }
};

export { authMiddleware };
