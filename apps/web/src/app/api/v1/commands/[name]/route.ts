import { NextResponse } from "next/server";
import { commandRoute } from "@/server/api-handler";
import {
  saveSubmissionDetails,
  saveDiagnostics,
  savePhotos,
  gradeSubmission,
  recomputeOffer,
  checkIcEligibility,
  acceptOffer,
  manageBooking,
  bookInspection,
} from "@certibuy/application";

const handlers: Record<string, ReturnType<typeof commandRoute>> = {
  saveSubmissionDetails: commandRoute((actor, body, now) =>
    saveSubmissionDetails(actor, body as Parameters<typeof saveSubmissionDetails>[1], now),
  ),
  saveDiagnostics: commandRoute((actor, body) =>
    saveDiagnostics(actor, body as Parameters<typeof saveDiagnostics>[1]),
  ),
  saveSubmissionPhotos: commandRoute((actor, body) =>
    savePhotos(actor, body as Parameters<typeof savePhotos>[1]),
  ),
  gradeSubmission: commandRoute((actor, body, now) =>
    gradeSubmission(actor, body as Parameters<typeof gradeSubmission>[1], now),
  ),
  computeOffer: commandRoute((actor, body, now) =>
    recomputeOffer(actor, body as Parameters<typeof recomputeOffer>[1], now),
  ),
  icEligibility: commandRoute((actor, body, now) =>
    checkIcEligibility(actor, body as Parameters<typeof checkIcEligibility>[1], now),
  ),
  acceptOffer: commandRoute((actor, body, now) =>
    acceptOffer(actor, body as Parameters<typeof acceptOffer>[1], now),
  ),
  manageBooking: commandRoute((actor, body, now) =>
    manageBooking(actor, body as Parameters<typeof manageBooking>[1], now),
  ),
  bookInspection: commandRoute((actor, body, now) =>
    bookInspection(actor, body as Parameters<typeof bookInspection>[1], now),
  ),
};

export async function POST(
  request: Request,
  { params }: { params: Promise<{ name: string }> },
) {
  const { name } = await params;
  const handler = handlers[name];
  if (!handler) {
    return NextResponse.json({ error: `Unknown command: ${name}` }, { status: 404 });
  }
  return handler(request);
}
