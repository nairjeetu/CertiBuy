import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server";
import { prisma } from "@certibuy/db";
import { withActor, ForbiddenError } from "@certibuy/application";
import type { Actor } from "@certibuy/application";
// ZodError check: match by name since zod is a transitive dep
function isZodError(e: unknown): e is Error & { issues: Array<{ message: string }> } {
  return e instanceof Error && e.constructor.name === "ZodError" && Array.isArray((e as { issues?: unknown }).issues);
}

type CommandHandler = (actor: Actor, body: unknown, now: Date) => Promise<unknown>;
type ViewHandler = (actor: Actor, params: Record<string, string>, now: Date) => Promise<unknown>;

export function commandRoute(handler: CommandHandler) {
  return async (request: Request) => {
    try {
      const actor = await resolveActor();
      const body = await request.json();
      const now = new Date();
      const result = await handler(actor, body, now);
      return NextResponse.json(result);
    } catch (e) {
      return errorResponse(e);
    }
  };
}

export function viewRoute(handler: ViewHandler) {
  return async (request: Request) => {
    try {
      const actor = await resolveActor();
      const url = new URL(request.url);
      const params: Record<string, string> = {};
      url.searchParams.forEach((v, k) => { params[k] = v; });
      const now = new Date();
      const result = await handler(actor, params, now);
      return NextResponse.json(result, {
        headers: { "Cache-Control": "private, no-store" },
      });
    } catch (e) {
      return errorResponse(e);
    }
  };
}

async function resolveActor(): Promise<Actor> {
  return withActor(
    async () => {
      const supabase = await createClient();
      const { data: { user } } = await supabase.auth.getUser();
      return user;
    },
    async (userId) => {
      return prisma.profile.findUnique({ where: { id: userId } });
    },
    async (actor) => actor,
  );
}

function errorResponse(e: unknown): NextResponse {
  if (e instanceof ForbiddenError) {
    return NextResponse.json({ error: e.message }, { status: 403 });
  }
  if (isZodError(e)) {
    const msg = e.issues.map((i) => i.message).join("; ");
    return NextResponse.json({ error: msg || "Invalid input." }, { status: 422 });
  }
  if (e instanceof Error) {
    const statusCode = (e as { statusCode?: number }).statusCode;
    if (statusCode === 409) {
      return NextResponse.json({ error: e.message }, { status: 409 });
    }
    if (e.message.includes("not found") || e.message.includes("Not found")) {
      return NextResponse.json({ error: e.message }, { status: 404 });
    }
    if (e.message.includes("missing") || e.message.includes("required") || e.message.includes("cannot") || e.message.includes("already")) {
      return NextResponse.json({ error: e.message }, { status: 400 });
    }
    console.error("[API]", e);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
  return NextResponse.json({ error: "Internal server error." }, { status: 500 });
}
