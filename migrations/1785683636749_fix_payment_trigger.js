/**
 * Migration: Fix fn_set_paid_at trigger
 *
 * Sebelumnya: konfirmasi payment otomatis mengubah order.status = 'completed',
 * menyebabkan order menghilang dari Live Orders Kanban sebelum proses selesai.
 *
 * Sesudah: trigger hanya mencatat paid_at. Status order tetap mengikuti alur
 * Kanban (pending → confirmed → processing → ready → delivered → completed).
 * "Completed" hanya diset secara manual oleh admin melalui PATCH /orders/{id}/status.
 */
export const shorthands = undefined;

export const up = (pgm) => {
  pgm.sql(`
    CREATE OR REPLACE FUNCTION fn_set_paid_at()
    RETURNS TRIGGER AS $$
    BEGIN
        IF NEW.payment_status = 'paid' AND OLD.payment_status <> 'paid' THEN
            NEW.paid_at := NOW();
            -- Status order TIDAK diubah di sini.
            -- Order tetap mengikuti alur Kanban (pending → confirmed → processing
            -- → ready → delivered → completed) yang dikontrol admin via Live Orders.
        END IF;
        RETURN NEW;
    END;
    $$ LANGUAGE plpgsql;
  `);
};

export const down = (pgm) => {
  // Kembalikan ke perilaku lama (auto-complete on paid) jika rollback diperlukan
  pgm.sql(`
    CREATE OR REPLACE FUNCTION fn_set_paid_at()
    RETURNS TRIGGER AS $$
    BEGIN
        IF NEW.payment_status = 'paid' AND OLD.payment_status <> 'paid' THEN
            NEW.paid_at := NOW();
            UPDATE orders SET status = 'completed' WHERE id = NEW.order_id;
        END IF;
        RETURN NEW;
    END;
    $$ LANGUAGE plpgsql;
  `);
};
