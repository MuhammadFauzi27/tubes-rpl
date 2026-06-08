import MenuItemService from "../services/menuItemService.js";

const MenuItemController = {
  async getAll(req, res, next) {
    try {
      const filters = {
        category_id: req.query.category_id,
        is_available: req.query.is_available === undefined ? undefined : req.query.is_available === "true",
        search: req.query.search,
        page: req.query.page,
        per_page: req.query.per_page
      };

      const result = await MenuItemService.getAllMenuItems(filters);
      res.json({
        success: true,
        data: result.data,
        meta: result.meta
      });
    } catch (error) {
      next(error);
    }
  },

  async getById(req, res, next) {
    try {
      const menuItem = await MenuItemService.getMenuItemById(req.params.id);
      res.json({
        success: true,
        data: menuItem
      });
    } catch (error) {
      next(error);
    }
  },

  async create(req, res, next) {
    try {
      const menuItem = await MenuItemService.createMenuItem(req.body);
      res.status(201).json({
        success: true,
        data: menuItem
      });
    } catch (error) {
      next(error);
    }
  },

  async update(req, res, next) {
    try {
      const menuItem = await MenuItemService.updateMenuItem(req.params.id, req.body);
      res.json({
        success: true,
        data: menuItem
      });
    } catch (error) {
      next(error);
    }
  },

  async delete(req, res, next) {
    try {
      await MenuItemService.deleteMenuItem(req.params.id);
      res.json({
        success: true,
        message: "Operasi berhasil"
      });
    } catch (error) {
      next(error);
    }
  },

  async toggleAvailability(req, res, next) {
    try {
      const result = await MenuItemService.toggleAvailability(req.params.id);
      res.json({
        success: true,
        data: result
      });
    } catch (error) {
      next(error);
    }
  }
};

export default MenuItemController;
