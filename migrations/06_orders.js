export const shorthands = undefined;

export const up = (pgm) => {
  pgm.createType("order_status", [
    'pending',
    'confirmed',
    'processing',
    'ready',
    'delivered',
    'completed',
    'cancelled'
  ]);

  pgm.createTable('orders', {
    id: { type: 'uuid', primaryKey: true, default: pgm.func('gen_random_uuid()') },
    table_id: { type: 'uuid', notNull: true, references: 'tables', onDelete: 'RESTRICT' },
    order_number: { type: 'VARCHAR(20)', notNull: true, unique: true },
    status: { type: 'order_status', notNull: true, default: 'pending' },
    customer_note: { type: 'TEXT' },
    subtotal: { type: 'NUMERIC(14,2)', notNull: true, default: 0, check: 'subtotal >= 0' },
    tax_rate: { type: 'NUMERIC(5,4)', notNull: true, default: 0.11 },
    tax_amount: { type: 'NUMERIC(14,2)', notNull: true, default: 0 },
    total: { type: 'NUMERIC(14,2)', notNull: true, default: 0 },
    created_at: { type: 'TIMESTAMP', notNull: true, default: pgm.func('now()') },
    updated_at: { type: 'TIMESTAMP', notNull: true, default: pgm.func('now()') },
  });

  // Function: fn_generate_order_number
  pgm.createFunction(
    'fn_generate_order_number',
    [],
    {
      returns: 'TRIGGER',
      language: 'plpgsql',
      replace: true,
    },
    `
    DECLARE
        today_prefix  VARCHAR(12);
        daily_count   INT;
    BEGIN
        today_prefix := 'ORD-' || TO_CHAR(NOW(), 'YYYYMMDD') || '-';
        SELECT COUNT(*) + 1 INTO daily_count
        FROM orders
        WHERE order_number LIKE today_prefix || '%';
        NEW.order_number := today_prefix || LPAD(daily_count::TEXT, 4, '0');
        RETURN NEW;
    END;
    `
  );

  pgm.createTrigger('orders', 'trg_orders_number', {
    when: 'BEFORE',
    operation: 'INSERT',
    level: 'ROW',
    function: 'fn_generate_order_number',
  });

  // Function: fn_log_order_status
  pgm.createFunction(
    'fn_log_order_status',
    [],
    {
      returns: 'TRIGGER',
      language: 'plpgsql',
      replace: true,
    },
    `
    BEGIN
        IF OLD.status IS DISTINCT FROM NEW.status THEN
            INSERT INTO order_status_logs (order_id, old_status, new_status)
            VALUES (NEW.id, OLD.status, NEW.status);
        END IF;
        RETURN NEW;
    END;
    `
  );

  // Trigger for fn_log_order_status will be created after order_status_logs table is created or we can use pgm.sql later.
  // Actually, order_status_logs needs to exist. So I'll put it in 08_order_status_logs or use pgm.sql here if I'm sure of the order.

  // Function: fn_update_table_status
  pgm.createFunction(
    'fn_update_table_status',
    [],
    {
      returns: 'TRIGGER',
      language: 'plpgsql',
      replace: true,
    },
    `
    BEGIN
        IF TG_OP = 'INSERT' THEN
            UPDATE tables SET status = 'occupied' WHERE id = NEW.table_id;
        ELSIF TG_OP = 'UPDATE' AND NEW.status IN ('completed', 'cancelled') THEN
            IF NOT EXISTS (
                SELECT 1 FROM orders
                WHERE table_id = NEW.table_id
                  AND status NOT IN ('completed', 'cancelled')
                  AND id != NEW.id
            ) THEN
                UPDATE tables SET status = 'available' WHERE id = NEW.table_id;
            END IF;
        END IF;
        RETURN NEW;
    END;
    `
  );

  pgm.createTrigger('orders', 'trg_table_status', {
    when: 'AFTER',
    operation: ['INSERT', 'UPDATE'],
    level: 'ROW',
    function: 'fn_update_table_status',
  });

  pgm.createTrigger('orders', 'trg_orders_updated_at', {
    when: 'BEFORE',
    operation: 'UPDATE',
    level: 'ROW',
    function: 'fn_set_updated_at',
  });

  pgm.createIndex('orders', 'table_id', { name: 'idx_orders_table_id' });
  pgm.createIndex('orders', 'status', { name: 'idx_orders_status' });
  pgm.createIndex('orders', 'created_at', { name: 'idx_orders_created_at', method: 'btree', reverse: true });
  pgm.createIndex('orders', 'order_number', { name: 'idx_orders_number' });

  pgm.sql("COMMENT ON TABLE orders IS 'Pesanan per sesi, satu meja bisa punya banyak order'");
  pgm.sql("COMMENT ON COLUMN orders.tax_rate IS 'Tarif pajak pada saat order dibuat (default 11% PPN)'");
  pgm.sql("COMMENT ON COLUMN orders.total IS 'subtotal + tax_amount'");
};

export const down = (pgm) => {
  pgm.dropTable('orders');
  pgm.dropFunction('fn_update_table_status', []);
  pgm.dropFunction('fn_log_order_status', []);
  pgm.dropFunction('fn_generate_order_number', []);
  pgm.dropType('order_status');
};
