export const shorthands = undefined;

export const up = (pgm) => {
  pgm.createTable('categories', {
    id: { type: 'uuid', primaryKey: true, default: pgm.func('gen_random_uuid()') },
    name: { type: 'VARCHAR(80)', notNull: true, unique: true },
    description: { type: 'VARCHAR(300)' },
    image_url: { type: 'VARCHAR(500)' },
    sort_order: { type: 'SMALLINT', notNull: true, default: 0 },
    is_active: { type: 'BOOLEAN', notNull: true, default: true },
    created_at: { type: 'TIMESTAMP', notNull: true, default: pgm.func('now()') },
  });

  pgm.sql("COMMENT ON TABLE categories IS 'Kategori untuk pengelompokan menu'");

  // Seeds
  pgm.sql(`
    INSERT INTO categories (name, description, sort_order) VALUES
        ('Makanan Utama',  'Hidangan utama nasi dan mie',    1),
        ('Camilan',        'Gorengan dan makanan ringan',     2),
        ('Minuman Dingin', 'Es dan minuman segar',            3),
        ('Minuman Panas',  'Kopi dan teh',                   4),
        ('Dessert',        'Makanan penutup',                 5)
    ON CONFLICT (name) DO NOTHING;
  `);
};

export const down = (pgm) => {
  pgm.dropTable('categories');
};
