export const shorthands = undefined;

export const up = (pgm) => {
  pgm.createType("table_status", ['available', 'occupied', 'reserved']);

  pgm.createTable('tables', {
    id: { type: 'uuid', primaryKey: true, default: pgm.func('gen_random_uuid()') },
    table_number: { type: 'VARCHAR(10)', notNull: true, unique: true },
    capacity: { type: 'SMALLINT', notNull: true, default: 4, check: 'capacity > 0' },
    status: { type: 'table_status', notNull: true, default: 'available' },
    qr_code_token: { type: 'VARCHAR(100)', notNull: true, unique: true, default: pgm.func("encode(gen_random_bytes(32), 'hex')") },
    floor: { type: 'SMALLINT', notNull: true, default: 1 },
    description: { type: 'VARCHAR(200)' },
    created_at: { type: 'TIMESTAMP', notNull: true, default: pgm.func('now()') },
    updated_at: { type: 'TIMESTAMP', notNull: true, default: pgm.func('now()') },
  });

  pgm.createTrigger('tables', 'trg_tables_updated_at', {
    when: 'BEFORE',
    operation: 'UPDATE',
    level: 'ROW',
    function: 'fn_set_updated_at',
  });

  pgm.createIndex('tables', 'status', { name: 'idx_tables_status' });
  pgm.createIndex('tables', 'qr_code_token', { name: 'idx_tables_qr_token' });

  pgm.sql("COMMENT ON TABLE tables IS 'Data meja restoran beserta QR code uniknya'");
  pgm.sql("COMMENT ON COLUMN tables.qr_code_token IS 'Token yang diencode ke QR code, digunakan pelanggan untuk scan'");

  // Seeds
  pgm.sql(`
    INSERT INTO tables (table_number, capacity, floor) VALUES
        ('A1', 2, 1), ('A2', 2, 1), ('A3', 4, 1), ('A4', 4, 1),
        ('B1', 4, 1), ('B2', 4, 1), ('B3', 6, 1), ('B4', 6, 1),
        ('C1', 2, 2), ('C2', 4, 2), ('C3', 8, 2), ('VIP1', 10, 2)
    ON CONFLICT (table_number) DO NOTHING;
  `);
};

export const down = (pgm) => {
  pgm.dropTable('tables');
  pgm.dropType('table_status');
};
