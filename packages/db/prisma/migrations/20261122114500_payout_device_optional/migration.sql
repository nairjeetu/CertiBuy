-- A mismatch fee is charged when the device goes back to the seller, so no
-- Device row exists to reference. Allow payouts that are not tied to a device.
ALTER TABLE "payouts" ALTER COLUMN "device_id" DROP NOT NULL;
