import MenuItemRepository from "../repositories/menuItemRepository.js";
import CategoryRepository from "../repositories/categoryRepository.js";

const MenuItemService = {
  async getAllMenuItems(filters = {}) {
    const { page = 1, per_page = 20, ...rest } = filters;
    const limit = parseInt(per_page);
    const offset = (parseInt(page) - 1) * limit;

    const { rows, total } = await MenuItemRepository.findAll({ ...rest, limit, offset });

    return {
      data: rows,
      meta: {
        total,
        page: parseInt(page),
        per_page: limit,
        total_pages: Math.ceil(total / limit)
      }
    };
  },

  async getMenuItemById(id) {
    const menuItem = await MenuItemRepository.findById(id);
    if (!menuItem) {
      const error = new Error("Menu item tidak ditemukan");
      error.statusCode = 404;
      error.code = "NOT_FOUND";
      throw error;
    }
    return menuItem;
  },

  async createMenuItem(data) {
    // Check if category exists
    const category = await CategoryRepository.findById(data.category_id);
    if (!category) {
      const error = new Error("Kategori tidak ditemukan");
      error.statusCode = 422;
      error.code = "VALIDATION_ERROR";
      throw error;
    }

    return await MenuItemRepository.create(data);
  },

  async updateMenuItem(id, data) {
    const menuItem = await MenuItemRepository.findById(id);
    if (!menuItem) {
      const error = new Error("Menu item tidak ditemukan");
      error.statusCode = 404;
      error.code = "NOT_FOUND";
      throw error;
    }

    if (data.category_id) {
      const category = await CategoryRepository.findById(data.category_id);
      if (!category) {
        const error = new Error("Kategori tidak ditemukan");
        error.statusCode = 422;
        error.code = "VALIDATION_ERROR";
        throw error;
      }
    }

    return await MenuItemRepository.update(id, data);
  },

  async deleteMenuItem(id) {
    const menuItem = await MenuItemRepository.findById(id);
    if (!menuItem) {
      const error = new Error("Menu item tidak ditemukan");
      error.statusCode = 404;
      error.code = "NOT_FOUND";
      throw error;
    }

    const isOrdered = await MenuItemRepository.isOrdered(id);
    if (isOrdered) {
      const error = new Error("Menu sudah pernah dipesan — nonaktifkan saja");
      error.statusCode = 409;
      error.code = "MENU_ITEM_ORDERED";
      throw error;
    }

    await MenuItemRepository.delete(id);
  },

  async toggleAvailability(id) {
    const menuItem = await MenuItemRepository.findById(id);
    if (!menuItem) {
      const error = new Error("Menu item tidak ditemukan");
      error.statusCode = 404;
      error.code = "NOT_FOUND";
      throw error;
    }

    return await MenuItemRepository.toggleAvailability(id);
  },

  async getMenuForPublic(filters = {}) {
    return await MenuItemRepository.findAllGroupedByCategory(filters);
  }
};

export default MenuItemService;
