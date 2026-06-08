import CategoryRepository from "../repositories/categoryRepository.js";

const CategoryService = {
  async getAllCategories(filters = {}) {
    return await CategoryRepository.findAll(filters);
  },

  async getCategoryById(id) {
    const category = await CategoryRepository.findById(id);
    if (!category) {
      const error = new Error("Kategori tidak ditemukan");
      error.statusCode = 404;
      error.code = "NOT_FOUND";
      throw error;
    }
    return category;
  },

  async createCategory(data) {
    const existing = await CategoryRepository.findByName(data.name);
    if (existing) {
      const error = new Error("Nama kategori sudah ada");
      error.statusCode = 409;
      error.code = "CONFLICT";
      throw error;
    }
    return await CategoryRepository.create(data);
  },

  async updateCategory(id, data) {
    // Check if category exists
    const category = await CategoryRepository.findById(id);
    if (!category) {
      const error = new Error("Kategori tidak ditemukan");
      error.statusCode = 404;
      error.code = "NOT_FOUND";
      throw error;
    }

    // If name is being updated, check for uniqueness
    if (data.name && data.name !== category.name) {
      const existing = await CategoryRepository.findByName(data.name);
      if (existing) {
        const error = new Error("Nama kategori sudah ada");
        error.statusCode = 409;
        error.code = "CONFLICT";
        throw error;
      }
    }

    return await CategoryRepository.update(id, data);
  },

  async deleteCategory(id) {
    const category = await CategoryRepository.findById(id);
    if (!category) {
      const error = new Error("Kategori tidak ditemukan");
      error.statusCode = 404;
      error.code = "NOT_FOUND";
      throw error;
    }

    const hasItems = await CategoryRepository.hasMenuItems(id);
    if (hasItems) {
      const error = new Error("Kategori masih memiliki menu aktif");
      error.statusCode = 409;
      error.code = "CATEGORY_HAS_ITEMS";
      throw error;
    }

    await CategoryRepository.delete(id);
  }
};

export default CategoryService;
