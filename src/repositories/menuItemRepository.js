import db from "../databases/index.js";

const MenuItemRepository = {
  async findAll({ category_id, is_available, search, limit = 20, offset = 0 } = {}) {
    let query = `
      SELECT m.*, 
             json_build_object('id', c.id, 'name', c.name) as category
      FROM menu_items m
      JOIN categories c ON m.category_id = c.id
      WHERE 1=1
    `;
    const params = [];
    let paramIndex = 1;

    if (category_id) {
      query += ` AND m.category_id = $${paramIndex++}`;
      params.push(category_id);
    }

    if (is_available !== undefined) {
      query += ` AND m.is_available = $${paramIndex++}`;
      params.push(is_available);
    }

    if (search) {
      query += ` AND (m.name ILIKE $${paramIndex} OR m.description ILIKE $${paramIndex})`;
      params.push(`%${search}%`);
      paramIndex++;
    }

    // Count total for pagination
    const countQuery = `SELECT COUNT(*) FROM (${query}) as subquery`;
    const { rows: countRows } = await db.pool.query(countQuery, params);
    const total = parseInt(countRows[0].count);

    query += ` ORDER BY m.sort_order ASC, m.name ASC LIMIT $${paramIndex++} OFFSET $${paramIndex++}`;
    params.push(limit, offset);

    const { rows } = await db.pool.query(query, params);
    return { rows, total };
  },

  async findById(id) {
    const query = `
      SELECT m.*, 
             json_build_object('id', c.id, 'name', c.name) as category
      FROM menu_items m
      JOIN categories c ON m.category_id = c.id
      WHERE m.id = $1
    `;
    const { rows } = await db.pool.query(query, [id]);
    return rows[0];
  },

  async findByIds(ids) {
    if (!ids || ids.length === 0) return [];
    const query = `
      SELECT m.*, 
             json_build_object('id', c.id, 'name', c.name) as category
      FROM menu_items m
      JOIN categories c ON m.category_id = c.id
      WHERE m.id = ANY($1)
    `;
    const { rows } = await db.pool.query(query, [ids]);
    return rows;
  },

  async create({ category_id, name, description, price, image_url, is_available, is_featured, sort_order }) {
    const query = `
      INSERT INTO menu_items (category_id, name, description, price, image_url, is_available, is_featured, sort_order)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING *
    `;
    const { rows } = await db.pool.query(query, [
      category_id,
      name,
      description,
      price,
      image_url,
      is_available !== undefined ? is_available : true,
      is_featured !== undefined ? is_featured : false,
      sort_order || 0
    ]);
    
    // Return with category info
    return this.findById(rows[0].id);
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
      UPDATE menu_items
      SET ${fields.join(", ")}, updated_at = NOW()
      WHERE id = $${paramIndex}
      RETURNING id
    `;

    const { rows } = await db.pool.query(query, params);
    if (rows.length === 0) return null;
    
    return this.findById(id);
  },

  async delete(id) {
    const query = `DELETE FROM menu_items WHERE id = $1`;
    await db.pool.query(query, [id]);
  },

  async isOrdered(id) {
    const query = `SELECT COUNT(*) FROM order_items WHERE menu_item_id = $1`;
    const { rows } = await db.pool.query(query, [id]);
    return parseInt(rows[0].count) > 0;
  },

  async toggleAvailability(id) {
    const query = `
      UPDATE menu_items
      SET is_available = NOT is_available, updated_at = NOW()
      WHERE id = $1
      RETURNING id, is_available
    `;
    const { rows } = await db.pool.query(query, [id]);
    return rows[0];
  },

  async findAllGroupedByCategory({ search, is_featured } = {}) {
    let query = `
      SELECT 
        c.id as category_id, 
        c.name as category_name, 
        c.image_url as category_image_url,
        c.sort_order as category_sort_order,
        json_agg(
          json_build_object(
            'id', m.id,
            'name', m.name,
            'description', m.description,
            'price', m.price,
            'image_url', m.image_url,
            'is_available', m.is_available,
            'is_featured', m.is_featured,
            'sort_order', m.sort_order,
            'category', json_build_object('id', c.id, 'name', c.name)
          ) ORDER BY m.sort_order ASC, m.name ASC
        ) as items
      FROM categories c
      JOIN menu_items m ON c.id = m.category_id
      WHERE m.is_available = TRUE AND c.is_active = TRUE
    `;
    const params = [];
    let paramIndex = 1;

    if (search) {
      query += ` AND (m.name ILIKE $${paramIndex} OR m.description ILIKE $${paramIndex})`;
      params.push(`%${search}%`);
      paramIndex++;
    }

    if (is_featured !== undefined) {
      query += ` AND m.is_featured = $${paramIndex++}`;
      params.push(is_featured);
    }

    query += ` GROUP BY c.id ORDER BY c.sort_order ASC, c.name ASC`;

    const { rows } = await db.pool.query(query, params);
    
    // Transform to match API spec
    return rows.map(row => ({
      category: {
        id: row.category_id,
        name: row.category_name,
        image_url: row.category_image_url
      },
      items: row.items
    }));
  }
};

export default MenuItemRepository;
