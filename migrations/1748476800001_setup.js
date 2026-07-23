export const shorthands = undefined;

export const up = (pgm) => {
  pgm.sql('CREATE EXTENSION IF NOT EXISTS "pgcrypto"');
  pgm.createFunction(
    'fn_set_updated_at',
    [],
    {
      returns: 'TRIGGER',
      language: 'plpgsql',
      replace: true,
    },
    `
    BEGIN
        NEW.updated_at = NOW();
        RETURN NEW;
    END;
    `
  );
};

export const down = (pgm) => {
  pgm.dropFunction('fn_set_updated_at', []);
  pgm.sql('DROP EXTENSION IF EXISTS "pgcrypto"');
};
