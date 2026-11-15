import { NextResponse } from "next/server";
import { session } from "@/lib/auth";
import { database, DRAW_COLLECTION } from "@/lib/db";
import { Draw, publicDraw } from "@/lib/draw";

export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const draw = await (await database()).collection<Draw>(DRAW_COLLECTION).findOne({ _id: id, status: "published" });
  if (!draw) return NextResponse.json({ error: "Sorteio não encontrado." }, { status: 404 });
  const identity = await session();
  const person = draw.participants.find((entry) => entry.email === identity?.email);
  const recipient = person && draw.assignments[person.id]
    ? draw.participants.find((entry) => entry.id === draw.assignments[person.id]) : null;
  return NextResponse.json({ draw: publicDraw(draw), me: person ? { name: person.name, recipient: recipient?.name || null } : null });
}
