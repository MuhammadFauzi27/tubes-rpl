import bcrypt from "bcrypt";
import UserRepository from "../repositories/userRepository.js";

const UserService = {
  async getAllUsers(filters) {
    const { page = 1, per_page = 20, role, is_active } = filters;
    const limit = parseInt(per_page);
    const offset = (parseInt(page) - 1) * limit;

    const [users, total] = await Promise.all([
      UserRepository.findAll({ role, is_active, limit, offset }),
      UserRepository.countAll({ role, is_active })
    ]);

    return {
      users,
      meta: {
        total,
        page: parseInt(page),
        per_page: limit,
        total_pages: Math.ceil(total / limit)
      }
    };
  },

  async getUserById(id) {
    const user = await UserRepository.findById(id);
    if (!user) {
      const error = new Error("User not found");
      error.statusCode = 404;
      error.errorCode = "NOT_FOUND";
      throw error;
    }
    return user;
  },

  async createUser(userData) {
    const existingUser = await UserRepository.findByEmail(userData.email);
    if (existingUser) {
      const error = new Error("Email already registered");
      error.statusCode = 409;
      error.errorCode = "CONFLICT";
      throw error;
    }

    const salt = await bcrypt.genSalt(10);
    const password_hash = await bcrypt.hash(userData.password, salt);

    return await UserRepository.create({
      ...userData,
      password_hash,
      role: userData.role || 'admin'
    });
  },

  async updateUser(id, userData) {
    const user = await UserRepository.findById(id);
    if (!user) {
      const error = new Error("User not found");
      error.statusCode = 404;
      error.errorCode = "NOT_FOUND";
      throw error;
    }

    if (userData.email && userData.email !== user.email) {
      const existingUser = await UserRepository.findByEmail(userData.email);
      if (existingUser) {
        const error = new Error("Email already registered");
        error.statusCode = 409;
        error.errorCode = "CONFLICT";
        throw error;
      }
    }

    return await UserRepository.update(id, userData);
  },

  async deleteUser(id) {
    const user = await UserRepository.findById(id);
    if (!user) {
      const error = new Error("User not found");
      error.statusCode = 404;
      error.errorCode = "NOT_FOUND";
      throw error;
    }

    // Soft delete: set is_active = false
    return await UserRepository.update(id, { is_active: false });
  }
};

export default UserService;
