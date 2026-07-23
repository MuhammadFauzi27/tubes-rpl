export const shorthands = undefined;

export const up = (pgm) => {
  pgm.createTable('order_status_logs', {
    id:         { type: 'uuid',         primaryKey: true, default: pgm.func('gen_random_uuid()') },
    order_id:   { type: 'uuid',         notNull: true, references: 'orders', onDelete: 'CASCADE' },
    // changed_by: NULL jika perubahan dilakukan oleh sistem (webhook) atau pelanggan
    changed_by: { type: 'uuid',         references: 'users', onDelete: 'SET NULL' },
    old_status: { type: 'order_status' },
    new_status: { type: 'order_status', notNull: true },
    note:       { type: 'VARCHAR(300)' },
    changed_at: { type: 'TIMESTAMP',    notNull: true, default: pgm.func('now()') },
  });

  // Pasang trigger fn_log_order_status yang didefinisikan di 06_orders.js
  // (harus dipasang di sini karena tabel order_status_logs baru ada sekarang)
  pgm.createTrigger('orders', 'trg_order_status_log', {
    when: 'AFTER', operation: 'UPDATE', level: 'ROW',
    function: 'fn_log_order_status',
  });

  pgm.createIndex('order_status_logs', 'order_id',   { name: 'idx_status_logs_order' });
  pgm.createIndex('order_status_logs', 'changed_at', { name: 'idx_status_logs_time', method: 'btree', reverse: true });
  pgm.createIndex('order_status_logs', 'changed_by', { name: 'idx_status_logs_user' });

  pgm.sql("COMMENT ON TABLE  order_status_logs            IS 'Audit trail setiap perubahan status pesanan'");
  pgm.sql("COMMENT ON COLUMN order_status_logs.changed_by IS 'NULL = perubahan oleh sistem (webhook) atau pelanggan, UUID = admin'");
  pgm.sql("COMMENT ON COLUMN order_status_logs.note       IS 'Catatan opsional yang dikirim admin saat PATCH /orders/{id}/status'");
};

export const down = (pgm) => {
  pgm.dropTrigger('orders', 'trg_order_status_log');
  pgm.dropTable('order_status_logs');
};
