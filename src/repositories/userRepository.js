import db from "../databases/index.js";

const UserRepository = {
  async findAll({ role, is_active, limit = 20, offset = 0 }) {
    let query = `
      SELECT id, name, email, role, is_active, last_login_at, created_at, updated_at
      FROM users
      WHERE 1=1
    `;
    const params = [];
    let paramIndex = 1;

    if (role) {
      query += ` AND role = $${paramIndex++}`;
      params.push(role);
    }

    if (is_active !== undefined) {
      query += ` AND is_active = $${paramIndex++}`;
      params.push(is_active);
    }

    query += ` ORDER BY created_at DESC LIMIT $${paramIndex++} OFFSET $${paramIndex++}`;
    params.push(limit, offset);

    const { rows } = await db.pool.query(query, params);
    return rows;
  },

  async countAll({ role, is_active }) {
    let query = `SELECT COUNT(*) FROM users WHERE 1=1`;
    const params = [];
    let paramIndex = 1;

    if (role) {
      query += ` AND role = $${paramIndex++}`;
      params.push(role);
    }

    if (is_active !== undefined) {
      query += ` AND is_active = $${paramIndex++}`;
      params.push(is_active);
    }

    const { rows } = await db.pool.query(query, params);
    return parseInt(rows[0].count);
  },

  async findById(id) {
    const query = `
      SELECT id, name, email, role, is_active, last_login_at, created_at, updated_at
      FROM users
      WHERE id = $1
    `;
    const { rows } = await db.pool.query(query, [id]);
    return rows[0];
  },

  async findByEmail(email) {
    const query = `
      SELECT id, name, email, password_hash, role, is_active, last_login_at
      FROM users
      WHERE email = $1
    `;
    const { rows } = await db.pool.query(query, [email]);
    return rows[0];
  },

  async create({ name, email, password_hash, role }) {
    const query = `
      INSERT INTO users (name, email, password_hash, role)
      VALUES ($1, $2, $3, $4)
      RETURNING id, name, email, role, is_active, created_at
    `;
    const { rows } = await db.pool.query(query, [name, email, password_hash, role]);
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
      UPDATE users
      SET ${fields.join(", ")}, updated_at = NOW()
      WHERE id = $${paramIndex}
      RETURNING id, name, email, role, is_active, updated_at
    `;

    const { rows } = await db.pool.query(query, params);
    return rows[0];
  },

  async updateLastLogin(id) {
    const query = `UPDATE users SET last_login_at = NOW() WHERE id = $1`;
    await db.pool.query(query, [id]);
  },

  async updatePassword(id, passwordHash) {
    const query = `UPDATE users SET password_hash = $1, updated_at = NOW() WHERE id = $2`;
    await db.pool.query(query, [passwordHash, id]);
  }
};

export default UserRepository;
