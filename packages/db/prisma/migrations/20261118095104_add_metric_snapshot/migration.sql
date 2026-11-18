-- CreateTable
CREATE TABLE "metric_snapshots" (
    "id" TEXT NOT NULL,
    "metric_name" TEXT NOT NULL,
    "week_start" TEXT NOT NULL,
    "value" DOUBLE PRECISION NOT NULL,
    "computed_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "metric_snapshots_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "metric_snapshots_metric_name_week_start_key" ON "metric_snapshots"("metric_name", "week_start");
