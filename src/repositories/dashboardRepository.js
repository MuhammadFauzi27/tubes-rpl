import db from "../databases/index.js";

const DashboardRepository = {
  async getTodaySummary() {
    const query = `
      SELECT
        (SELECT COUNT(*) FROM orders WHERE DATE(created_at) = CURRENT_DATE) as total_orders,
        (SELECT COUNT(*) FROM orders WHERE DATE(created_at) = CURRENT_DATE AND status = 'completed') as completed_orders,
        (SELECT COUNT(*) FROM orders WHERE DATE(created_at) = CURRENT_DATE AND status = 'cancelled') as cancelled_orders,
        COALESCE((SELECT total_pendapatan FROM v_daily_revenue WHERE tanggal = CURRENT_DATE), 0) as total_revenue
    `;
    const { rows } = await db.pool.query(query);
    return {
      total_orders: parseInt(rows[0].total_orders),
      completed_orders: parseInt(rows[0].completed_orders),
      cancelled_orders: parseInt(rows[0].cancelled_orders),
      total_revenue: parseFloat(rows[0].total_revenue)
    };
  },

  async getActiveOrdersCount() {
    const query = `
      SELECT status, COUNT(*) as count
      FROM orders
      WHERE status NOT IN ('completed', 'cancelled')
      GROUP BY status
    `;
    const { rows } = await db.pool.query(query);
    const counts = {
      pending: 0,
      confirmed: 0,
      processing: 0,
      ready: 0,
      delivered: 0
    };
    rows.forEach(row => {
      counts[row.status] = parseInt(row.count);
    });
    return counts;
  },

  async getRecentOrders(limit = 5) {
    const query = `
      SELECT o.id, o.order_number, t.table_number, o.status, o.total, o.created_at, o.updated_at,
             (SELECT COUNT(*) FROM order_items WHERE order_id = o.id) as item_count
      FROM orders o
      JOIN tables t ON o.table_id = t.id
      ORDER BY o.created_at DESC
      LIMIT $1
    `;
    const { rows } = await db.pool.query(query, [limit]);
    return rows;
  },

  async getRevenueStats(startDate, endDate) {
    const query = `
      SELECT
        SUM(total_pendapatan) as total_revenue,
        SUM(total_orders) as total_orders
      FROM v_daily_revenue
      WHERE tanggal BETWEEN $1 AND $2
    `;
    const { rows } = await db.pool.query(query, [startDate, endDate]);
    return {
      total_revenue: parseFloat(rows[0].total_revenue || 0),
      total_orders: parseInt(rows[0].total_orders || 0)
    };
  },

  async getDailyTransactions(startDate, endDate) {
    const query = `
      WITH date_range AS (
        SELECT generate_series($1::date, $2::date, '1 day')::date as date
      )
      SELECT
        dr.date,
        COALESCE(vr.successful_transactions, 0) as successful_transactions,
        COALESCE(vr.total_pendapatan, 0) as revenue
      FROM date_range dr
      LEFT JOIN v_daily_revenue vr ON dr.date = vr.tanggal
      ORDER BY dr.date ASC
    `;
    const { rows } = await db.pool.query(query, [startDate, endDate]);
    return rows.map(row => ({
      date: row.date.toISOString().split('T')[0],
      successful_transactions: parseInt(row.successful_transactions),
      revenue: parseFloat(row.revenue)
    }));
  },

  async getTopMenuItems(startDate, endDate, limit = 10) {
    const query = `
      SELECT
        menu_item_id,
        name,
        image_url,
        category_name,
        SUM(total_qty) as total_qty,
        SUM(total_revenue) as total_revenue
      FROM v_top_menu_items
      WHERE tanggal BETWEEN $1 AND $2
      GROUP BY menu_item_id, name, image_url, category_name
      ORDER BY total_qty DESC
      LIMIT $3
    `;
    const { rows } = await db.pool.query(query, [startDate, endDate, limit]);
    return rows.map((row, index) => ({
      rank: index + 1,
      ...row,
      total_qty: parseInt(row.total_qty),
      total_revenue: parseFloat(row.total_revenue)
    }));
  }
};

export default DashboardRepository;
