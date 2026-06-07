export const shorthands = undefined;

export const up = (pgm) => {
  pgm.createTable('menu_items', {
    id:           { type: 'uuid',          primaryKey: true, default: pgm.func('gen_random_uuid()') },
    category_id:  { type: 'uuid',          notNull: true, references: 'categories', onDelete: 'RESTRICT' },
    name:         { type: 'VARCHAR(150)',   notNull: true },
    description:  { type: 'TEXT' },
    price:        { type: 'NUMERIC(12,2)', notNull: true, check: 'price >= 0' },
    image_url:    { type: 'VARCHAR(500)' },
    is_available: { type: 'BOOLEAN',       notNull: true, default: true },
    is_featured:  { type: 'BOOLEAN',       notNull: true, default: false },
    // Kolom stock dihapus — aplikasi tidak menggunakan manajemen stok per item
    sort_order:   { type: 'SMALLINT',      notNull: true, default: 0 },
    created_at:   { type: 'TIMESTAMP',     notNull: true, default: pgm.func('now()') },
    updated_at:   { type: 'TIMESTAMP',     notNull: true, default: pgm.func('now()') },
  });

  pgm.createTrigger('menu_items', 'trg_menu_items_updated_at', {
    when: 'BEFORE', operation: 'UPDATE', level: 'ROW',
    function: 'fn_set_updated_at',
  });

  pgm.createIndex('menu_items', 'category_id',  { name: 'idx_menu_items_category' });
  pgm.createIndex('menu_items', 'is_available',  { name: 'idx_menu_items_available', where: 'is_available = TRUE' });
  pgm.createIndex('menu_items', 'is_featured',   { name: 'idx_menu_items_featured',  where: 'is_featured = TRUE' });

  pgm.sql("COMMENT ON TABLE  menu_items             IS 'Daftar item menu yang dapat dipesan pelanggan'");
  pgm.sql("COMMENT ON COLUMN menu_items.is_featured IS 'Ditampilkan sebagai menu unggulan di landing page pelanggan'");
  pgm.sql("COMMENT ON COLUMN menu_items.is_available IS 'FALSE = menu disembunyikan dari pelanggan. Gunakan toggle-availability endpoint.'");

  // Seeds
  pgm.sql(`
    INSERT INTO menu_items (category_id, name, price, description, is_available, is_featured) VALUES
        ((SELECT id FROM categories WHERE name = 'Makanan Utama'), 'Nasi Goreng Spesial',   35000, 'Nasi goreng dengan telur, ayam, dan kerupuk',         TRUE, TRUE),
        ((SELECT id FROM categories WHERE name = 'Makanan Utama'), 'Mie Goreng Seafood',    42000, 'Mie goreng dengan udang, cumi, dan sayuran',           TRUE, FALSE),
        ((SELECT id FROM categories WHERE name = 'Makanan Utama'), 'Ayam Bakar',            45000, 'Ayam bakar bumbu kecap dengan lalapan dan sambal',     TRUE, TRUE),
        ((SELECT id FROM categories WHERE name = 'Makanan Utama'), 'Soto Ayam',             28000, 'Soto ayam kuah bening dengan nasi',                    TRUE, FALSE),
        ((SELECT id FROM categories WHERE name = 'Camilan'),       'Pisang Goreng Crispy',  15000, 'Pisang goreng tepung renyah dengan saus coklat',       TRUE, FALSE),
        ((SELECT id FROM categories WHERE name = 'Camilan'),       'Kentang Goreng',        18000, 'Kentang goreng crispy dengan saus sambal',             TRUE, FALSE),
        ((SELECT id FROM categories WHERE name = 'Minuman Dingin'), 'Es Teh Manis',          8000, 'Teh manis segar dengan es batu',                       TRUE, FALSE),
        ((SELECT id FROM categories WHERE name = 'Minuman Dingin'), 'Jus Alpukat',          18000, 'Jus alpukat segar dengan susu kental manis',           TRUE, TRUE),
        ((SELECT id FROM categories WHERE name = 'Minuman Dingin'), 'Es Jeruk',             10000, 'Jeruk peras segar dengan es',                          TRUE, FALSE),
        ((SELECT id FROM categories WHERE name = 'Minuman Panas'),  'Kopi Hitam',           10000, 'Kopi robusta tubruk',                                  TRUE, FALSE),
        ((SELECT id FROM categories WHERE name = 'Minuman Panas'),  'Teh Tarik',            12000, 'Teh susu khas Melayu',                                 TRUE, FALSE),
        ((SELECT id FROM categories WHERE name = 'Dessert'),        'Es Krim Vanilla',      15000, 'Es krim vanilla dengan topping coklat',                TRUE, FALSE),
        ((SELECT id FROM categories WHERE name = 'Dessert'),        'Pudding Coklat',       12000, 'Pudding coklat dengan saus karamel',                   TRUE, FALSE);
  `);
};

export const down = (pgm) => {
  pgm.dropTable('menu_items');
};
