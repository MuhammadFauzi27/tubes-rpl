export const queries = {
  // 1. Pelanggan scan QR → cari meja berdasarkan token
  scanQR: `
    SELECT id, table_number, status, capacity
    FROM tables
    WHERE qr_code_token = $1 AND status != 'reserved';
  `,

  // 2. Tampilkan menu aktif per kategori
  getMenu: `
    SELECT c.name AS kategori, mi.id, mi.name, mi.price, mi.image_url, mi.is_available
    FROM menu_items mi
    JOIN categories c ON c.id = mi.category_id
    WHERE c.is_active = TRUE AND mi.is_available = TRUE
    ORDER BY c.sort_order, mi.sort_order;
  `,

  // 3. Buat order baru
  createOrder: `
    INSERT INTO orders (table_id, customer_note)
    VALUES ($1, $2)
    RETURNING id, order_number;
  `,

  // 4. Tambah item ke order
  addItemToOrder: `
    INSERT INTO order_items (order_id, menu_item_id, quantity, unit_price, subtotal, note)
    SELECT $1, id, $2, price, price * $2, $3
    FROM menu_items WHERE id = $4;
  `,

  // 5. Kasir: lihat semua order aktif
  getActiveOrders: `
    SELECT * FROM v_active_orders;
  `,

  // 6. Kasir: ubah status pesanan
  updateOrderStatus: `
    UPDATE orders SET status = $1 WHERE id = $2;
  `,

  // 7. Waiter: lihat order yang siap diantar (status = ready)
  getReadyOrders: `
    SELECT o.order_number, t.table_number, t.floor
    FROM orders o JOIN tables t ON t.id = o.table_id
    WHERE o.status = 'ready'
    ORDER BY o.updated_at;
  `,

  // 8. Kasir: proses pembayaran
  processPayment: `
    INSERT INTO payments (order_id, processed_by, payment_method, amount, payment_status)
    VALUES ($1, $2, $3, $4, 'paid');
  `,

  // 9. Rekap penjualan hari ini
  getDailySales: `
    SELECT * FROM v_daily_sales WHERE tanggal = CURRENT_DATE;
  `,

  // 10. Riwayat perubahan status order
  getStatusLogs: `
    SELECT old_status, new_status, changed_at, u.name AS diubah_oleh
    FROM order_status_logs osl
    LEFT JOIN users u ON u.id = osl.changed_by
    WHERE osl.order_id = $1
    ORDER BY changed_at;
  `
};
