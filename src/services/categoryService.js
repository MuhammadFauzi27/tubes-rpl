import CategoryRepository from "../repositories/categoryRepository.js";

const CategoryService = {
  async getAllCategories(is_active) {
    const categories = await CategoryRepository.findAll({ is_active });
    return categories.map(category => ({
      ...category,
      item_count: parseInt(category.item_count)
    }));
  },

  async getCategoryById(id) {
    const category = await CategoryRepository.findById(id);
    if (!category) {
      const error = new Error("Kategori tidak ditemukan");
      error.statusCode = 404;
      error.errorCode = "NOT_FOUND";
      throw error;
    }
    return {
      ...category,
      item_count: parseInt(category.item_count)
    };
  },

  async createCategory(categoryData) {
    const existingCategory = await CategoryRepository.findByName(categoryData.name);
    if (existingCategory) {
      const error = new Error("Nama kategori sudah ada");
      error.statusCode = 409;
      error.errorCode = "CONFLICT";
      throw error;
    }

    return await CategoryRepository.create(categoryData);
  },

  async updateCategory(id, categoryData) {
    const category = await CategoryRepository.findById(id);
    if (!category) {
      const error = new Error("Kategori tidak ditemukan");
      error.statusCode = 404;
      error.errorCode = "NOT_FOUND";
      throw error;
    }

    if (categoryData.name && categoryData.name !== category.name) {
      const existingCategory = await CategoryRepository.findByName(categoryData.name);
      if (existingCategory) {
        const error = new Error("Nama kategori sudah ada");
        error.statusCode = 409;
        error.errorCode = "CONFLICT";
        throw error;
      }
    }

    return await CategoryRepository.update(id, categoryData);
  },

  async deleteCategory(id) {
    const category = await CategoryRepository.findById(id);
    if (!category) {
      const error = new Error("Kategori tidak ditemukan");
      error.statusCode = 404;
      error.errorCode = "NOT_FOUND";
      throw error;
    }

    const hasMenuItems = await CategoryRepository.hasMenuItems(id);
    if (hasMenuItems) {
      const error = new Error("Kategori masih memiliki menu aktif");
      error.statusCode = 409;
      error.errorCode = "CONFLICT";
      throw error;
    }

    await CategoryRepository.delete(id);
  }
};

export default CategoryService;
