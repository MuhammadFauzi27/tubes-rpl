import MenuItemService from "../services/menuItemService.js";

const MenuController = {
  async getPublicMenu(req, res, next) {
    try {
      const filters = {
        search: req.query.search,
        is_featured: req.query.is_featured === undefined ? undefined : req.query.is_featured === "true"
      };

      const menu = await MenuItemService.getMenuForPublic(filters);
      res.json({
        success: true,
        data: menu
      });
    } catch (error) {
      next(error);
    }
  }
};

export default MenuController;
