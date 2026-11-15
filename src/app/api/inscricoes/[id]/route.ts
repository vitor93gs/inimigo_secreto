import { randomBytes } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { database, DRAW_COLLECTION } from "@/lib/db";
import { Draw, SignupRequest } from "@/lib/draw";
import { signupInput } from "@/lib/validation";

type Context = { params: Promise<{ id: string }> };

export async function GET(_request: NextRequest, context: Context) {
  const { id } = await context.params;
  const draw = await (await database()).collection<Draw>(DRAW_COLLECTION).findOne(
    { _id: id }, { projection: { name: 1, status: 1 } },
  );
  if (!draw) return NextResponse.json({ error: "Sorteio não encontrado." }, { status: 404 });
  return NextResponse.json({ draw: { id, name: draw.name, status: draw.status } });
}

export async function POST(request: NextRequest, context: Context) {
  const parsed = signupInput.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message || "Dados inválidos." }, { status: 400 });
  const { id } = await context.params;
  const collection = (await database()).collection<Draw>(DRAW_COLLECTION);
  const signup: SignupRequest = {
    id: randomBytes(12).toString("base64url"),
    ...parsed.data,
    status: "pending",
    createdAt: new Date(),
  };
  const result = await collection.updateOne(
    { _id: id, status: "draft", "participants.email": { $ne: signup.email }, "signups.email": { $ne: signup.email }, "signups.199": { $exists: false } },
    { $push: { signups: signup }, $inc: { version: 1 } },
  );
  if (result.modifiedCount) return NextResponse.json({ received: true }, { status: 202 });

  const draw = await collection.findOne({ _id: id }, { projection: { status: 1, signups: 1 } });
  if (!draw) return NextResponse.json({ error: "Sorteio não encontrado." }, { status: 404 });
  if (draw.status !== "draft") return NextResponse.json({ error: "As inscrições para este sorteio foram encerradas." }, { status: 409 });
  if ((draw.signups?.length || 0) >= 200) return NextResponse.json({ error: "O limite de inscrições foi atingido. Fale com o organizador." }, { status: 429 });
  return NextResponse.json({ received: true }, { status: 202 });
}
