export const shorthands = undefined;

export const up = (pgm) => {
  pgm.createType("payment_method", ['cash', 'qris', 'debit', 'credit', 'transfer']);
  pgm.createType("payment_status", ['pending', 'paid', 'failed', 'refunded']);

  pgm.createTable('payments', {
    id: { type: 'uuid', primaryKey: true, default: pgm.func('gen_random_uuid()') },
    order_id: { type: 'uuid', notNull: true, unique: true, references: 'orders', onDelete: 'RESTRICT' },
    processed_by: { type: 'uuid', references: 'users', onDelete: 'SET NULL' },
    payment_method: { type: 'payment_method', notNull: true },
    payment_status: { type: 'payment_status', notNull: true, default: 'pending' },
    amount: { type: 'NUMERIC(14,2)', notNull: true, check: 'amount > 0' },
    change_amount: { type: 'NUMERIC(14,2)', default: 0 },
    transaction_ref: { type: 'VARCHAR(200)' },
    notes: { type: 'TEXT' },
    paid_at: { type: 'TIMESTAMP' },
    created_at: { type: 'TIMESTAMP', notNull: true, default: pgm.func('now()') },
    updated_at: { type: 'TIMESTAMP', notNull: true, default: pgm.func('now()') },
  });

  // Function: fn_set_paid_at
  pgm.createFunction(
    'fn_set_paid_at',
    [],
    {
      returns: 'TRIGGER',
      language: 'plpgsql',
      replace: true,
    },
    `
    BEGIN
        IF NEW.payment_status = 'paid' AND OLD.payment_status != 'paid' THEN
            NEW.paid_at := NOW();
            -- Otomatis ubah status order jadi completed
            UPDATE orders SET status = 'completed' WHERE id = NEW.order_id;
        END IF;
        RETURN NEW;
    END;
    `
  );

  pgm.createTrigger('payments', 'trg_payment_paid_at', {
    when: 'BEFORE',
    operation: 'UPDATE',
    level: 'ROW',
    function: 'fn_set_paid_at',
  });

  pgm.createTrigger('payments', 'trg_payments_updated_at', {
    when: 'BEFORE',
    operation: 'UPDATE',
    level: 'ROW',
    function: 'fn_set_updated_at',
  });

  pgm.createIndex('payments', 'order_id', { name: 'idx_payments_order' });
  pgm.createIndex('payments', 'payment_status', { name: 'idx_payments_status' });
  pgm.createIndex('payments', 'paid_at', { name: 'idx_payments_paid_at', method: 'btree', reverse: true });

  pgm.sql("COMMENT ON TABLE payments IS 'Transaksi pembayaran per order'");
  pgm.sql("COMMENT ON COLUMN payments.processed_by IS 'NULL jika dibayar langsung oleh sistem (QRIS otomatis)'");
  pgm.sql("COMMENT ON COLUMN payments.change_amount IS 'Kembalian untuk metode cash'");
};

export const down = (pgm) => {
  pgm.dropTable('payments');
  pgm.dropFunction('fn_set_paid_at', []);
  pgm.dropType('payment_status');
  pgm.dropType('payment_method');
};
