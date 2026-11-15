import { randomBytes } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { session } from "@/lib/auth";
import { database, DRAW_COLLECTION } from "@/lib/db";
import { Draw, publicDraw } from "@/lib/draw";
import { drawInput } from "@/lib/validation";

export async function GET() {
  if ((await session())?.role !== "admin") return NextResponse.json({ error: "Acesso negado." }, { status: 401 });
  const draws = await (await database()).collection<Draw>(DRAW_COLLECTION).find().sort({ createdAt: -1 }).toArray();
  return NextResponse.json({ draws: draws.map((draw) => ({
    ...publicDraw(draw),
    participantsList: draw.participants.map(({ name, email }) => ({ name, email })),
    signups: (draw.signups || []).map(({ id, name, email, status, createdAt }) => ({ id, name, email, status, createdAt })),
  })) });
}

export async function POST(request: NextRequest) {
  if ((await session())?.role !== "admin") return NextResponse.json({ error: "Acesso negado." }, { status: 401 });
  const parsed = drawInput.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message || "Dados inválidos." }, { status: 400 });
  const draw: Draw = {
    _id: randomBytes(16).toString("base64url"),
    name: parsed.data.name,
    participants: parsed.data.participants.map((person) => ({ ...person, id: randomBytes(12).toString("base64url") })),
    signups: [], assignments: {}, status: "draft", version: 0, createdAt: new Date(),
  };
  await (await database()).collection<Draw>(DRAW_COLLECTION).insertOne(draw);
  return NextResponse.json({ draw: publicDraw(draw) }, { status: 201 });
}
