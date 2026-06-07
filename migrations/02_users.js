export const shorthands = undefined;

export const up = (pgm) => {
  // Hanya satu role yang ada: admin (pemilik restoran)
  pgm.createType('user_role', ['admin']);

  pgm.createTable('users', {
    id:             { type: 'uuid',         primaryKey: true, default: pgm.func('gen_random_uuid()') },
    name:           { type: 'VARCHAR(100)', notNull: true },
    email:          { type: 'VARCHAR(150)', notNull: true, unique: true },
    password_hash:  { type: 'VARCHAR(255)', notNull: true },
    role:           { type: 'user_role',    notNull: true, default: 'admin' },
    // is_active & last_login_at dipertahankan untuk keperluan keamanan dasar
    is_active:      { type: 'BOOLEAN',      notNull: true, default: true },
    last_login_at:  { type: 'TIMESTAMP' },
    created_at:     { type: 'TIMESTAMP',    notNull: true, default: pgm.func('now()') },
    updated_at:     { type: 'TIMESTAMP',    notNull: true, default: pgm.func('now()') },
  });

  pgm.createTrigger('users', 'trg_users_updated_at', {
    when: 'BEFORE', operation: 'UPDATE', level: 'ROW',
    function: 'fn_set_updated_at',
  });

  pgm.createIndex('users', 'email', { name: 'idx_users_email' });

  pgm.sql("COMMENT ON TABLE users IS 'Akun admin / pemilik restoran — satu restoran umumnya satu akun'");
  pgm.sql("COMMENT ON COLUMN users.password_hash IS 'Hash bcrypt — jangan simpan plain text'");

  // Seed: placeholder admin (password harus diganti setelah deploy)
  pgm.sql(`
    INSERT INTO users (name, email, password_hash, role) VALUES
        ('Super Admin', 'admin@restoran.com', '$2b$12$placeholder_hash_admin', 'admin')
    ON CONFLICT (email) DO NOTHING;
  `);
};

export const down = (pgm) => {
  pgm.dropTable('users');
  pgm.dropType('user_role');
};
