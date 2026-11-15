import { NextResponse } from "next/server";
import { session } from "@/lib/auth";
import { database, DRAW_COLLECTION } from "@/lib/db";
import { Draw, publicDraw } from "@/lib/draw";

export async function POST(_request: Request, context: { params: Promise<{ id: string }> }) {
  if ((await session())?.role !== "admin") return NextResponse.json({ error: "Acesso negado." }, { status: 401 });
  const { id } = await context.params;
  const draw = await (await database()).collection<Draw>(DRAW_COLLECTION).findOneAndUpdate(
    { _id: id, status: "draft" },
    { $set: { status: "published", publishedAt: new Date() }, $inc: { version: 1 } },
    { returnDocument: "after" },
  );
  if (!draw) return NextResponse.json({ error: "Rascunho não encontrado." }, { status: 404 });
  return NextResponse.json({ draw: publicDraw(draw) });
}
