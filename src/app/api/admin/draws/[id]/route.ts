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
  const draw = await (await database()).collection<Draw>(DRAW_COLLECTION).findOneAndUpdate(
    { _id: id, status: "draft" },
    { $set: { name: parsed.data.name, participants: parsed.data.participants.map((person) => ({ ...person, id: randomBytes(12).toString("base64url") })) }, $inc: { version: 1 } },
    { returnDocument: "after" },
  );
  if (!draw) return NextResponse.json({ error: "Rascunho não encontrado." }, { status: 404 });
  return NextResponse.json({ draw: publicDraw(draw) });
}
