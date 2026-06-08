import db from "../databases/index.js";

const MenuItemRepository = {
  async findById(id) {
    const query = `
      SELECT id, category_id, name, description, price, image_url, is_available, is_featured, sort_order, created_at
      FROM menu_items
      WHERE id = $1
    `;
    const { rows } = await db.pool.query(query, [id]);
    return rows[0];
  },

  async findByIds(ids) {
    const query = `
      SELECT id, name, price, is_available, image_url
      FROM menu_items
      WHERE id = ANY($1)
    `;
    const { rows } = await db.pool.query(query, [ids]);
    return rows;
  }
};

export default MenuItemRepository;
