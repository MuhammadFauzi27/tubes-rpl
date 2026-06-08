import db from "../databases/index.js";

const CategoryRepository = {
  async findAll({ is_active }) {
    let query = `
      SELECT c.id, c.name, c.description, c.image_url, c.sort_order, c.is_active, c.created_at,
             (SELECT COUNT(*) FROM menu_items WHERE category_id = c.id AND is_available = true) as item_count
      FROM categories c
      WHERE 1=1
    `;
    const params = [];
    let paramIndex = 1;

    if (is_active !== undefined) {
      query += ` AND c.is_active = $${paramIndex++}`;
      params.push(is_active);
    }

    query += ` ORDER BY c.sort_order ASC, c.name ASC`;

    const { rows } = await db.pool.query(query, params);
    return rows;
  },

  async findById(id) {
    const query = `
      SELECT c.id, c.name, c.description, c.image_url, c.sort_order, c.is_active, c.created_at,
             (SELECT COUNT(*) FROM menu_items WHERE category_id = c.id AND is_available = true) as item_count
      FROM categories c
      WHERE c.id = $1
    `;
    const { rows } = await db.pool.query(query, [id]);
    return rows[0];
  },

  async findByName(name) {
    const query = `SELECT id, name FROM categories WHERE name = $1`;
    const { rows } = await db.pool.query(query, [name]);
    return rows[0];
  },

  async create({ name, description, image_url, sort_order }) {
    const query = `
      INSERT INTO categories (name, description, image_url, sort_order)
      VALUES ($1, $2, $3, $4)
      RETURNING id, name, description, image_url, sort_order, is_active, created_at
    `;
    const { rows } = await db.pool.query(query, [name, description, image_url, sort_order || 0]);
    return rows[0];
  },

  async update(id, data) {
    const fields = [];
    const params = [];
    let paramIndex = 1;

    Object.entries(data).forEach(([key, value]) => {
      if (value !== undefined) {
        fields.push(`${key} = $${paramIndex++}`);
        params.push(value);
      }
    });

    if (fields.length === 0) return null;

    params.push(id);
    const query = `
      UPDATE categories
      SET ${fields.join(", ")}
      WHERE id = $${paramIndex}
      RETURNING id, name, description, image_url, sort_order, is_active, created_at
    `;

    const { rows } = await db.pool.query(query, params);
    return rows[0];
  },

  async delete(id) {
    const query = `DELETE FROM categories WHERE id = $1`;
    await db.pool.query(query, [id]);
  },

  async hasMenuItems(categoryId) {
    const query = `SELECT COUNT(*) FROM menu_items WHERE category_id = $1 AND is_available = true`;
    const { rows } = await db.pool.query(query, [categoryId]);
    return parseInt(rows[0].count) > 0;
  }
};

export default CategoryRepository;
