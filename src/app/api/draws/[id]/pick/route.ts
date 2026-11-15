import { NextResponse } from "next/server";
import { session } from "@/lib/auth";
import { database, DRAW_COLLECTION } from "@/lib/db";
import { chooseRecipient, Draw } from "@/lib/draw";

export async function POST(_request: Request, context: { params: Promise<{ id: string }> }) {
  const identity = await session();
  if (!identity) return NextResponse.json({ error: "Entre com seu email primeiro." }, { status: 401 });
  const { id } = await context.params;
  const collection = (await database()).collection<Draw>(DRAW_COLLECTION);
  for (let attempt = 0; attempt < 10; attempt++) {
    const draw = await collection.findOne({ _id: id, status: "published" });
    if (!draw) return NextResponse.json({ error: "Sorteio não encontrado." }, { status: 404 });
    const giver = draw.participants.find((person) => person.email === identity.email);
    if (!giver) return NextResponse.json({ error: "Você não participa deste sorteio." }, { status: 403 });
    const recipientId = chooseRecipient(draw, giver.id);
    if (!recipientId) return NextResponse.json({ error: "Não foi possível completar o sorteio." }, { status: 409 });
    if (draw.assignments[giver.id]) return NextResponse.json({ recipient: draw.participants.find((person) => person.id === recipientId)?.name });
    const result = await collection.updateOne(
      { _id: id, status: "published", version: draw.version },
      { $set: { [`assignments.${giver.id}`]: recipientId }, $inc: { version: 1 } },
    );
    if (result.modifiedCount) return NextResponse.json({ recipient: draw.participants.find((person) => person.id === recipientId)?.name });
  }
  return NextResponse.json({ error: "Muitas pessoas sorteando ao mesmo tempo. Tente novamente." }, { status: 409 });
}
