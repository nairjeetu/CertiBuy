-- Row-Level Security policies for all tables.
-- Written against app.current_user_id() per roles.md §6.
-- Enable RLS on every table.

GRANT USAGE ON SCHEMA app TO anon, authenticated;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA app TO anon, authenticated;

-- Helper: is the caller ops or platform admin?
CREATE OR REPLACE FUNCTION app.is_staff()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM profiles
    WHERE id = app.current_user_id()
      AND (app_role = 'ops' OR is_platform_admin = true)
  );
$$;

CREATE OR REPLACE FUNCTION app.is_admin()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM profiles
    WHERE id = app.current_user_id()
      AND is_platform_admin = true
  );
$$;

CREATE OR REPLACE FUNCTION app.caller_role()
RETURNS TEXT
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT app_role::text FROM profiles WHERE id = app.current_user_id();
$$;

CREATE OR REPLACE FUNCTION app.caller_hub_id()
RETURNS TEXT
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT hub_id FROM profiles WHERE id = app.current_user_id();
$$;

-- ═══ Settings ═══
ALTER TABLE settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY settings_read ON settings FOR SELECT USING (app.current_user_id() IS NOT NULL);
CREATE POLICY settings_write ON settings FOR ALL USING (app.is_admin());

-- ═══ Profiles ═══
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY profiles_read_own ON profiles FOR SELECT USING (
  id = app.current_user_id() OR app.is_staff()
);
CREATE POLICY profiles_update_own ON profiles FOR UPDATE USING (
  id = app.current_user_id()
) WITH CHECK (
  id = app.current_user_id()
);
CREATE POLICY profiles_admin ON profiles FOR ALL USING (app.is_admin());

-- ═══ DeviceModel ═══
ALTER TABLE device_models ENABLE ROW LEVEL SECURITY;
CREATE POLICY device_models_read ON device_models FOR SELECT USING (app.current_user_id() IS NOT NULL);
CREATE POLICY device_models_write ON device_models FOR ALL USING (app.is_admin());

-- ═══ LiquidityScore ═══
ALTER TABLE liquidity_scores ENABLE ROW LEVEL SECURITY;
CREATE POLICY liquidity_scores_read ON liquidity_scores FOR SELECT USING (app.current_user_id() IS NOT NULL);
CREATE POLICY liquidity_scores_write ON liquidity_scores FOR ALL USING (app.is_admin());

-- ═══ Hub ═══
ALTER TABLE hubs ENABLE ROW LEVEL SECURITY;
CREATE POLICY hubs_read ON hubs FOR SELECT USING (app.current_user_id() IS NOT NULL);
CREATE POLICY hubs_write ON hubs FOR ALL USING (app.is_admin());

-- ═══ BlacklistedImei ═══
ALTER TABLE blacklisted_imeis ENABLE ROW LEVEL SECURITY;
CREATE POLICY blacklisted_read ON blacklisted_imeis FOR SELECT USING (app.is_staff());
CREATE POLICY blacklisted_write ON blacklisted_imeis FOR ALL USING (app.is_admin());

-- ═══ Submission ═══
ALTER TABLE submissions ENABLE ROW LEVEL SECURITY;
CREATE POLICY submissions_read ON submissions FOR SELECT USING (
  seller_id = app.current_user_id()
  OR app.is_staff()
);
CREATE POLICY submissions_insert ON submissions FOR INSERT WITH CHECK (
  seller_id = app.current_user_id() OR app.is_admin()
);
CREATE POLICY submissions_update ON submissions FOR UPDATE USING (
  seller_id = app.current_user_id() OR app.is_admin()
);
CREATE POLICY submissions_delete ON submissions FOR DELETE USING (app.is_admin());

-- ═══ Offer ═══
ALTER TABLE offers ENABLE ROW LEVEL SECURITY;
CREATE POLICY offers_read ON offers FOR SELECT USING (
  seller_id = app.current_user_id() OR app.is_staff()
);
CREATE POLICY offers_write ON offers FOR ALL USING (app.is_staff());

-- ═══ GradeAssessment ═══
ALTER TABLE grade_assessments ENABLE ROW LEVEL SECURITY;
CREATE POLICY grade_assessments_read ON grade_assessments FOR SELECT USING (
  seller_id = app.current_user_id()
  OR app.caller_role() = 'technician'
  OR app.is_admin()
);
CREATE POLICY grade_assessments_write ON grade_assessments FOR ALL USING (
  app.caller_role() = 'technician' OR app.is_admin()
);

-- ═══ Booking ═══
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;
CREATE POLICY bookings_read ON bookings FOR SELECT USING (
  seller_id = app.current_user_id()
  OR (app.caller_role() = 'technician' AND hub_id = app.caller_hub_id())
  OR app.is_admin()
);
CREATE POLICY bookings_insert ON bookings FOR INSERT WITH CHECK (
  seller_id = app.current_user_id() OR app.is_admin()
);
CREATE POLICY bookings_update ON bookings FOR UPDATE USING (
  (app.caller_role() = 'technician' AND hub_id = app.caller_hub_id())
  OR app.is_admin()
);
CREATE POLICY bookings_delete ON bookings FOR DELETE USING (app.is_admin());

-- ═══ InspectionReport ═══
ALTER TABLE inspection_reports ENABLE ROW LEVEL SECURITY;
CREATE POLICY inspection_reports_read ON inspection_reports FOR SELECT USING (
  (app.caller_role() = 'technician' AND hub_id = app.caller_hub_id())
  OR app.is_admin()
);
CREATE POLICY inspection_reports_write ON inspection_reports FOR ALL USING (
  (app.caller_role() = 'technician' AND hub_id = app.caller_hub_id())
  OR app.is_admin()
);

-- ═══ Device ═══
ALTER TABLE devices ENABLE ROW LEVEL SECURITY;
CREATE POLICY devices_read ON devices FOR SELECT USING (
  seller_id = app.current_user_id()
  OR (app.caller_role() = 'technician' AND hub_id = app.caller_hub_id())
  OR app.is_staff()
);
CREATE POLICY devices_write ON devices FOR ALL USING (app.is_staff());

-- ═══ Listing ═══
ALTER TABLE listings ENABLE ROW LEVEL SECURITY;
CREATE POLICY listings_read ON listings FOR SELECT USING (
  status IN ('active', 'reserved', 'sold') OR app.is_staff()
);
CREATE POLICY listings_write ON listings FOR ALL USING (app.is_staff());

-- ═══ Order ═══
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
CREATE POLICY orders_read ON orders FOR SELECT USING (
  buyer_id = app.current_user_id() OR app.is_staff()
);
CREATE POLICY orders_write ON orders FOR ALL USING (app.is_staff());

-- ═══ EscrowTransaction ═══
ALTER TABLE escrow_transactions ENABLE ROW LEVEL SECURITY;
CREATE POLICY escrow_read ON escrow_transactions FOR SELECT USING (
  buyer_id = app.current_user_id() OR app.is_staff()
);
CREATE POLICY escrow_write ON escrow_transactions FOR INSERT WITH CHECK (app.is_staff());

-- ═══ ReturnRequest ═══
ALTER TABLE return_requests ENABLE ROW LEVEL SECURITY;
CREATE POLICY returns_read ON return_requests FOR SELECT USING (
  buyer_id = app.current_user_id() OR app.is_staff()
);
CREATE POLICY returns_insert ON return_requests FOR INSERT WITH CHECK (
  buyer_id = app.current_user_id() OR app.is_admin()
);
CREATE POLICY returns_update ON return_requests FOR UPDATE USING (app.is_staff());
CREATE POLICY returns_delete ON return_requests FOR DELETE USING (app.is_admin());

-- ═══ Payout ═══
ALTER TABLE payouts ENABLE ROW LEVEL SECURITY;
CREATE POLICY payouts_read ON payouts FOR SELECT USING (
  seller_id = app.current_user_id() OR app.is_staff()
);
CREATE POLICY payouts_write ON payouts FOR ALL USING (app.is_staff());

-- ═══ ExceptionCase ═══
ALTER TABLE exception_cases ENABLE ROW LEVEL SECURITY;
CREATE POLICY exceptions_all ON exception_cases FOR ALL USING (app.is_staff());

-- ═══ ActivityLog ═══
ALTER TABLE activity_log ENABLE ROW LEVEL SECURITY;
CREATE POLICY activity_log_read ON activity_log FOR SELECT USING (app.is_staff());
CREATE POLICY activity_log_insert ON activity_log FOR INSERT WITH CHECK (app.is_staff());

-- ═══ Notification ═══
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY notifications_read ON notifications FOR SELECT USING (
  user_id = app.current_user_id() OR app.is_admin()
);
CREATE POLICY notifications_update ON notifications FOR UPDATE USING (
  user_id = app.current_user_id() OR app.is_admin()
);
CREATE POLICY notifications_insert ON notifications FOR INSERT WITH CHECK (app.is_staff());
CREATE POLICY notifications_delete ON notifications FOR DELETE USING (app.is_admin());

-- ═══ SupportRequest ═══
ALTER TABLE support_requests ENABLE ROW LEVEL SECURITY;
CREATE POLICY support_read ON support_requests FOR SELECT USING (
  customer_id = app.current_user_id() OR app.is_staff()
);
CREATE POLICY support_insert ON support_requests FOR INSERT WITH CHECK (
  customer_id = app.current_user_id()
);
CREATE POLICY support_update ON support_requests FOR UPDATE USING (app.is_staff());
CREATE POLICY support_delete ON support_requests FOR DELETE USING (app.is_admin());

-- ═══ Invitation ═══
ALTER TABLE invitations ENABLE ROW LEVEL SECURITY;
CREATE POLICY invitations_all ON invitations FOR ALL USING (app.is_staff());

-- ═══ Infrastructure tables (ops-only or system-only) ═══
ALTER TABLE payout_attempts ENABLE ROW LEVEL SECURITY;
CREATE POLICY payout_attempts_read ON payout_attempts FOR SELECT USING (app.is_staff());
CREATE POLICY payout_attempts_insert ON payout_attempts FOR INSERT WITH CHECK (app.is_staff());

ALTER TABLE payment_intents ENABLE ROW LEVEL SECURITY;
CREATE POLICY payment_intents_all ON payment_intents FOR ALL USING (app.is_staff());

ALTER TABLE shipments ENABLE ROW LEVEL SECURITY;
CREATE POLICY shipments_all ON shipments FOR ALL USING (app.is_staff());

ALTER TABLE outbox ENABLE ROW LEVEL SECURITY;
CREATE POLICY outbox_all ON outbox FOR ALL USING (app.is_staff());

ALTER TABLE file_objects ENABLE ROW LEVEL SECURITY;
CREATE POLICY file_objects_read ON file_objects FOR SELECT USING (
  owner_id = app.current_user_id() OR app.is_staff()
);
CREATE POLICY file_objects_insert ON file_objects FOR INSERT WITH CHECK (
  owner_id = app.current_user_id() OR app.is_staff()
);

ALTER TABLE settings_history ENABLE ROW LEVEL SECURITY;
CREATE POLICY settings_history_all ON settings_history FOR ALL USING (app.is_staff());

ALTER TABLE job_runs ENABLE ROW LEVEL SECURITY;
CREATE POLICY job_runs_all ON job_runs FOR ALL USING (app.is_staff());

ALTER TABLE idempotency_keys ENABLE ROW LEVEL SECURITY;
CREATE POLICY idempotency_keys_all ON idempotency_keys FOR ALL USING (app.is_staff());

ALTER TABLE rate_limits ENABLE ROW LEVEL SECURITY;
CREATE POLICY rate_limits_all ON rate_limits FOR ALL USING (app.is_staff());
