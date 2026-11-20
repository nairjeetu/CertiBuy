import { NextResponse } from "next/server";
import { validatedCommandRoute } from "@/server/api-handler";
import { commandSchemas } from "@certibuy/contracts";
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
  runDailyJobs,
  advanceDemoClock,
  recalcLiquidity,
  computeMetrics,
  resolveException,
  updateSettings,
  togglePayoutFailure,
  saveDeviceModel,
  markRefurbishedAndList,
  liquidateDevice,
  repriceListing,
  setOverridePrice,
  pauseIcForModel,
  markNotificationsRead,
  updateProfile,
} from "@certibuy/application";

function v(name: string, handler: (actor: any, body: any, now: Date) => Promise<unknown>) {
  const schema = commandSchemas[name];
  if (!schema) throw new Error(`No schema for command: ${name}`);
  return validatedCommandRoute(schema, handler);
}

const handlers: Record<string, ReturnType<typeof validatedCommandRoute>> = {
  saveSubmissionDetails: v("saveSubmissionDetails", (actor, body, now) =>
    saveSubmissionDetails(actor, body, now),
  ),
  saveDiagnostics: v("saveDiagnostics", (actor, body) =>
    saveDiagnostics(actor, body),
  ),
  saveSubmissionPhotos: v("saveSubmissionPhotos", (actor, body) =>
    savePhotos(actor, body),
  ),
  gradeSubmission: v("gradeSubmission", (actor, body, now) =>
    gradeSubmission(actor, body, now),
  ),
  computeOffer: v("computeOffer", (actor, body, now) =>
    recomputeOffer(actor, body, now),
  ),
  icEligibility: v("icEligibility", (actor, body, now) =>
    checkIcEligibility(actor, body, now),
  ),
  acceptOffer: v("acceptOffer", (actor, body, now) =>
    acceptOffer(actor, body, now),
  ),
  manageBooking: v("manageBooking", (actor, body, now) =>
    manageBooking(actor, body, now),
  ),
  bookInspection: v("bookInspection", (actor, body, now) =>
    bookInspection(actor, body, now),
  ),
  verifyIdentity: v("verifyIdentity", (actor, body) =>
    verifyIdentity(actor, body),
  ),
  confirmGrade: v("confirmGrade", (actor, body, now) =>
    confirmGrade(actor, body, now),
  ),
  reviseOffer: v("reviseOffer", (actor, body, now) =>
    reviseOffer(actor, body, now),
  ),
  acceptRevised: v("acceptRevised", (actor, body) =>
    acceptRevised(actor, body),
  ),
  declineRevised: v("declineRevised", (actor, body) =>
    declineRevised(actor, body),
  ),
  rejectForMismatch: v("rejectForMismatch", (actor, body, now) =>
    rejectForMismatch(actor, body, now),
  ),
  rejectDevice: v("rejectDevice", (actor, body, now) =>
    rejectDevice(actor, body, now),
  ),
  completeHandover: v("completeHandover", (actor, body, now) =>
    completeHandover(actor, body, now),
  ),
  placeOrder: v("placeOrder", (actor, body, now) =>
    placeOrder(actor, body, now),
  ),
  cancelOrder: v("cancelOrder", (actor, body, now) =>
    cancelOrder(actor, body, now),
  ),
  advanceShipment: v("advanceShipment", (actor, body, now) =>
    advanceShipment(actor, body, now),
  ),
  raiseReturn: v("raiseReturn", (actor, body, now) =>
    raiseReturn(actor, body, now),
  ),
  resolveReturn: v("resolveReturn", (actor, body, now) =>
    resolveReturn(actor, body, now),
  ),
  runDailyJobs: v("runDailyJobs", (actor, body, now) =>
    runDailyJobs(actor, body, now),
  ),
  advanceDemoClock: v("advanceDemoClock", (actor, body, now) =>
    advanceDemoClock(actor, body, now),
  ),
  recalcLiquidity: v("recalcLiquidity", (actor, body, now) =>
    recalcLiquidity(actor, body, now),
  ),
  computeMetrics: v("computeMetrics", (actor, body, now) =>
    computeMetrics(actor, body, now),
  ),
  resolveException: v("resolveException", (actor, body, now) =>
    resolveException(actor, body, now),
  ),
  updateSettings: v("updateSettings", (actor, body, now) =>
    updateSettings(actor, body, now),
  ),
  togglePayoutFailure: v("togglePayoutFailure", (actor, body, now) =>
    togglePayoutFailure(actor, body, now),
  ),
  saveDeviceModel: v("saveDeviceModel", (actor, body, now) =>
    saveDeviceModel(actor, body, now),
  ),
  markRefurbishedAndList: v("markRefurbishedAndList", (actor, body, now) =>
    markRefurbishedAndList(actor, body, now),
  ),
  liquidateDevice: v("liquidateDevice", (actor, body, now) =>
    liquidateDevice(actor, body, now),
  ),
  repriceListing: v("repriceListing", (actor, body, now) =>
    repriceListing(actor, body, now),
  ),
  setOverridePrice: v("setOverridePrice", (actor, body, now) =>
    setOverridePrice(actor, body, now),
  ),
  pauseIcForModel: v("pauseIcForModel", (actor, body, now) =>
    pauseIcForModel(actor, body, now),
  ),
  markNotificationsRead: v("markNotificationsRead", (actor, body) =>
    markNotificationsRead(actor, body),
  ),
  updateProfile: v("updateProfile", (actor, body) =>
    updateProfile(actor, body),
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
