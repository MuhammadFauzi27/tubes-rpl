import AuthService from "../services/authService.js";
import UserService from "../services/userService.js";

const AuthController = {
  async login(req, res, next) {
    try {
      const { email, password } = req.body;
      const result = await AuthService.login(email, password);
      res.json({
        success: true,
        data: result
      });
    } catch (error) {
      next(error);
    }
  },

  async logout(req, res, next) {
    try {
      // In JWT, logout is usually handled on the client by deleting the token.
      // Or we can implement a blacklist if needed.
      // For now, simple success response.
      res.json({
        success: true,
        message: "Logout successful"
      });
    } catch (error) {
      next(error);
    }
  },

  async me(req, res, next) {
    try {
      const user = await UserService.getUserById(req.user.id);
      res.json({
        success: true,
        data: user
      });
    } catch (error) {
      next(error);
    }
  },

  async changePassword(req, res, next) {
    try {
      const { current_password, new_password, new_password_confirmation } = req.body;
      
      if (new_password !== new_password_confirmation) {
        const error = new Error("New password confirmation does not match");
        error.statusCode = 422;
        throw error;
      }

      await AuthService.changePassword(req.user.id, current_password, new_password);
      res.json({
        success: true,
        message: "Password successfully changed"
      });
    } catch (error) {
      next(error);
    }
  }
};

export default AuthController;
