import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import config from "../config/index.js";
import UserRepository from "../repositories/userRepository.js";
import UserService from "./userService.js";

const AuthService = {
  async register(userData) {
    // Default role for registration is 'admin' since it's the only one left
    const user = await UserService.createUser({
      ...userData,
      role: 'admin'
    });

    const token = jwt.sign(
      { id: user.id, role: user.role },
      config.JWT_SECRET,
      { expiresIn: config.JWT_EXPIRES_IN }
    );

    return {
      token,
      expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      user
    };
  },

  async login(email, password) {
    const user = await UserRepository.findByEmail(email);
    if (!user || !user.is_active) {
      const error = new Error("Invalid credentials or account disabled");
      error.statusCode = 401;
      error.errorCode = "INVALID_CREDENTIALS";
      throw error;
    }

    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      const error = new Error("Invalid credentials");
      error.statusCode = 401;
      error.errorCode = "INVALID_CREDENTIALS";
      throw error;
    }

    const token = jwt.sign(
      { id: user.id, role: user.role },
      config.JWT_SECRET,
      { expiresIn: config.JWT_EXPIRES_IN }
    );

    await UserRepository.updateLastLogin(user.id);

    // Remove password hash from user object
    const { password_hash, ...userWithoutPassword } = user;

    return {
      token,
      expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // Roughly 24h
      user: userWithoutPassword
    };
  },

  async changePassword(userId, currentPassword, newPassword) {
    const user = await UserRepository.findById(userId);
    // We need password_hash which findById doesn't return in my current impl
    // Let's use findByEmail or adjust findById. 
    // Actually findByEmail returns it.
    const userWithAuth = await UserRepository.findByEmail(user.email);

    const isMatch = await bcrypt.compare(currentPassword, userWithAuth.password_hash);
    if (!isMatch) {
      const error = new Error("Current password incorrect");
      error.statusCode = 401;
      throw error;
    }

    const salt = await bcrypt.genSalt(10);
    const newPasswordHash = await bcrypt.hash(newPassword, salt);

    await UserRepository.updatePassword(userId, newPasswordHash);
  }
};

export default AuthService;
