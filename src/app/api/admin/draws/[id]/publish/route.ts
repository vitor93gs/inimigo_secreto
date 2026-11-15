import { NextResponse } from "next/server";
import { session } from "@/lib/auth";
import { database, DRAW_COLLECTION } from "@/lib/db";
import { Draw, publicDraw } from "@/lib/draw";

export async function POST(_request: Request, context: { params: Promise<{ id: string }> }) {
  if ((await session())?.role !== "admin") return NextResponse.json({ error: "Acesso negado." }, { status: 401 });
  const { id } = await context.params;
  const collection = (await database()).collection<Draw>(DRAW_COLLECTION);
  const draw = await collection.findOneAndUpdate(
    { _id: id, status: "draft", "participants.1": { $exists: true }, signups: { $not: { $elemMatch: { status: "pending" } } } },
    { $set: { status: "published", publishedAt: new Date() }, $inc: { version: 1 } },
    { returnDocument: "after" },
  );
  if (!draw) {
    const current = await collection.findOne({ _id: id, status: "draft" });
    if (!current) return NextResponse.json({ error: "Rascunho não encontrado." }, { status: 404 });
    if (current.participants.length < 2) return NextResponse.json({ error: "Aprove pelo menos duas pessoas antes de publicar." }, { status: 400 });
    return NextResponse.json({ error: "Revise todas as inscrições pendentes antes de publicar." }, { status: 409 });
  }
  return NextResponse.json({ draw: publicDraw(draw) });
}
