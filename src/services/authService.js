import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import config from "../config/index.js";
import UserRepository from "../repositories/userRepository.js";
import UserService from "./userService.js";

const AuthService = {
  async register(userData) {
    const user = await UserService.createUser({
      ...userData,
      role: 'admin'
    });

    const expiresIn = config.JWT_EXPIRES_IN || "24h";
    const token = jwt.sign(
      { id: user.id, role: user.role },
      config.JWT_SECRET,
      { expiresIn }
    );

    // Simple calculation for expires_at based on 24h default if not parsed
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 24);

    return {
      token,
      expires_at: expiresAt.toISOString(),
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        created_at: user.created_at
      }
    };
  },

  async login(email, password) {
    const user = await UserRepository.findByEmail(email);
    if (!user || !user.is_active) {
      const error = new Error("Email atau password tidak valid");
      error.statusCode = 401;
      error.errorCode = "INVALID_CREDENTIALS";
      throw error;
    }

    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      const error = new Error("Email atau password tidak valid");
      error.statusCode = 401;
      error.errorCode = "INVALID_CREDENTIALS";
      throw error;
    }

    const expiresIn = config.JWT_EXPIRES_IN || "24h";
    const token = jwt.sign(
      { id: user.id, role: user.role },
      config.JWT_SECRET,
      { expiresIn }
    );

    await UserRepository.updateLastLogin(user.id);

    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 24);

    return {
      token,
      expires_at: expiresAt.toISOString(),
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        created_at: user.created_at
      }
    };
  }
};

export default AuthService;
