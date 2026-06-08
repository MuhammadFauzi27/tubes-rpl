import CategoryService from "../services/categoryService.js";

const CategoryController = {
  async getAllPublic(req, res, next) {
    try {
      const categories = await CategoryService.getAllCategories(true);
      res.json({
        success: true,
        data: categories
      });
    } catch (error) {
      next(error);
    }
  },

  async getAllAdmin(req, res, next) {
    try {
      const categories = await CategoryService.getAllCategories();
      res.json({
        success: true,
        data: categories
      });
    } catch (error) {
      next(error);
    }
  },

  async getById(req, res, next) {
    try {
      const category = await CategoryService.getCategoryById(req.params.id);
      res.json({
        success: true,
        data: category
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
