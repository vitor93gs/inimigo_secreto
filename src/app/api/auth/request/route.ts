import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";
import { z } from "zod";
import { database, DRAW_COLLECTION } from "@/lib/db";
import { Draw, normalizeEmail } from "@/lib/draw";
import { newToken, tokenDigest } from "@/lib/auth";

const input = z.object({ email: z.email(), drawId: z.string().optional() });
const generic = { message: "Se este email estiver autorizado, você receberá um link em instantes." };

export async function POST(request: NextRequest) {
  try {
  const parsed = input.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Email inválido." }, { status: 400 });
  const required = ["MONGODB_URI", "ADMIN_EMAIL", "SESSION_SECRET", "RESEND_API_KEY", "EMAIL_FROM", "APP_URL"] as const;
  const missing = required.filter((key) => !process.env[key]);
  if ((process.env.SESSION_SECRET?.length || 0) < 32 && !missing.includes("SESSION_SECRET")) missing.push("SESSION_SECRET");
  let appUrl: URL | null = null;
  try { appUrl = new URL(process.env.APP_URL || ""); } catch { /* handled below */ }
  if (!appUrl || (process.env.NODE_ENV === "production" && appUrl.protocol !== "https:")) {
    if (!missing.includes("APP_URL")) missing.push("APP_URL");
  }
  if (missing.length) {
    console.error(`Configuração de email incompleta: ${missing.join(", ")}`);
    return NextResponse.json({ error: "O acesso por email ainda não foi configurado neste ambiente.", code: "CONFIGURATION_ERROR" }, { status: 503 });
  }
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
  const url = new URL("/api/auth/verify", appUrl!);
  url.searchParams.set("token", token);
  const safeName = drawName.replace(/[&<>"']/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[character] || character);
  try {
    const result = await new Resend(process.env.RESEND_API_KEY!).emails.send({
      from: process.env.EMAIL_FROM!,
      to: email,
      subject: `Seu acesso ao ${drawName}`,
      html: `<p>Seu link para acessar <strong>${safeName}</strong>:</p><p><a href="${url.toString()}">Entrar no Amigo Secreto</a></p><p>O link vale por 15 minutos e só pode ser usado uma vez.</p>`,
    });
    if (result.error) throw result.error;
  } catch (error) {
    await db.collection("loginTokens").deleteOne({ digest });
    console.error("Falha no envio do link de acesso:", error);
    return NextResponse.json({ error: "Não foi possível enviar o email. Tente novamente." }, { status: 503 });
  }
  return NextResponse.json(generic);
  } catch (error) {
    console.error("Falha na solicitação de acesso:", error);
    return NextResponse.json({ error: "O serviço está indisponível no momento. Avise o organizador para verificar a configuração do site." }, { status: 503 });
  }
}
