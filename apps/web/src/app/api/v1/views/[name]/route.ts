import { NextResponse } from "next/server";
import { viewRoute } from "@/server/api-handler";
import {
  getSellerHome,
  getSubmissionWizard,
  getOfferDetail,
  getHubSlots,
  getDealTracker,
  getSellerPayouts,
  getDeviceCatalogue,
  getWorkspaceContext,
  getHubQueue,
  getHubJob,
  getShopHome,
  getShopCatalogue,
  getListingDetail,
  getCheckout,
  getShopGrades,
  getMyOrders,
  getOrderTracking,
  getOrderReceipt,
  getReturnOptions,
  getOpsOverview,
  getAlerts,
  getCatalogue,
  getPricingSettings,
  getLiquidityBoard,
  getInventory,
  getExceptions,
  getHubList,
  getUserList,
  getMetricsData,
  getDemoControls,
  getJobHistory,
  getSupportInbox,
  getAuditLog,
  getMailLog,
} from "@certibuy/application";

const handlers: Record<string, ReturnType<typeof viewRoute>> = {
  sellerHome: viewRoute((actor) => getSellerHome(actor)),
  submissionWizard: viewRoute((actor, params) =>
    getSubmissionWizard(actor, params.submissionId ?? ""),
  ),
  offerDetail: viewRoute((actor, params) =>
    getOfferDetail(actor, params.submissionId ?? ""),
  ),
  hubSlots: viewRoute((actor, _params, now) => getHubSlots(actor, now)),
  dealTracker: viewRoute((actor, params) =>
    getDealTracker(actor, params.submissionId ?? ""),
  ),
  sellerPayouts: viewRoute((actor) => getSellerPayouts(actor)),
  deviceCatalogue: viewRoute((actor) => getDeviceCatalogue(actor)),
  workspaceContext: viewRoute((_actor, _params, now) => getWorkspaceContext(now)),
  // Hub views (T-01 … T-06)
  hubQueue: viewRoute((actor, params, now) => getHubQueue(actor, params, now)),
  hubJob: viewRoute((actor, params, now) => getHubJob(actor, params, now)),
  // Buyer views (B-01 … B-09)
  shopHome: viewRoute((actor) => getShopHome(actor)),
  shopCatalogue: viewRoute((actor, params, now) => getShopCatalogue(actor, params, now)),
  listingDetail: viewRoute((actor, params) => getListingDetail(actor, params.listingId ?? "")),
  checkout: viewRoute((actor, params) => getCheckout(actor, params.listingId ?? "")),
  shopGrades: viewRoute((actor) => getShopGrades(actor)),
  myOrders: viewRoute((actor) => getMyOrders(actor)),
  orderTracking: viewRoute((actor, params, now) => getOrderTracking(actor, params.orderId ?? "", now)),
  orderReceipt: viewRoute((actor, params) => getOrderReceipt(actor, params.orderId ?? "")),
  returnOptions: viewRoute((actor, params, now) => getReturnOptions(actor, params.orderId ?? "", now)),
  // Ops views (O-01 … O-15)
  opsOverview: viewRoute((actor, params, now) => getOpsOverview(actor, params, now)),
  opsAlerts: viewRoute((actor, params) => getAlerts(actor, params)),
  opsCatalogue: viewRoute((actor) => getCatalogue(actor)),
  opsPricing: viewRoute((actor) => getPricingSettings(actor)),
  opsLiquidity: viewRoute((actor) => getLiquidityBoard(actor)),
  opsInventory: viewRoute((actor, params) => getInventory(actor, params)),
  opsExceptions: viewRoute((actor, params) => getExceptions(actor, params)),
  opsHubs: viewRoute((actor, params, now) => getHubList(actor, params, now)),
  opsUsers: viewRoute((actor, params) => getUserList(actor, params)),
  opsMetrics: viewRoute((actor) => getMetricsData(actor)),
  opsDemoControls: viewRoute((actor, params, now) => getDemoControls(actor, params, now)),
  opsJobHistory: viewRoute((actor) => getJobHistory(actor)),
  opsSupportInbox: viewRoute((actor, params) => getSupportInbox(actor, params)),
  opsAuditLog: viewRoute((actor, params) => getAuditLog(actor, params)),
  opsMailLog: viewRoute((actor) => getMailLog(actor)),
};

export async function GET(
  request: Request,
  { params }: { params: Promise<{ name: string }> },
) {
  const { name } = await params;
  const handler = handlers[name];
  if (!handler) {
    return NextResponse.json({ error: `Unknown view: ${name}` }, { status: 404 });
  }
  return handler(request);
}
