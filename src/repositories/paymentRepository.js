import db from "../databases/index.js";

const PaymentRepository = {
  async create({ order_id, payment_method, amount, ewallet_provider, qris_data, notes }) {
    const query = `
      INSERT INTO payments (order_id, payment_method, amount, ewallet_provider, qris_data, notes)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *
    `;
    const { rows } = await db.pool.query(query, [
      order_id,
      payment_method,
      amount,
      ewallet_provider,
      qris_data,
      notes
    ]);
    return rows[0];
  },

  async findById(id) {
    const query = `SELECT * FROM payments WHERE id = $1`;
    const { rows } = await db.pool.query(query, [id]);
    return rows[0];
  },

  async findByOrderId(orderId) {
    const query = `SELECT * FROM payments WHERE order_id = $1`;
    const { rows } = await db.pool.query(query, [orderId]);
    return rows[0];
  },

  async findByTransactionRef(ref) {
    const query = `SELECT * FROM payments WHERE transaction_ref = $1`;
    const { rows } = await db.pool.query(query, [ref]);
    return rows[0];
  },

  async updateStatus(id, { status, transaction_ref, notes }) {
    const fields = ['payment_status = $1', 'updated_at = NOW()'];
    const params = [status];
    let paramIndex = 2;

    if (transaction_ref) {
      fields.push(`transaction_ref = $${paramIndex++}`);
      params.push(transaction_ref);
    }

    if (notes) {
      fields.push(`notes = $${paramIndex++}`);
      params.push(notes);
    }

    params.push(id);
    const query = `
      UPDATE payments
      SET ${fields.join(', ')}
      WHERE id = $${paramIndex}
      RETURNING *
    `;

    const { rows } = await db.pool.query(query, params);
    return rows[0];
  }
};

export default PaymentRepository;
