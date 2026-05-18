export const shorthands = undefined;

export const up = (pgm) => {
  pgm.sql(`
    -- Tampilan ringkasan pesanan aktif (untuk kasir & waiter)
    CREATE OR REPLACE VIEW v_active_orders AS
    SELECT
        o.id,
        o.order_number,
        o.status,
        o.created_at,
        o.updated_at,
        o.total,
        o.customer_note,
        t.table_number,
        t.floor,
        COUNT(oi.id)        AS total_items,
        SUM(oi.quantity)    AS total_qty
    FROM orders o
             JOIN tables      t  ON t.id = o.table_id
             JOIN order_items oi ON oi.order_id = o.id
    WHERE o.status NOT IN ('completed', 'cancelled')
    GROUP BY o.id, t.table_number, t.floor
    ORDER BY o.created_at;

    -- Detail order lengkap beserta item-itemnya
    CREATE OR REPLACE VIEW v_order_details AS
    SELECT
        o.id            AS order_id,
        o.order_number,
        o.status        AS order_status,
        o.created_at,
        t.table_number,
        mi.name         AS item_name,
        c.name          AS category_name,
        oi.quantity,
        oi.unit_price,
        oi.subtotal,
        oi.note         AS item_note,
        o.subtotal      AS order_subtotal,
        o.tax_amount,
        o.total         AS order_total,
        p.payment_method,
        p.payment_status,
        p.paid_at
    FROM orders o
             JOIN tables      t   ON t.id = o.table_id
             JOIN order_items oi  ON oi.order_id = o.id
             JOIN menu_items  mi  ON mi.id = oi.menu_item_id
             JOIN categories  c   ON c.id = mi.category_id
             LEFT JOIN payments p ON p.order_id = o.id
    ORDER BY o.created_at DESC, oi.id;

    -- Rekapitulasi penjualan harian
    CREATE OR REPLACE VIEW v_daily_sales AS
    SELECT
        DATE(o.created_at)          AS tanggal,
        COUNT(DISTINCT o.id)        AS total_orders,
        SUM(o.subtotal)             AS total_subtotal,
        SUM(o.tax_amount)             AS total_pajak,
        SUM(o.total)                AS total_pendapatan,
        COUNT(DISTINCT p.id) FILTER (WHERE p.payment_status = 'paid') AS orders_terbayar,
        COUNT(DISTINCT p.id) FILTER (WHERE p.payment_method = 'cash')  AS bayar_cash,
        COUNT(DISTINCT p.id) FILTER (WHERE p.payment_method = 'qris')  AS bayar_qris
    FROM orders o
        LEFT JOIN payments p ON p.order_id = o.id
    WHERE o.status = 'completed'
    GROUP BY DATE(o.created_at)
    ORDER BY tanggal DESC;
  `);
};

export const down = (pgm) => {
  pgm.sql(`
    DROP VIEW IF EXISTS v_daily_sales;
    DROP VIEW IF EXISTS v_order_details;
    DROP VIEW IF EXISTS v_active_orders;
  `);
};
