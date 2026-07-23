export const shorthands = undefined;

export const up = (pgm) => {
  pgm.sql(`

    -- ─────────────────────────────────────────────────────────────────────────
    -- v_active_orders
    -- Digunakan oleh: GET /orders (Live Orders admin, filter hari ini + status)
    --                 GET /dashboard/summary (active_orders_count + recent_orders)
    -- ─────────────────────────────────────────────────────────────────────────
    CREATE OR REPLACE VIEW v_active_orders AS
    SELECT
        o.id,
        o.order_number,
        o.status,
        o.customer_note,
        o.subtotal,
        o.tax_amount,
        o.total,
        o.created_at,
        o.updated_at,
        t.table_number,
        t.floor,
        COUNT(oi.id)      AS item_count,
        SUM(oi.quantity)  AS total_qty
    FROM orders o
    JOIN tables      t  ON t.id = o.table_id
    JOIN order_items oi ON oi.order_id = o.id
    WHERE o.status NOT IN ('completed', 'cancelled')
    GROUP BY o.id, o.order_number, o.status, o.customer_note,
             o.subtotal, o.tax_amount, o.total, o.created_at, o.updated_at,
             t.table_number, t.floor
    ORDER BY o.created_at DESC;


    -- ─────────────────────────────────────────────────────────────────────────
    -- v_order_details
    -- Digunakan oleh: GET /orders/{id} (detail pesanan — admin & pelanggan)
    -- ─────────────────────────────────────────────────────────────────────────
    CREATE OR REPLACE VIEW v_order_details AS
    SELECT
        o.id              AS order_id,
        o.order_number,
        o.status          AS order_status,
        o.customer_note,
        o.subtotal        AS order_subtotal,
        o.tax_rate,
        o.tax_amount,
        o.total           AS order_total,
        o.created_at,
        o.updated_at,
        t.id              AS table_id,
        t.table_number,
        t.floor,
        t.capacity,
        oi.id             AS item_id,
        oi.quantity,
        oi.unit_price,
        oi.subtotal       AS item_subtotal,
        oi.note           AS item_note,
        mi.id             AS menu_item_id,
        mi.name           AS item_name,
        mi.image_url      AS item_image_url,
        c.id              AS category_id,
        c.name            AS category_name,
        p.id              AS payment_id,
        p.payment_method,
        p.payment_status,
        p.amount          AS payment_amount,
        p.transaction_ref,
        p.qris_data,
        p.ewallet_provider,
        p.paid_at
    FROM orders o
    JOIN tables      t   ON t.id  = o.table_id
    JOIN order_items oi  ON oi.order_id = o.id
    JOIN menu_items  mi  ON mi.id = oi.menu_item_id
    JOIN categories  c   ON c.id  = mi.category_id
    LEFT JOIN payments p ON p.order_id = o.id
    ORDER BY o.created_at DESC, oi.created_at;


    -- ─────────────────────────────────────────────────────────────────────────
    -- v_daily_revenue
    -- Digunakan oleh: GET /dashboard/revenue-stats (grafik 7 hari)
    --                 GET /dashboard/summary (total revenue hari ini)
    -- Hanya menghitung transaksi dengan payment_status = 'paid'
    -- ─────────────────────────────────────────────────────────────────────────
    CREATE OR REPLACE VIEW v_daily_revenue AS
    SELECT
        DATE(p.paid_at)              AS tanggal,
        COUNT(DISTINCT o.id)         AS total_orders,
        COUNT(DISTINCT p.id)         AS successful_transactions,
        SUM(o.subtotal)              AS total_subtotal,
        SUM(o.tax_amount)            AS total_pajak,
        SUM(o.total)                 AS total_pendapatan,
        COUNT(DISTINCT p.id) FILTER (WHERE p.payment_method = 'qris')    AS bayar_qris,
        COUNT(DISTINCT p.id) FILTER (WHERE p.payment_method = 'ewallet') AS bayar_ewallet
    FROM payments p
    JOIN orders o ON o.id = p.order_id
    WHERE p.payment_status = 'paid'
    GROUP BY DATE(p.paid_at)
    ORDER BY tanggal DESC;


    -- ─────────────────────────────────────────────────────────────────────────
    -- v_top_menu_items
    -- Digunakan oleh: GET /dashboard/revenue-stats (top_menu_items — 7 hari)
    -- Query ini tidak perlu real-time, cukup dijalankan sekali saat page load.
    -- Backend memfilter WHERE tanggal >= NOW() - INTERVAL '7 days' saat query.
    -- ─────────────────────────────────────────────────────────────────────────
    CREATE OR REPLACE VIEW v_top_menu_items AS
    SELECT
        mi.id                         AS menu_item_id,
        mi.name,
        mi.image_url,
        c.name                        AS category_name,
        SUM(oi.quantity)              AS total_qty,
        SUM(oi.subtotal)              AS total_revenue,
        DATE(p.paid_at)               AS tanggal
    FROM order_items oi
    JOIN menu_items  mi ON mi.id = oi.menu_item_id
    JOIN categories  c  ON c.id  = mi.category_id
    JOIN orders      o  ON o.id  = oi.order_id
    JOIN payments    p  ON p.order_id = o.id
    WHERE p.payment_status = 'paid'
    GROUP BY mi.id, mi.name, mi.image_url, c.name, DATE(p.paid_at)
    ORDER BY total_qty DESC;


    -- ─────────────────────────────────────────────────────────────────────────
    -- v_menu_by_category
    -- Digunakan oleh: GET /menu (landing page pelanggan — grouped by category)
    -- ─────────────────────────────────────────────────────────────────────────
    CREATE OR REPLACE VIEW v_menu_by_category AS
    SELECT
        c.id            AS category_id,
        c.name          AS category_name,
        c.image_url     AS category_image_url,
        c.sort_order    AS category_sort_order,
        mi.id           AS item_id,
        mi.name         AS item_name,
        mi.description,
        mi.price,
        mi.image_url    AS item_image_url,
        mi.is_featured,
        mi.sort_order   AS item_sort_order
    FROM categories c
    JOIN menu_items mi ON mi.category_id = c.id
    WHERE c.is_active  = TRUE
      AND mi.is_available = TRUE
    ORDER BY c.sort_order, mi.sort_order;

  `);
};

export const down = (pgm) => {
  pgm.sql(`
    DROP VIEW IF EXISTS v_menu_by_category;
    DROP VIEW IF EXISTS v_top_menu_items;
    DROP VIEW IF EXISTS v_daily_revenue;
    DROP VIEW IF EXISTS v_order_details;
    DROP VIEW IF EXISTS v_active_orders;
  `);
};
