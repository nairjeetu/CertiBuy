-- CreateEnum
CREATE TYPE "AppRole" AS ENUM ('customer', 'technician', 'ops');

-- CreateEnum
CREATE TYPE "ActiveMode" AS ENUM ('buyer', 'seller');

-- CreateEnum
CREATE TYPE "Category" AS ENUM ('phone', 'laptop', 'tablet', 'watch');

-- CreateEnum
CREATE TYPE "LiquidityTier" AS ENUM ('high', 'medium', 'low');

-- CreateEnum
CREATE TYPE "Grade" AS ENUM ('A', 'B', 'C', 'D');

-- CreateEnum
CREATE TYPE "RepairStatus" AS ENUM ('no', 'authorised', 'other_shop', 'not_sure');

-- CreateEnum
CREATE TYPE "BillBox" AS ENUM ('bill_and_box', 'bill_only', 'box_only', 'neither');

-- CreateEnum
CREATE TYPE "WarrantyStatus" AS ENUM ('in_warranty', 'expired', 'unknown');

-- CreateEnum
CREATE TYPE "SubmissionStatus" AS ENUM ('draft', 'graded', 'offer_accepted', 'scheduled', 'inspected', 'accepted', 'rejected', 'abandoned');

-- CreateEnum
CREATE TYPE "MismatchFeeStatus" AS ENUM ('none', 'pending', 'paid', 'waived');

-- CreateEnum
CREATE TYPE "PayoutOption" AS ENUM ('instant_cash', 'sell_for_more');

-- CreateEnum
CREATE TYPE "OfferStatus" AS ENUM ('active', 'accepted', 'declined', 'expired');

-- CreateEnum
CREATE TYPE "ConfidenceLevel" AS ENUM ('High', 'Medium', 'Low');

-- CreateEnum
CREATE TYPE "GradeSource" AS ENUM ('ai', 'technician');

-- CreateEnum
CREATE TYPE "Verdict" AS ENUM ('inside', 'one_below', 'two_below');

-- CreateEnum
CREATE TYPE "BookingStatus" AS ENUM ('booked', 'completed', 'cancelled', 'no_show');

-- CreateEnum
CREATE TYPE "InspectionType" AS ENUM ('intake', 'return_inspection');

-- CreateEnum
CREATE TYPE "SellerDecision" AS ENUM ('pending', 'accepted', 'declined', 'fee_paid', 'fee_due');

-- CreateEnum
CREATE TYPE "DeviceStatus" AS ENUM ('in_refurbishment', 'listed', 'day45_review', 'reserved', 'shipped', 'delivered', 'settled', 'returned', 'liquidated');

-- CreateEnum
CREATE TYPE "ListingStatus" AS ENUM ('active', 'reserved', 'sold', 'review', 'liquidated', 'inactive');

-- CreateEnum
CREATE TYPE "OrderStatus" AS ENUM ('pending', 'paid', 'dispatched', 'in_transit', 'delivered', 'settled', 'refunded', 'replaced', 'cancelled');

-- CreateEnum
CREATE TYPE "EscrowType" AS ENUM ('hold', 'release', 'refund_full', 'refund_partial');

-- CreateEnum
CREATE TYPE "EscrowStatus" AS ENUM ('hold', 'released', 'refunded_full', 'refunded_partial', 'held_replacement');

-- CreateEnum
CREATE TYPE "ReturnReason" AS ENUM ('not_as_graded', 'dead_on_arrival', 'buyer_changed_mind');

-- CreateEnum
CREATE TYPE "ReturnOutcome" AS ENUM ('faulty', 'as_shipped', 'doa_confirmed', 'doa_replacement', 'changed_mind');

-- CreateEnum
CREATE TYPE "ReturnStatus" AS ENUM ('awaiting_reinspection', 'awaiting_decision', 'resolved');

-- CreateEnum
CREATE TYPE "DoaPreference" AS ENUM ('refund', 'replacement');

-- CreateEnum
CREATE TYPE "PayoutType" AS ENUM ('instant_cash_full', 'advance', 'balance', 'mismatch_fee');

-- CreateEnum
CREATE TYPE "PayoutTrigger" AS ENUM ('custody_handover', 'buyer_paid_escrow', 'day_21_unsold', 'inspection_mismatch');

-- CreateEnum
CREATE TYPE "PayoutStatus" AS ENUM ('pending', 'approved', 'paid', 'failed', 'due');

-- CreateEnum
CREATE TYPE "ExceptionType" AS ENUM ('return_exception', 'failed_inspection', 'grade_dispute', 'payment_hold');

-- CreateEnum
CREATE TYPE "ExceptionStatus" AS ENUM ('open', 'resolved');

-- CreateEnum
CREATE TYPE "SupportTopic" AS ENUM ('selling_device', 'order_delivery', 'return_refund', 'payments', 'other');

-- CreateEnum
CREATE TYPE "SupportStatus" AS ENUM ('open', 'resolved');

-- CreateEnum
CREATE TYPE "HubType" AS ENUM ('flagship', 'partner');

-- CreateEnum
CREATE TYPE "PaymentMethod" AS ENUM ('upi', 'card', 'netbanking');

-- CreateEnum
CREATE TYPE "InvitationStatus" AS ENUM ('pending', 'accepted', 'expired', 'revoked');

-- CreateEnum
CREATE TYPE "JobStatus" AS ENUM ('idle', 'running', 'failed');

-- CreateEnum
CREATE TYPE "OutboxStatus" AS ENUM ('pending', 'sent', 'failed');

-- CreateEnum
CREATE TYPE "LiquiditySource" AS ENUM ('measured', 'cold_start', 'seeded');

-- CreateTable
CREATE TABLE "settings" (
    "id" INTEGER NOT NULL DEFAULT 1,
    "commission_pct" INTEGER NOT NULL DEFAULT 15,
    "inspection_fee" INTEGER NOT NULL DEFAULT 200,
    "mismatch_fee" INTEGER NOT NULL DEFAULT 100,
    "return_logistics_charge" INTEGER NOT NULL DEFAULT 300,
    "change_mind_fee" INTEGER NOT NULL DEFAULT 500,
    "warranty_months" INTEGER NOT NULL DEFAULT 12,
    "warranty_addon_pct" INTEGER NOT NULL DEFAULT 5,
    "advance_pct" INTEGER NOT NULL DEFAULT 50,
    "balance_day" INTEGER NOT NULL DEFAULT 21,
    "payout_max_attempts" INTEGER NOT NULL DEFAULT 3,
    "step1_day" INTEGER NOT NULL DEFAULT 15,
    "step1_pct" INTEGER NOT NULL DEFAULT 7,
    "step2_day" INTEGER NOT NULL DEFAULT 30,
    "step2_pct" INTEGER NOT NULL DEFAULT 12,
    "review_day" INTEGER NOT NULL DEFAULT 45,
    "alert_window_days" INTEGER NOT NULL DEFAULT 3,
    "return_window_days" INTEGER NOT NULL DEFAULT 7,
    "liquidity_threshold" INTEGER NOT NULL DEFAULT 60,
    "near_band" INTEGER NOT NULL DEFAULT 10,
    "risk_small_pct" INTEGER NOT NULL DEFAULT 5,
    "risk_large_pct" INTEGER NOT NULL DEFAULT 12,
    "launch_window_days" INTEGER NOT NULL DEFAULT 30,
    "launch_tighten_pts" INTEGER NOT NULL DEFAULT 10,
    "liq_w_days" INTEGER NOT NULL DEFAULT 40,
    "liq_w_demand" INTEGER NOT NULL DEFAULT 25,
    "liq_w_volatility" INTEGER NOT NULL DEFAULT 20,
    "liq_w_launch" INTEGER NOT NULL DEFAULT 15,
    "liq_review_penalty" INTEGER NOT NULL DEFAULT 6,
    "inventory_cap" INTEGER NOT NULL DEFAULT 15000000,
    "per_model_cap" INTEGER NOT NULL DEFAULT 1500000,
    "price_band_min" INTEGER NOT NULL DEFAULT 20000,
    "price_band_max" INTEGER NOT NULL DEFAULT 150000,
    "grade_factor_b" DOUBLE PRECISION NOT NULL DEFAULT 0.91,
    "grade_factor_c" DOUBLE PRECISION NOT NULL DEFAULT 0.82,
    "grade_factor_d" DOUBLE PRECISION NOT NULL DEFAULT 0.6,
    "battery_a_min" INTEGER NOT NULL DEFAULT 90,
    "battery_b_min" INTEGER NOT NULL DEFAULT 85,
    "battery_c_min" INTEGER NOT NULL DEFAULT 80,
    "photo_retake_medium" INTEGER NOT NULL DEFAULT 1,
    "photo_min_px" INTEGER NOT NULL DEFAULT 600,
    "photo_min_brightness" INTEGER NOT NULL DEFAULT 60,
    "offer_expiry_days" INTEGER NOT NULL DEFAULT 7,
    "checkout_hold_minutes" INTEGER NOT NULL DEFAULT 15,
    "cancel_fee" INTEGER NOT NULL DEFAULT 0,
    "hub_cost" INTEGER NOT NULL DEFAULT 350,
    "demo_mode" BOOLEAN NOT NULL DEFAULT true,
    "sim_day_offset" INTEGER NOT NULL DEFAULT 0,
    "simulate_payout_failure" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "settings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "profiles" (
    "id" TEXT NOT NULL,
    "app_role" "AppRole" NOT NULL DEFAULT 'customer',
    "active_mode" "ActiveMode" NOT NULL DEFAULT 'buyer',
    "full_name" TEXT NOT NULL DEFAULT '',
    "phone" TEXT NOT NULL DEFAULT '',
    "city" TEXT NOT NULL DEFAULT '',
    "avatar_key" TEXT NOT NULL DEFAULT '',
    "payout_account" TEXT NOT NULL DEFAULT '',
    "delivery_address" TEXT NOT NULL DEFAULT '',
    "hub_id" TEXT,
    "trust_score" INTEGER NOT NULL DEFAULT 100,
    "return_count" INTEGER NOT NULL DEFAULT 0,
    "account_flagged" BOOLEAN NOT NULL DEFAULT false,
    "is_platform_admin" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "profiles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "device_models" (
    "id" TEXT NOT NULL,
    "brand" TEXT NOT NULL,
    "model" TEXT NOT NULL,
    "storage" TEXT NOT NULL,
    "category" "Category" NOT NULL,
    "colours" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "image_url" TEXT NOT NULL DEFAULT '',
    "launch_date" TEXT,
    "successor_launch_date" TEXT,
    "original_price" INTEGER NOT NULL,
    "market_price_a" INTEGER NOT NULL,
    "market_price_b" INTEGER,
    "market_price_c" INTEGER,
    "market_price_d" INTEGER,
    "b2b_floor_price" INTEGER NOT NULL,
    "price_is_placeholder" BOOLEAN NOT NULL DEFAULT false,
    "liquidity_tier" "LiquidityTier" NOT NULL,
    "ic_paused" BOOLEAN NOT NULL DEFAULT false,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "device_models_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "liquidity_scores" (
    "id" TEXT NOT NULL,
    "device_model_id" TEXT NOT NULL,
    "score" INTEGER NOT NULL,
    "days_to_sell" INTEGER,
    "volatility" DOUBLE PRECISION,
    "launch_window" INTEGER NOT NULL DEFAULT 0,
    "source" "LiquiditySource" NOT NULL,
    "calculated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "is_current" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "liquidity_scores_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "hubs" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" "HubType" NOT NULL,
    "address" TEXT NOT NULL,
    "city" TEXT NOT NULL,
    "pincode" TEXT NOT NULL,
    "slot_times" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "daily_capacity" INTEGER NOT NULL DEFAULT 20,
    "distance_km" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "hubs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "blacklisted_imeis" (
    "id" TEXT NOT NULL,
    "imei" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "blacklisted_imeis_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "submissions" (
    "id" TEXT NOT NULL,
    "seller_id" TEXT NOT NULL,
    "device_model_id" TEXT NOT NULL,
    "colour" TEXT NOT NULL DEFAULT '',
    "imei" TEXT NOT NULL,
    "age_months" INTEGER NOT NULL DEFAULT 0,
    "declared_cosmetic" "Grade" NOT NULL,
    "repaired" "RepairStatus" NOT NULL,
    "water_exposure" BOOLEAN NOT NULL DEFAULT false,
    "bill_box" "BillBox" NOT NULL DEFAULT 'neither',
    "warranty_status" "WarrantyStatus" NOT NULL DEFAULT 'unknown',
    "photos" JSONB NOT NULL DEFAULT '[]',
    "retake_count" INTEGER NOT NULL DEFAULT 0,
    "diagnostics" JSONB NOT NULL DEFAULT '{}',
    "status" "SubmissionStatus" NOT NULL DEFAULT 'draft',
    "reject_reason" TEXT,
    "chosen_option" "PayoutOption",
    "consent_at" TIMESTAMP(3),
    "current_offer_id" TEXT,
    "final_grade" "Grade",
    "mismatch_fee_status" "MismatchFeeStatus" NOT NULL DEFAULT 'none',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "submissions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "offers" (
    "id" TEXT NOT NULL,
    "submission_id" TEXT NOT NULL,
    "seller_id" TEXT NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 1,
    "priced_band" TEXT[],
    "instant_cash_amount" INTEGER NOT NULL,
    "guaranteed_price" INTEGER NOT NULL,
    "ic_eligible" BOOLEAN NOT NULL,
    "ic_reason" TEXT,
    "risk_pct" INTEGER NOT NULL,
    "risk_tier" TEXT NOT NULL,
    "breakdown" JSONB NOT NULL,
    "settings_version" INTEGER NOT NULL DEFAULT 1,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "status" "OfferStatus" NOT NULL DEFAULT 'active',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "offers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "grade_assessments" (
    "id" TEXT NOT NULL,
    "submission_id" TEXT NOT NULL,
    "seller_id" TEXT NOT NULL,
    "source" "GradeSource" NOT NULL,
    "band" TEXT[],
    "estimate" "Grade" NOT NULL,
    "confidence" INTEGER NOT NULL,
    "confidence_level" "ConfidenceLevel" NOT NULL,
    "factors" JSONB NOT NULL,
    "final_grade" "Grade",
    "set_by" TEXT,
    "component_grades" JSONB,
    "variance" DOUBLE PRECISION,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "grade_assessments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "bookings" (
    "id" TEXT NOT NULL,
    "submission_id" TEXT NOT NULL,
    "hub_id" TEXT NOT NULL,
    "seller_id" TEXT NOT NULL,
    "date" TEXT NOT NULL,
    "slot" TEXT NOT NULL,
    "status" "BookingStatus" NOT NULL DEFAULT 'booked',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "bookings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "inspection_reports" (
    "id" TEXT NOT NULL,
    "type" "InspectionType" NOT NULL,
    "submission_id" TEXT,
    "hub_id" TEXT NOT NULL,
    "technician_id" TEXT NOT NULL,
    "checklist" JSONB NOT NULL,
    "battery_health" INTEGER NOT NULL,
    "cosmetic_grade" "Grade" NOT NULL,
    "photos" JSONB NOT NULL DEFAULT '[]',
    "computed_grade" "Grade" NOT NULL,
    "component_grades" JSONB NOT NULL,
    "ai_band" TEXT[],
    "verdict" "Verdict" NOT NULL,
    "quoted_amount" INTEGER,
    "revised_amount" INTEGER,
    "seller_decision" "SellerDecision" NOT NULL DEFAULT 'pending',
    "sealed" BOOLEAN NOT NULL DEFAULT false,
    "sealed_at" TIMESTAMP(3),
    "tag_id" TEXT,
    "signature_url" TEXT,
    "scanned_imei" TEXT,
    "blacklist_clear" BOOLEAN NOT NULL DEFAULT false,
    "activation_lock_off" BOOLEAN NOT NULL DEFAULT false,
    "identity_passed" BOOLEAN NOT NULL DEFAULT false,
    "return_recommendation" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "inspection_reports_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "devices" (
    "id" TEXT NOT NULL,
    "submission_id" TEXT NOT NULL,
    "seller_id" TEXT NOT NULL,
    "device_model_id" TEXT NOT NULL,
    "colour" TEXT NOT NULL DEFAULT '',
    "imei" TEXT NOT NULL,
    "tag_id" TEXT NOT NULL,
    "final_grade" "Grade" NOT NULL,
    "payout_option" "PayoutOption" NOT NULL,
    "acquisition_cost" INTEGER NOT NULL,
    "owner" TEXT NOT NULL DEFAULT 'certibuy',
    "custody_at" TEXT NOT NULL,
    "hub_id" TEXT NOT NULL,
    "balance_paid" BOOLEAN NOT NULL DEFAULT false,
    "parts_replaced" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "return_count" INTEGER NOT NULL DEFAULT 0,
    "status" "DeviceStatus" NOT NULL DEFAULT 'in_refurbishment',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "devices_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "listings" (
    "id" TEXT NOT NULL,
    "device_id" TEXT NOT NULL,
    "base_price" INTEGER NOT NULL,
    "current_price" INTEGER NOT NULL,
    "floor_price" INTEGER NOT NULL,
    "ladder_step" INTEGER NOT NULL DEFAULT 0,
    "listed_at" TEXT NOT NULL,
    "reserved_days" INTEGER NOT NULL DEFAULT 0,
    "override_price" INTEGER,
    "override_by" TEXT,
    "override_at" TIMESTAMP(3),
    "warranty_months" INTEGER NOT NULL,
    "status" "ListingStatus" NOT NULL DEFAULT 'active',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "listings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "orders" (
    "id" TEXT NOT NULL,
    "listing_id" TEXT NOT NULL,
    "device_id" TEXT NOT NULL,
    "buyer_id" TEXT NOT NULL,
    "device_price" INTEGER NOT NULL,
    "warranty_addon" BOOLEAN NOT NULL DEFAULT false,
    "warranty_addon_amount" INTEGER NOT NULL DEFAULT 0,
    "total" INTEGER NOT NULL,
    "delivery_name" TEXT NOT NULL DEFAULT '',
    "delivery_phone" TEXT NOT NULL DEFAULT '',
    "delivery_address" TEXT NOT NULL DEFAULT '',
    "payment_method" "PaymentMethod" NOT NULL DEFAULT 'upi',
    "status" "OrderStatus" NOT NULL DEFAULT 'pending',
    "escrow_status" "EscrowStatus" NOT NULL DEFAULT 'hold',
    "paid_at" TIMESTAMP(3),
    "dispatched_at" TIMESTAMP(3),
    "in_transit_at" TIMESTAMP(3),
    "delivered_at" TIMESTAMP(3),
    "return_window_closes_at" TIMESTAMP(3),
    "settled_at" TIMESTAMP(3),
    "refund_amount" INTEGER,
    "refunded_at" TIMESTAMP(3),
    "replacement_device_id" TEXT,
    "hold_expires_at" TIMESTAMP(3),
    "cancelled_at" TIMESTAMP(3),
    "cancel_reason" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "orders_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "escrow_transactions" (
    "id" TEXT NOT NULL,
    "order_id" TEXT NOT NULL,
    "buyer_id" TEXT NOT NULL,
    "type" "EscrowType" NOT NULL,
    "amount" INTEGER NOT NULL,
    "note" TEXT NOT NULL DEFAULT '',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "escrow_transactions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "return_requests" (
    "id" TEXT NOT NULL,
    "order_id" TEXT NOT NULL,
    "buyer_id" TEXT NOT NULL,
    "device_id" TEXT NOT NULL,
    "hub_id" TEXT,
    "reason" "ReturnReason" NOT NULL,
    "buyer_reason_note" TEXT NOT NULL DEFAULT '',
    "note" TEXT NOT NULL DEFAULT '',
    "photos" JSONB NOT NULL DEFAULT '[]',
    "doa_preference" "DoaPreference",
    "status" "ReturnStatus" NOT NULL DEFAULT 'awaiting_reinspection',
    "recommendation" TEXT,
    "report_id" TEXT,
    "outcome" "ReturnOutcome",
    "original_amount" INTEGER,
    "deduction_amount" INTEGER,
    "deduction_label" TEXT,
    "refund_amount" INTEGER,
    "replacement_device_id" TEXT,
    "resolved_by" TEXT,
    "resolved_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "return_requests_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payouts" (
    "id" TEXT NOT NULL,
    "seller_id" TEXT NOT NULL,
    "submission_id" TEXT NOT NULL,
    "device_id" TEXT NOT NULL,
    "type" "PayoutType" NOT NULL,
    "amount" INTEGER NOT NULL,
    "trigger" "PayoutTrigger" NOT NULL,
    "status" "PayoutStatus" NOT NULL DEFAULT 'pending',
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "failure_reason" TEXT NOT NULL DEFAULT '',
    "paid_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "payouts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "exception_cases" (
    "id" TEXT NOT NULL,
    "type" "ExceptionType" NOT NULL,
    "title" TEXT NOT NULL,
    "detail" TEXT NOT NULL DEFAULT '',
    "related_entity" TEXT NOT NULL,
    "related_id" TEXT NOT NULL,
    "status" "ExceptionStatus" NOT NULL DEFAULT 'open',
    "resolution" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "exception_cases_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "activity_log" (
    "id" TEXT NOT NULL,
    "actor_id" TEXT NOT NULL,
    "actor_name" TEXT NOT NULL,
    "text" TEXT NOT NULL,
    "entity" TEXT NOT NULL,
    "entity_id" TEXT NOT NULL,
    "business_date" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "activity_log_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notifications" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "event" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "body" TEXT NOT NULL DEFAULT '',
    "link" TEXT NOT NULL DEFAULT '',
    "read" BOOLEAN NOT NULL DEFAULT false,
    "dedupe_key" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "notifications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "support_requests" (
    "id" TEXT NOT NULL,
    "customer_id" TEXT NOT NULL,
    "topic" "SupportTopic" NOT NULL,
    "related_id" TEXT,
    "message" TEXT NOT NULL,
    "status" "SupportStatus" NOT NULL DEFAULT 'open',
    "reply" TEXT,
    "replied_by" TEXT,
    "replied_at" TIMESTAMP(3),
    "resolved_by" TEXT,
    "resolved_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "support_requests_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payout_attempts" (
    "id" TEXT NOT NULL,
    "payout_id" TEXT NOT NULL,
    "success" BOOLEAN NOT NULL,
    "reference" TEXT NOT NULL DEFAULT '',
    "failure_reason" TEXT NOT NULL DEFAULT '',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "payout_attempts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payment_intents" (
    "id" TEXT NOT NULL,
    "order_id" TEXT NOT NULL,
    "provider" TEXT NOT NULL DEFAULT 'simulated',
    "reference" TEXT NOT NULL DEFAULT '',
    "amount" INTEGER NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "payment_intents_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "shipments" (
    "id" TEXT NOT NULL,
    "order_id" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "advanced_by" TEXT NOT NULL,
    "awb" TEXT NOT NULL DEFAULT '',
    "notes" TEXT NOT NULL DEFAULT '',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "shipments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "outbox" (
    "id" TEXT NOT NULL,
    "to_email" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "event" TEXT NOT NULL,
    "related_id" TEXT,
    "status" "OutboxStatus" NOT NULL DEFAULT 'pending',
    "error" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "outbox_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "file_objects" (
    "id" TEXT NOT NULL,
    "owner_id" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "storage_key" TEXT NOT NULL,
    "size_bytes" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "file_objects_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "settings_history" (
    "id" TEXT NOT NULL,
    "actor_id" TEXT NOT NULL,
    "changes" JSONB NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "settings_history_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "job_runs" (
    "id" TEXT NOT NULL,
    "job_name" TEXT NOT NULL,
    "last_run_at" TIMESTAMP(3),
    "business_date" TEXT,
    "counts" JSONB NOT NULL DEFAULT '{}',
    "cursor" TEXT,
    "status" "JobStatus" NOT NULL DEFAULT 'idle',
    "error" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "job_runs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "invitations" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "app_role" "AppRole" NOT NULL,
    "hub_id" TEXT,
    "invited_by" TEXT NOT NULL,
    "status" "InvitationStatus" NOT NULL DEFAULT 'pending',
    "expires_at" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "invitations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "idempotency_keys" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "response" JSONB NOT NULL,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "idempotency_keys_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "rate_limits" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "count" INTEGER NOT NULL DEFAULT 0,
    "window_start" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "rate_limits_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "liquidity_scores_device_model_id_is_current_idx" ON "liquidity_scores"("device_model_id", "is_current");

-- CreateIndex
CREATE UNIQUE INDEX "blacklisted_imeis_imei_key" ON "blacklisted_imeis"("imei");

-- CreateIndex
CREATE INDEX "submissions_seller_id_status_created_at_idx" ON "submissions"("seller_id", "status", "created_at" DESC);

-- CreateIndex
CREATE INDEX "offers_submission_id_status_created_at_idx" ON "offers"("submission_id", "status", "created_at" DESC);

-- CreateIndex
CREATE INDEX "offers_status_expires_at_idx" ON "offers"("status", "expires_at");

-- CreateIndex
CREATE UNIQUE INDEX "bookings_submission_id_key" ON "bookings"("submission_id");

-- CreateIndex
CREATE INDEX "bookings_hub_id_date_status_idx" ON "bookings"("hub_id", "date", "status");

-- CreateIndex
CREATE UNIQUE INDEX "inspection_reports_submission_id_key" ON "inspection_reports"("submission_id");

-- CreateIndex
CREATE UNIQUE INDEX "devices_submission_id_key" ON "devices"("submission_id");

-- CreateIndex
CREATE INDEX "devices_owner_status_idx" ON "devices"("owner", "status");

-- CreateIndex
CREATE INDEX "devices_device_model_id_idx" ON "devices"("device_model_id");

-- CreateIndex
CREATE UNIQUE INDEX "listings_device_id_key" ON "listings"("device_id");

-- CreateIndex
CREATE INDEX "listings_status_current_price_idx" ON "listings"("status", "current_price");

-- CreateIndex
CREATE INDEX "orders_buyer_id_created_at_idx" ON "orders"("buyer_id", "created_at" DESC);

-- CreateIndex
CREATE INDEX "orders_listing_id_idx" ON "orders"("listing_id");

-- CreateIndex
CREATE INDEX "orders_status_delivered_at_idx" ON "orders"("status", "delivered_at");

-- CreateIndex
CREATE INDEX "orders_status_hold_expires_at_idx" ON "orders"("status", "hold_expires_at");

-- CreateIndex
CREATE UNIQUE INDEX "return_requests_report_id_key" ON "return_requests"("report_id");

-- CreateIndex
CREATE INDEX "return_requests_buyer_id_status_idx" ON "return_requests"("buyer_id", "status");

-- CreateIndex
CREATE INDEX "return_requests_status_created_at_idx" ON "return_requests"("status", "created_at" DESC);

-- CreateIndex
CREATE INDEX "payouts_seller_id_created_at_idx" ON "payouts"("seller_id", "created_at" DESC);

-- CreateIndex
CREATE INDEX "payouts_status_idx" ON "payouts"("status");

-- CreateIndex
CREATE INDEX "payouts_device_id_idx" ON "payouts"("device_id");

-- CreateIndex
CREATE INDEX "exception_cases_status_type_idx" ON "exception_cases"("status", "type");

-- CreateIndex
CREATE INDEX "activity_log_business_date_idx" ON "activity_log"("business_date" DESC);

-- CreateIndex
CREATE UNIQUE INDEX "notifications_dedupe_key_key" ON "notifications"("dedupe_key");

-- CreateIndex
CREATE INDEX "notifications_user_id_read_created_at_idx" ON "notifications"("user_id", "read", "created_at" DESC);

-- CreateIndex
CREATE INDEX "support_requests_status_created_at_idx" ON "support_requests"("status", "created_at" DESC);

-- CreateIndex
CREATE UNIQUE INDEX "job_runs_job_name_key" ON "job_runs"("job_name");

-- CreateIndex
CREATE UNIQUE INDEX "idempotency_keys_key_key" ON "idempotency_keys"("key");

-- CreateIndex
CREATE UNIQUE INDEX "rate_limits_key_key" ON "rate_limits"("key");

-- AddForeignKey
ALTER TABLE "profiles" ADD CONSTRAINT "profiles_hub_id_fkey" FOREIGN KEY ("hub_id") REFERENCES "hubs"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "liquidity_scores" ADD CONSTRAINT "liquidity_scores_device_model_id_fkey" FOREIGN KEY ("device_model_id") REFERENCES "device_models"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "submissions" ADD CONSTRAINT "submissions_seller_id_fkey" FOREIGN KEY ("seller_id") REFERENCES "profiles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "submissions" ADD CONSTRAINT "submissions_device_model_id_fkey" FOREIGN KEY ("device_model_id") REFERENCES "device_models"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "offers" ADD CONSTRAINT "offers_submission_id_fkey" FOREIGN KEY ("submission_id") REFERENCES "submissions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "offers" ADD CONSTRAINT "offers_seller_id_fkey" FOREIGN KEY ("seller_id") REFERENCES "profiles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "grade_assessments" ADD CONSTRAINT "grade_assessments_submission_id_fkey" FOREIGN KEY ("submission_id") REFERENCES "submissions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bookings" ADD CONSTRAINT "bookings_submission_id_fkey" FOREIGN KEY ("submission_id") REFERENCES "submissions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bookings" ADD CONSTRAINT "bookings_hub_id_fkey" FOREIGN KEY ("hub_id") REFERENCES "hubs"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bookings" ADD CONSTRAINT "bookings_seller_id_fkey" FOREIGN KEY ("seller_id") REFERENCES "profiles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inspection_reports" ADD CONSTRAINT "inspection_reports_submission_id_fkey" FOREIGN KEY ("submission_id") REFERENCES "submissions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inspection_reports" ADD CONSTRAINT "inspection_reports_hub_id_fkey" FOREIGN KEY ("hub_id") REFERENCES "hubs"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inspection_reports" ADD CONSTRAINT "inspection_reports_technician_id_fkey" FOREIGN KEY ("technician_id") REFERENCES "profiles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "devices" ADD CONSTRAINT "devices_submission_id_fkey" FOREIGN KEY ("submission_id") REFERENCES "submissions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "devices" ADD CONSTRAINT "devices_seller_id_fkey" FOREIGN KEY ("seller_id") REFERENCES "profiles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "devices" ADD CONSTRAINT "devices_device_model_id_fkey" FOREIGN KEY ("device_model_id") REFERENCES "device_models"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "devices" ADD CONSTRAINT "devices_hub_id_fkey" FOREIGN KEY ("hub_id") REFERENCES "hubs"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "listings" ADD CONSTRAINT "listings_device_id_fkey" FOREIGN KEY ("device_id") REFERENCES "devices"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "orders" ADD CONSTRAINT "orders_listing_id_fkey" FOREIGN KEY ("listing_id") REFERENCES "listings"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "orders" ADD CONSTRAINT "orders_device_id_fkey" FOREIGN KEY ("device_id") REFERENCES "devices"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "orders" ADD CONSTRAINT "orders_buyer_id_fkey" FOREIGN KEY ("buyer_id") REFERENCES "profiles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "escrow_transactions" ADD CONSTRAINT "escrow_transactions_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "orders"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "return_requests" ADD CONSTRAINT "return_requests_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "orders"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "return_requests" ADD CONSTRAINT "return_requests_buyer_id_fkey" FOREIGN KEY ("buyer_id") REFERENCES "profiles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "return_requests" ADD CONSTRAINT "return_requests_report_id_fkey" FOREIGN KEY ("report_id") REFERENCES "inspection_reports"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payouts" ADD CONSTRAINT "payouts_seller_id_fkey" FOREIGN KEY ("seller_id") REFERENCES "profiles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payouts" ADD CONSTRAINT "payouts_device_id_fkey" FOREIGN KEY ("device_id") REFERENCES "devices"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "profiles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "support_requests" ADD CONSTRAINT "support_requests_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "profiles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payout_attempts" ADD CONSTRAINT "payout_attempts_payout_id_fkey" FOREIGN KEY ("payout_id") REFERENCES "payouts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
