import UserService from "../services/userService.js";

const UserController = {
  async getAll(req, res, next) {
    try {
      const filters = {
        page: req.query.page,
        per_page: req.query.per_page,
        role: req.query.role,
        is_active: req.query.is_active === "true" ? true : req.query.is_active === "false" ? false : undefined
      };
      const result = await UserService.getAllUsers(filters);
      res.json({
        success: true,
        data: result.users,
        meta: result.meta
      });
    } catch (error) {
      next(error);
    }
  },

  async getById(req, res, next) {
    try {
      const user = await UserService.getUserById(req.params.id);
      res.json({
        success: true,
        data: user
      });
    } catch (error) {
      next(error);
    }
  },

  async create(req, res, next) {
    try {
      const user = await UserService.createUser(req.body);
      res.status(201).json({
        success: true,
        data: user
      });
    } catch (error) {
      next(error);
    }
  },

  async update(req, res, next) {
    try {
      const user = await UserService.updateUser(req.params.id, req.body);
      res.json({
        success: true,
        data: user
      });
    } catch (error) {
      next(error);
    }
  },

  async delete(req, res, next) {
    try {
      await UserService.deleteUser(req.params.id);
      res.json({
        success: true,
        message: "User successfully deactivated"
      });
    } catch (error) {
      next(error);
    }
  }
};

export default UserController;
