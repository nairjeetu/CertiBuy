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
