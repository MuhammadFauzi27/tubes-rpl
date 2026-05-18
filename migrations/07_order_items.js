export const shorthands = undefined;

export const up = (pgm) => {
  pgm.createTable('order_items', {
    id: { type: 'uuid', primaryKey: true, default: pgm.func('gen_random_uuid()') },
    order_id: { type: 'uuid', notNull: true, references: 'orders', onDelete: 'CASCADE' },
    menu_item_id: { type: 'uuid', notNull: true, references: 'menu_items', onDelete: 'RESTRICT' },
    quantity: { type: 'SMALLINT', notNull: true, check: 'quantity > 0' },
    unit_price: { type: 'NUMERIC(12,2)', notNull: true },
    subtotal: { type: 'NUMERIC(14,2)', notNull: true },
    note: { type: 'VARCHAR(300)' },
    created_at: { type: 'TIMESTAMP', notNull: true, default: pgm.func('now()') },
  });

  // Function: fn_recalc_order_total
  pgm.createFunction(
    'fn_recalc_order_total',
    [],
    {
      returns: 'TRIGGER',
      language: 'plpgsql',
      replace: true,
    },
    `
    DECLARE
        v_order_id   UUID;
        v_subtotal   NUMERIC(14,2);
        v_tax_rate   NUMERIC(5,4);
        v_tax_amount NUMERIC(14,2);
    BEGIN
        v_order_id := COALESCE(NEW.order_id, OLD.order_id);

        SELECT COALESCE(SUM(subtotal), 0), MAX(tax_rate)
        INTO v_subtotal, v_tax_rate
        FROM order_items, orders
        WHERE order_items.order_id = v_order_id
          AND orders.id = v_order_id;

        v_tax_amount := ROUND(v_subtotal * v_tax_rate, 2);

        UPDATE orders SET
            subtotal   = v_subtotal,
            tax_amount = v_tax_amount,
            total      = v_subtotal + v_tax_amount
        WHERE id = v_order_id;

        RETURN NEW;
    END;
    `
  );

  pgm.createTrigger('order_items', 'trg_order_items_total', {
    when: 'AFTER',
    operation: ['INSERT', 'UPDATE', 'DELETE'],
    level: 'ROW',
    function: 'fn_recalc_order_total',
  });

  // Function: fn_deduct_stock
  pgm.createFunction(
    'fn_deduct_stock',
    [],
    {
      returns: 'TRIGGER',
      language: 'plpgsql',
      replace: true,
    },
    `
    BEGIN
        IF NEW.menu_item_id IS NOT NULL THEN
            UPDATE menu_items
            SET stock = stock - NEW.quantity
            WHERE id = NEW.menu_item_id
              AND stock IS NOT NULL;

            -- Jika stok habis, nonaktifkan item
            UPDATE menu_items
            SET is_available = FALSE
            WHERE id = NEW.menu_item_id
              AND stock IS NOT NULL
              AND stock <= 0;
        END IF;
        RETURN NEW;
    END;
    `
  );

  pgm.createTrigger('order_items', 'trg_deduct_stock', {
    when: 'AFTER',
    operation: 'INSERT',
    level: 'ROW',
    function: 'fn_deduct_stock',
  });

  pgm.createIndex('order_items', 'order_id', { name: 'idx_order_items_order' });
  pgm.createIndex('order_items', 'menu_item_id', { name: 'idx_order_items_menu' });

  pgm.sql("COMMENT ON TABLE order_items IS 'Detail item per pesanan'");
  pgm.sql("COMMENT ON COLUMN order_items.unit_price IS 'Harga snapshot saat order — tidak berubah jika menu diedit kemudian'");
};

export const down = (pgm) => {
  pgm.dropTable('order_items');
  pgm.dropFunction('fn_deduct_stock', []);
  pgm.dropFunction('fn_recalc_order_total', []);
};
