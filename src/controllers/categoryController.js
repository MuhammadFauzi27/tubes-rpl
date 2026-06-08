import CategoryService from "../services/categoryService.js";

const CategoryController = {
  async getAll(req, res, next) {
    try {
      // Public view only shows active categories by default
      // Admin might want to see all
      const filters = {};
      if (req.query.is_active !== undefined) {
        filters.is_active = req.query.is_active === "true";
      } else if (!req.user) {
        // If no user (public), show only active
        filters.is_active = true;
      }

      const categories = await CategoryService.getAllCategories(filters);
      res.json({
        success: true,
        data: categories
      });
    } catch (error) {
      next(error);
    }
  },

  async create(req, res, next) {
    try {
      const category = await CategoryService.createCategory(req.body);
      res.status(201).json({
        success: true,
        data: category
      });
    } catch (error) {
      next(error);
    }
  },

  async update(req, res, next) {
    try {
      const category = await CategoryService.updateCategory(req.params.id, req.body);
      res.json({
        success: true,
        data: category
      });
    } catch (error) {
      next(error);
    }
  },

  async delete(req, res, next) {
    try {
      await CategoryService.deleteCategory(req.params.id);
      res.json({
        success: true,
        message: "Operasi berhasil"
      });
    } catch (error) {
      next(error);
    }
  }
};

export default CategoryController;
