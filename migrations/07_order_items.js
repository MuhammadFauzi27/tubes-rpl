export const shorthands = undefined;

export const up = (pgm) => {
  pgm.createTable('order_items', {
    id:           { type: 'uuid',          primaryKey: true, default: pgm.func('gen_random_uuid()') },
    order_id:     { type: 'uuid',          notNull: true, references: 'orders',     onDelete: 'CASCADE'  },
    menu_item_id: { type: 'uuid',          notNull: true, references: 'menu_items', onDelete: 'RESTRICT' },
    quantity:     { type: 'SMALLINT',      notNull: true, check: 'quantity > 0' },
    unit_price:   { type: 'NUMERIC(12,2)', notNull: true },
    subtotal:     { type: 'NUMERIC(14,2)', notNull: true },
    note:         { type: 'VARCHAR(300)' },
    created_at:   { type: 'TIMESTAMP',     notNull: true, default: pgm.func('now()') },
    // Tidak ada updated_at — order_items tidak bisa diedit setelah dibuat
  });

  // ── Recalculate subtotal / tax / total pada orders setiap kali order_items berubah ──
  pgm.createFunction(
    'fn_recalc_order_total', [],
    { returns: 'TRIGGER', language: 'plpgsql', replace: true },
    `
    DECLARE
        v_order_id   UUID;
        v_subtotal   NUMERIC(14,2);
        v_tax_rate   NUMERIC(5,4);
        v_tax_amount NUMERIC(14,2);
    BEGIN
        v_order_id := COALESCE(NEW.order_id, OLD.order_id);

        SELECT COALESCE(SUM(oi.subtotal), 0), o.tax_rate
        INTO   v_subtotal, v_tax_rate
        FROM   orders o
        LEFT JOIN order_items oi ON oi.order_id = o.id
        WHERE  o.id = v_order_id
        GROUP  BY o.tax_rate;

        v_tax_amount := ROUND(v_subtotal * v_tax_rate, 2);

        UPDATE orders SET
            subtotal   = v_subtotal,
            tax_amount = v_tax_amount,
            total      = v_subtotal + v_tax_amount
        WHERE id = v_order_id;

        RETURN COALESCE(NEW, OLD);
    END;
    `
  );

  pgm.createTrigger('order_items', 'trg_order_items_total', {
    when: 'AFTER', operation: ['INSERT', 'UPDATE', 'DELETE'], level: 'ROW',
    function: 'fn_recalc_order_total',
  });

  // fn_deduct_stock DIHAPUS — kolom stock tidak ada lagi di menu_items

  pgm.createIndex('order_items', 'order_id',     { name: 'idx_order_items_order' });
  pgm.createIndex('order_items', 'menu_item_id', { name: 'idx_order_items_menu' });

  pgm.sql("COMMENT ON TABLE  order_items            IS 'Item-item di dalam satu pesanan — immutable setelah dibuat'");
  pgm.sql("COMMENT ON COLUMN order_items.unit_price IS 'Snapshot harga saat order dibuat — tidak berubah jika harga menu diedit kemudian'");
  pgm.sql("COMMENT ON COLUMN order_items.note       IS 'Catatan spesifik per item dari pelanggan, contoh: pedas level 2'");
};

export const down = (pgm) => {
  pgm.dropTable('order_items');
  pgm.dropFunction('fn_recalc_order_total', []);
};
