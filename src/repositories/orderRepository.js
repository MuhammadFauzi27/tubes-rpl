import db from "../databases/index.js";

const OrderRepository = {
  async findAll({ status, date, limit = 20, offset = 0 }) {
    let query = `
      SELECT o.id, o.order_number, t.table_number, o.status, o.total, o.created_at, o.updated_at,
             (SELECT COUNT(*) FROM order_items WHERE order_id = o.id) as item_count
      FROM orders o
      JOIN tables t ON o.table_id = t.id
      WHERE 1=1
    `;
    const params = [];
    let paramIndex = 1;

    if (status) {
      const statuses = status.split(',');
      query += ` AND o.status = ANY($${paramIndex++})`;
      params.push(statuses);
    }

    if (date) {
      query += ` AND DATE(o.created_at) = $${paramIndex++}`;
      params.push(date);
    } else {
      query += ` AND DATE(o.created_at) = CURRENT_DATE`;
    }

    query += ` ORDER BY o.created_at DESC LIMIT $${paramIndex++} OFFSET $${paramIndex++}`;
    params.push(limit, offset);

    const { rows } = await db.pool.query(query, params);
    return rows;
  },

  async countAll({ status, date }) {
    let query = `SELECT COUNT(*) FROM orders o WHERE 1=1`;
    const params = [];
    let paramIndex = 1;

    if (status) {
      const statuses = status.split(',');
      query += ` AND o.status = ANY($${paramIndex++})`;
      params.push(statuses);
    }

    if (date) {
      query += ` AND DATE(o.created_at) = $${paramIndex++}`;
      params.push(date);
    } else {
      query += ` AND DATE(o.created_at) = CURRENT_DATE`;
    }

    const { rows } = await db.pool.query(query, params);
    return parseInt(rows[0].count);
  },

  async findById(id) {
    const query = `
      SELECT o.id, o.order_number, o.status, o.customer_note, o.subtotal, o.tax_rate, o.tax_amount, o.total, o.created_at, o.updated_at,
             t.id as table_id, t.table_number, t.capacity, t.floor,
             p.id as payment_id, p.payment_method, p.payment_status, p.amount as payment_amount, p.transaction_ref, p.qris_data, p.paid_at
      FROM orders o
      JOIN tables t ON o.table_id = t.id
      LEFT JOIN payments p ON p.order_id = o.id
      WHERE o.id = $1
    `;
    const { rows } = await db.pool.query(query, [id]);
    return rows[0];
  },

  async findItemsByOrderId(orderId) {
    const query = `
      SELECT oi.id, oi.menu_item_id, oi.quantity, oi.unit_price, oi.subtotal, oi.note,
             m.name as menu_name, m.image_url as menu_image
      FROM order_items oi
      JOIN menu_items m ON oi.menu_item_id = m.id
      WHERE oi.order_id = $1
    `;
    const { rows } = await db.pool.query(query, [orderId]);
    return rows;
  },

  async create(orderData, items) {
    const client = await db.pool.connect();
    try {
      await client.query('BEGIN');

      const orderQuery = `
        INSERT INTO orders (table_id, customer_note, tax_rate)
        VALUES ($1, $2, $3)
        RETURNING id, order_number, status, customer_note, subtotal, tax_rate, tax_amount, total, created_at, updated_at
      `;
      const { rows: orderRows } = await client.query(orderQuery, [
        orderData.table_id,
        orderData.customer_note,
        orderData.tax_rate || 0.11
      ]);
      const order = orderRows[0];

      for (const item of items) {
        const itemQuery = `
          INSERT INTO order_items (order_id, menu_item_id, quantity, unit_price, subtotal, note)
          VALUES ($1, $2, $3, $4, $5, $6)
        `;
        await client.query(itemQuery, [
          order.id,
          item.menu_item_id,
          item.quantity,
          item.unit_price,
          item.quantity * item.unit_price,
          item.note
        ]);
      }

      // The triggers in the database (fn_recalc_order_total) will update the order totals.
      // We need to fetch the updated order data.
      const updatedOrderQuery = `SELECT * FROM orders WHERE id = $1`;
      const { rows: updatedOrderRows } = await client.query(updatedOrderQuery, [order.id]);

      await client.query('COMMIT');
      return updatedOrderRows[0];
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  },

  async updateStatus(id, status, note = null, changedBy = null) {
    const client = await db.pool.connect();
    try {
      await client.query('BEGIN');

      const oldOrderQuery = `SELECT status FROM orders WHERE id = $1 FOR UPDATE`;
      const { rows: oldOrderRows } = await client.query(oldOrderQuery, [id]);
      if (oldOrderRows.length === 0) {
        throw new Error("Pesanan tidak ditemukan");
      }
      const oldStatus = oldOrderRows[0].status;

      const updateQuery = `
        UPDATE orders
        SET status = $1, updated_at = NOW()
        WHERE id = $2
        RETURNING id, order_number, status, total, created_at, updated_at
      `;
      const { rows: updateRows } = await client.query(updateQuery, [status, id]);
      const updatedOrder = updateRows[0];

      // Manually insert into order_status_logs to include note and changed_by
      // Note: This might cause a duplicate if the trigger trg_order_status_log is also active.
      // But we need this to save the note and changed_by which the trigger doesn't handle.
      if (oldStatus !== status) {
        const logQuery = `
          INSERT INTO order_status_logs (order_id, old_status, new_status, note, changed_by)
          VALUES ($1, $2, $3, $4, $5)
        `;
        await client.query(logQuery, [id, oldStatus, status, note, changedBy]);
      }

      const itemCountQuery = `SELECT COUNT(*)::int as item_count FROM order_items WHERE order_id = $1`;
      const { rows: itemCountRows } = await client.query(itemCountQuery, [id]);
      updatedOrder.item_count = itemCountRows[0].item_count;

      const tableNumberQuery = `SELECT table_number FROM tables WHERE id = (SELECT table_id FROM orders WHERE id = $1)`;
      const { rows: tableRows } = await client.query(tableNumberQuery, [id]);
      updatedOrder.table_number = tableRows[0].table_number;

      await client.query('COMMIT');
      return updatedOrder;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  },

  async getStatus(id) {
    const query = `
      SELECT id as order_id, order_number, status, updated_at
      FROM orders
      WHERE id = $1
    `;
    const { rows } = await db.pool.query(query, [id]);
    return rows[0];
  }
};

export default OrderRepository;
