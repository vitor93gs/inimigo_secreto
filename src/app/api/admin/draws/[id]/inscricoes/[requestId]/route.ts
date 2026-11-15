import { randomBytes } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { session } from "@/lib/auth";
import { database, DRAW_COLLECTION } from "@/lib/db";
import { Draw } from "@/lib/draw";

const decisionInput = z.object({ decision: z.enum(["approve", "reject"]) });

export async function POST(request: NextRequest, context: { params: Promise<{ id: string; requestId: string }> }) {
  if ((await session())?.role !== "admin") return NextResponse.json({ error: "Acesso negado." }, { status: 401 });
  const parsed = decisionInput.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Decisão inválida." }, { status: 400 });
  const { id, requestId } = await context.params;
  const collection = (await database()).collection<Draw>(DRAW_COLLECTION);

  for (let attempt = 0; attempt < 10; attempt++) {
    const draw = await collection.findOne({ _id: id, status: "draft" });
    if (!draw) return NextResponse.json({ error: "Rascunho não encontrado." }, { status: 404 });
    const signup = (draw.signups || []).find((entry) => entry.id === requestId);
    if (!signup) return NextResponse.json({ error: "Inscrição não encontrada." }, { status: 404 });
    if (signup.status === "approved") return NextResponse.json({ error: "Esta inscrição já foi aprovada." }, { status: 409 });
    if (parsed.data.decision === "approve") {
      if (draw.participants.length >= 100) return NextResponse.json({ error: "O limite de 100 participantes foi atingido." }, { status: 409 });
      if (draw.participants.some((person) => person.email === signup.email)) {
        return NextResponse.json({ error: "Este email já está na lista de participantes." }, { status: 409 });
      }
    }
    const signups = (draw.signups || []).map((entry) => entry.id === requestId
      ? { ...entry, status: parsed.data.decision === "approve" ? "approved" as const : "rejected" as const, reviewedAt: new Date() }
      : entry);
    const participants = parsed.data.decision === "approve"
      ? [...draw.participants, { id: randomBytes(12).toString("base64url"), name: signup.name, email: signup.email }]
      : draw.participants;
    const result = await collection.updateOne(
      { _id: id, status: "draft", version: draw.version },
      { $set: { signups, participants }, $inc: { version: 1 } },
    );
    if (result.modifiedCount) return NextResponse.json({ reviewed: true });
  }
  return NextResponse.json({ error: "As inscrições mudaram durante a revisão. Tente novamente." }, { status: 409 });
}
