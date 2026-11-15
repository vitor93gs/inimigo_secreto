import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";
import { z } from "zod";
import { database, DRAW_COLLECTION } from "@/lib/db";
import { Draw, normalizeEmail } from "@/lib/draw";
import { newToken, tokenDigest } from "@/lib/auth";

const input = z.object({ email: z.email(), drawId: z.string().optional() });
const generic = { message: "Se este email estiver autorizado, você receberá um link em instantes." };

export async function POST(request: NextRequest) {
  const parsed = input.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Email inválido." }, { status: 400 });
  const email = normalizeEmail(parsed.data.email);
  const drawId = parsed.data.drawId;
  const adminEmail = normalizeEmail(process.env.ADMIN_EMAIL || "");
  const db = await database();
  let allowed = !drawId && email === adminEmail;
  let drawName = "Administração";
  if (drawId) {
    const draw = await db.collection<Draw>(DRAW_COLLECTION).findOne({ _id: drawId, status: "published" });
    allowed = !!draw?.participants.some((person) => person.email === email);
    drawName = draw?.name || "Amigo Secreto";
  }
  if (!allowed) return NextResponse.json(generic);

  const scope = drawId || "admin";
  const bucket = Math.floor(Date.now() / (15 * 60 * 1000));
  const attempt = await db.collection<{ _id: string; count: number; expiresAt: Date }>("loginAttempts")
    .findOneAndUpdate(
      { _id: `${scope}:${email}:${bucket}` },
      { $inc: { count: 1 }, $setOnInsert: { expiresAt: new Date(Date.now() + 60 * 60 * 1000) } },
      { upsert: true, returnDocument: "after" },
    );
  if ((attempt?.count || 0) > 5) return NextResponse.json(generic);

  const token = newToken();
  const digest = tokenDigest(token);
  await db.collection("loginTokens").insertOne({
    digest, email, drawId: drawId || null,
    expiresAt: new Date(Date.now() + 15 * 60 * 1000),
  });
  const appUrl = process.env.APP_URL;
  const from = process.env.EMAIL_FROM;
  const key = process.env.RESEND_API_KEY;
  if (!appUrl || !from || !key) {
    await db.collection("loginTokens").deleteOne({ digest });
    return NextResponse.json({ error: "Envio de email não configurado." }, { status: 503 });
  }
  const url = new URL("/api/auth/verify", appUrl);
  url.searchParams.set("token", token);
  const safeName = drawName.replace(/[&<>"']/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[character] || character);
  const result = await new Resend(key).emails.send({
    from,
    to: email,
    subject: `Seu acesso ao ${drawName}`,
    html: `<p>Seu link para acessar <strong>${safeName}</strong>:</p><p><a href="${url.toString()}">Entrar no Amigo Secreto</a></p><p>O link vale por 15 minutos e só pode ser usado uma vez.</p>`,
  });
  if (result.error) {
    await db.collection("loginTokens").deleteOne({ digest });
    return NextResponse.json({ error: "Não foi possível enviar o email. Tente novamente." }, { status: 503 });
  }
  return NextResponse.json(generic);
}
