import { randomBytes } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { session } from "@/lib/auth";
import { database, DRAW_COLLECTION } from "@/lib/db";
import { Draw, publicDraw } from "@/lib/draw";
import { drawInput } from "@/lib/validation";

export async function PATCH(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  if ((await session())?.role !== "admin") return NextResponse.json({ error: "Acesso negado." }, { status: 401 });
  const parsed = drawInput.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message || "Dados inválidos." }, { status: 400 });
  const { id } = await context.params;
  const collection = (await database()).collection<Draw>(DRAW_COLLECTION);
  for (let attempt = 0; attempt < 10; attempt++) {
    const current = await collection.findOne({ _id: id, status: "draft" });
    if (!current) return NextResponse.json({ error: "Rascunho não encontrado." }, { status: 404 });
    const requested = new Set((current.signups || []).filter((entry) => entry.status === "pending").map((entry) => entry.email));
    if (parsed.data.participants.some((person) => requested.has(person.email))) {
      return NextResponse.json({ error: "Revise as inscrições pendentes antes de adicionar esses emails manualmente." }, { status: 409 });
    }
    const included = new Set(parsed.data.participants.map((person) => person.email));
    const signups = (current.signups || []).map((entry) => {
      if (entry.status === "pending") return entry;
      const status = included.has(entry.email) ? "approved" as const : "rejected" as const;
      return status === entry.status ? entry : { ...entry, status, reviewedAt: new Date() };
    });
    const draw = await collection.findOneAndUpdate(
      { _id: id, status: "draft", version: current.version },
      { $set: { name: parsed.data.name, participants: parsed.data.participants.map((person) => ({ ...person, id: randomBytes(12).toString("base64url") })), signups }, $inc: { version: 1 } },
      { returnDocument: "after" },
    );
    if (draw) return NextResponse.json({ draw: publicDraw(draw) });
  }
  return NextResponse.json({ error: "O rascunho mudou durante a edição. Tente novamente." }, { status: 409 });
}
