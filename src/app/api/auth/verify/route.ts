import { NextRequest, NextResponse } from "next/server";
import { database, DRAW_COLLECTION } from "@/lib/db";
import { Draw, normalizeEmail } from "@/lib/draw";
import { setSession, tokenDigest } from "@/lib/auth";

export async function GET(request: NextRequest) {
  const token = request.nextUrl.searchParams.get("token");
  if (!token || token.length > 100) return NextResponse.redirect(new URL("/acesso-invalido", request.url));
  const db = await database();
  const record = await db.collection<{ digest: string; email: string; drawId: string | null; expiresAt: Date }>("loginTokens")
    .findOneAndDelete({ digest: tokenDigest(token) });
  if (!record || record.expiresAt.getTime() < Date.now()) {
    return NextResponse.redirect(new URL("/acesso-invalido", request.url));
  }
  if (record.drawId) {
    const draw = await db.collection<Draw>(DRAW_COLLECTION).findOne({ _id: record.drawId, status: "published" });
    if (!draw?.participants.some((person) => person.email === record.email)) {
      return NextResponse.redirect(new URL("/acesso-invalido", request.url));
    }
  } else if (record.email !== normalizeEmail(process.env.ADMIN_EMAIL || "")) {
    return NextResponse.redirect(new URL("/acesso-invalido", request.url));
  }
  await setSession({ email: record.email, role: record.email === normalizeEmail(process.env.ADMIN_EMAIL || "") ? "admin" : "participant" });
  return NextResponse.redirect(new URL(record.drawId ? `/s/${record.drawId}` : "/admin", request.url));
}
