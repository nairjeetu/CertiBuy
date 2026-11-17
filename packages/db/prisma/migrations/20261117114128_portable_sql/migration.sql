-- Portable SQL: current_user_id(), ledger triggers, partial unique indexes
-- This runs on any Postgres. Supabase redefines current_user_id() separately.

-- ─── current_user_id() ───────────────────────────────────────────────────────
-- Portable version: reads a per-transaction setting.
-- On Supabase this is overridden by packages/db/supabase/current_user_id.sql.

CREATE SCHEMA IF NOT EXISTS app;

CREATE OR REPLACE FUNCTION app.current_user_id()
RETURNS TEXT
LANGUAGE sql
STABLE
AS $$
  SELECT coalesce(
    nullif(current_setting('app.current_user_id', true), ''),
    NULL
  );
$$;

-- ─── Ledger protection triggers ─────────────────────────────────────────────
-- escrow_transactions, activity_log, payout_attempts are append-only.

CREATE OR REPLACE FUNCTION reject_mutation()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  RAISE EXCEPTION 'Mutations on % are not allowed. Use compensating rows.', TG_TABLE_NAME;
END;
$$;

CREATE TRIGGER escrow_immutable
  BEFORE UPDATE OR DELETE ON escrow_transactions
  FOR EACH ROW EXECUTE FUNCTION reject_mutation();

CREATE TRIGGER activity_log_immutable
  BEFORE UPDATE OR DELETE ON activity_log
  FOR EACH ROW EXECUTE FUNCTION reject_mutation();

CREATE TRIGGER payout_attempts_immutable
  BEFORE UPDATE OR DELETE ON payout_attempts
  FOR EACH ROW EXECUTE FUNCTION reject_mutation();

-- payouts: only status, attempts, failure_reason, paid_at may be updated.
CREATE OR REPLACE FUNCTION restrict_payout_update()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF OLD.id          IS DISTINCT FROM NEW.id
  OR OLD.seller_id   IS DISTINCT FROM NEW.seller_id
  OR OLD.submission_id IS DISTINCT FROM NEW.submission_id
  OR OLD.device_id   IS DISTINCT FROM NEW.device_id
  OR OLD.type        IS DISTINCT FROM NEW.type
  OR OLD.amount      IS DISTINCT FROM NEW.amount
  OR OLD.trigger     IS DISTINCT FROM NEW.trigger
  THEN
    RAISE EXCEPTION 'Only status, attempts, failure_reason and paid_at may be updated on payouts';
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER payout_restrict_update
  BEFORE UPDATE ON payouts
  FOR EACH ROW EXECUTE FUNCTION restrict_payout_update();

-- ─── Partial unique indexes ─────────────────────────────────────────────────
-- One balance payout per device.
CREATE UNIQUE INDEX payouts_one_balance_per_device
  ON payouts (device_id) WHERE type = 'balance';

-- One escrow release per order.
CREATE UNIQUE INDEX escrow_one_release_per_order
  ON escrow_transactions (order_id) WHERE type = 'release';

-- One refund per order (full or partial).
CREATE UNIQUE INDEX escrow_one_refund_per_order
  ON escrow_transactions (order_id) WHERE type IN ('refund_full', 'refund_partial');

-- One active return per order.
CREATE UNIQUE INDEX returns_one_active_per_order
  ON return_requests (order_id) WHERE status <> 'resolved';

-- One current liquidity score per model.
CREATE UNIQUE INDEX liquidity_one_current_per_model
  ON liquidity_scores (device_model_id) WHERE is_current = true;

-- Settings is a single-row table.
ALTER TABLE settings ADD CONSTRAINT settings_single_row CHECK (id = 1);
