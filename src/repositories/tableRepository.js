import db from "../databases/index.js";

const TableRepository = {
  async findAll({ status, floor, limit = 20, offset = 0 }) {
    let query = `
      SELECT id, table_number, capacity, status, floor, description, qr_code_token, created_at, updated_at
      FROM tables
      WHERE 1=1
    `;
    const params = [];
    let paramIndex = 1;

    if (status) {
      query += ` AND status = $${paramIndex++}`;
      params.push(status);
    }

    if (floor !== undefined) {
      query += ` AND floor = $${paramIndex++}`;
      params.push(floor);
    }

    query += ` ORDER BY table_number ASC LIMIT $${paramIndex++} OFFSET $${paramIndex++}`;
    params.push(limit, offset);

    const { rows } = await db.pool.query(query, params);
    return rows;
  },

  async findById(id) {
    const query = `
      SELECT id, table_number, capacity, status, floor, description, qr_code_token, created_at, updated_at
      FROM tables
      WHERE id = $1
    `;
    const { rows } = await db.pool.query(query, [id]);
    return rows[0];
  },

  async findByToken(token) {
    const query = `
      SELECT id, table_number, capacity, floor, status
      FROM tables
      WHERE qr_code_token = $1
    `;
    const { rows } = await db.pool.query(query, [token]);
    return rows[0];
  },

  async findByTableNumber(tableNumber) {
    const query = `
      SELECT id, table_number FROM tables WHERE table_number = $1
    `;
    const { rows } = await db.pool.query(query, [tableNumber]);
    return rows[0];
  },

  async create({ table_number, capacity, floor, description }) {
    const query = `
      INSERT INTO tables (table_number, capacity, floor, description)
      VALUES ($1, $2, $3, $4)
      RETURNING id, table_number, capacity, status, floor, description, qr_code_token, created_at
    `;
    const { rows } = await db.pool.query(query, [table_number, capacity, floor || 1, description]);
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
      UPDATE tables
      SET ${fields.join(", ")}, updated_at = NOW()
      WHERE id = $${paramIndex}
      RETURNING id, table_number, capacity, status, floor, description, qr_code_token, updated_at
    `;

    const { rows } = await db.pool.query(query, params);
    return rows[0];
  },

  async delete(id) {
    const query = `DELETE FROM tables WHERE id = $1`;
    await db.pool.query(query, [id]);
  },

  async regenerateQR(id) {
    const query = `
      UPDATE tables
      SET qr_code_token = md5(random()::text || clock_timestamp()::text), updated_at = NOW()
      WHERE id = $1
      RETURNING qr_code_token
    `;
    const { rows } = await db.pool.query(query, [id]);
    return rows[0];
  },

  async hasActiveOrders(tableId) {
    const query = `
      SELECT COUNT(*) FROM orders 
      WHERE table_id = $1 AND status NOT IN ('completed', 'cancelled')
    `;
    const { rows } = await db.pool.query(query, [tableId]);
    return parseInt(rows[0].count) > 0;
  }
};

export default TableRepository;
