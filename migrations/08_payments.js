export const shorthands = undefined;

export const up = (pgm) => {
  // Hanya metode cashless — cash/debit/credit/transfer dihapus
  pgm.createType('payment_method', ['qris', 'ewallet']);
  pgm.createType('payment_status', ['pending', 'paid', 'failed']);
  // 'refunded' dihapus — fitur refund out of scope

  pgm.createTable('payments', {
    id:              { type: 'uuid',           primaryKey: true, default: pgm.func('gen_random_uuid()') },
    order_id:        { type: 'uuid',           notNull: true, unique: true, references: 'orders', onDelete: 'RESTRICT' },
    // processed_by dihapus — pembayaran dikonfirmasi via webhook payment gateway, bukan manual admin
    payment_method:  { type: 'payment_method', notNull: true },
    payment_status:  { type: 'payment_status', notNull: true, default: 'pending' },
    amount:          { type: 'NUMERIC(14,2)',   notNull: true, check: 'amount > 0' },
    // change_amount dihapus — tidak relevan untuk cashless
    ewallet_provider: { type: 'VARCHAR(50)' },    // e.g. GoPay, OVO, Dana
    transaction_ref:  { type: 'VARCHAR(200)' },   // referensi dari payment gateway
    qris_data:        { type: 'TEXT' },            // string QRIS untuk render QR di client
    notes:            { type: 'TEXT' },
    paid_at:          { type: 'TIMESTAMP' },
    created_at:       { type: 'TIMESTAMP',   notNull: true, default: pgm.func('now()') },
    updated_at:       { type: 'TIMESTAMP',   notNull: true, default: pgm.func('now()') },
  });

  // ── Saat status jadi 'paid': set paid_at + auto-complete order ───────────────
  // Dipanggil dari webhook payment gateway (bukan aksi admin manual)
  pgm.createFunction(
    'fn_set_paid_at', [],
    { returns: 'TRIGGER', language: 'plpgsql', replace: true },
    `
    BEGIN
        IF NEW.payment_status = 'paid' AND OLD.payment_status <> 'paid' THEN
            NEW.paid_at := NOW();
            -- Otomatis ubah status order jadi completed
            UPDATE orders SET status = 'completed' WHERE id = NEW.order_id;
        END IF;
        RETURN NEW;
    END;
    `
  );

  pgm.createTrigger('payments', 'trg_payment_paid_at', {
    when: 'BEFORE', operation: 'UPDATE', level: 'ROW',
    function: 'fn_set_paid_at',
  });

  pgm.createTrigger('payments', 'trg_payments_updated_at', {
    when: 'BEFORE', operation: 'UPDATE', level: 'ROW',
    function: 'fn_set_updated_at',
  });

  pgm.createIndex('payments', 'order_id',       { name: 'idx_payments_order' });
  pgm.createIndex('payments', 'payment_status', { name: 'idx_payments_status' });
  pgm.createIndex('payments', 'paid_at',        { name: 'idx_payments_paid_at', method: 'btree', reverse: true });

  // Index untuk revenue stats 7 hari (query utama Revenue Stats page)
  pgm.sql(`
    CREATE INDEX idx_payments_paid_revenue
    ON payments (paid_at DESC, payment_status, amount)
    WHERE payment_status = 'paid';
  `);

  pgm.sql("COMMENT ON TABLE  payments                  IS 'Transaksi pembayaran cashless per order — satu order satu payment'");
  pgm.sql("COMMENT ON COLUMN payments.qris_data        IS 'String QRIS yang di-render menjadi QR image di sisi client'");
  pgm.sql("COMMENT ON COLUMN payments.ewallet_provider IS 'Nama penyedia e-wallet, contoh: GoPay, OVO, Dana'");
  pgm.sql("COMMENT ON COLUMN payments.transaction_ref  IS 'Referensi dari payment gateway, diisi saat webhook callback diterima'");
  pgm.sql("COMMENT ON COLUMN payments.paid_at          IS 'Diisi otomatis oleh trigger saat payment_status berubah ke paid'");
};

export const down = (pgm) => {
  pgm.dropTable('payments');
  pgm.dropFunction('fn_set_paid_at', []);
  pgm.dropType('payment_status');
  pgm.dropType('payment_method');
};
