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
  verifyIdentity,
  confirmGrade,
  reviseOffer,
  acceptRevised,
  declineRevised,
  rejectForMismatch,
  rejectDevice,
  completeHandover,
  placeOrder,
  cancelOrder,
  advanceShipment,
  raiseReturn,
  resolveReturn,
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
  // Hub commands (T-01 … T-07)
  verifyIdentity: commandRoute((actor, body) =>
    verifyIdentity(actor, body as Parameters<typeof verifyIdentity>[1]),
  ),
  confirmGrade: commandRoute((actor, body, now) =>
    confirmGrade(actor, body as Parameters<typeof confirmGrade>[1], now),
  ),
  reviseOffer: commandRoute((actor, body, now) =>
    reviseOffer(actor, body as Parameters<typeof reviseOffer>[1], now),
  ),
  acceptRevised: commandRoute((actor, body) =>
    acceptRevised(actor, body as Parameters<typeof acceptRevised>[1]),
  ),
  declineRevised: commandRoute((actor, body) =>
    declineRevised(actor, body as Parameters<typeof declineRevised>[1]),
  ),
  rejectForMismatch: commandRoute((actor, body, now) =>
    rejectForMismatch(actor, body as Parameters<typeof rejectForMismatch>[1], now),
  ),
  rejectDevice: commandRoute((actor, body, now) =>
    rejectDevice(actor, body as Parameters<typeof rejectDevice>[1], now),
  ),
  completeHandover: commandRoute((actor, body, now) =>
    completeHandover(actor, body as Parameters<typeof completeHandover>[1], now),
  ),
  // Buying commands (B-05, B-07, B-09, B-12, O-07)
  placeOrder: commandRoute((actor, body, now) =>
    placeOrder(actor, body as Parameters<typeof placeOrder>[1], now),
  ),
  cancelOrder: commandRoute((actor, body, now) =>
    cancelOrder(actor, body as Parameters<typeof cancelOrder>[1], now),
  ),
  advanceShipment: commandRoute((actor, body, now) =>
    advanceShipment(actor, body as Parameters<typeof advanceShipment>[1], now),
  ),
  raiseReturn: commandRoute((actor, body, now) =>
    raiseReturn(actor, body as Parameters<typeof raiseReturn>[1], now),
  ),
  resolveReturn: commandRoute((actor, body, now) =>
    resolveReturn(actor, body as Parameters<typeof resolveReturn>[1], now),
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
