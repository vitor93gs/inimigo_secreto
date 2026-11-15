import { createHash, randomBytes } from "node:crypto";
import { cookies } from "next/headers";
import { SignJWT, jwtVerify } from "jose";

export type Identity = { email: string; role: "admin" | "participant" };
const COOKIE = "amigo_session";

function signingKey() {
  const secret = process.env.SESSION_SECRET;
  if (!secret || secret.length < 32) throw new Error("SESSION_SECRET deve ter pelo menos 32 caracteres");
  return new TextEncoder().encode(secret);
}

export async function session(): Promise<Identity | null> {
  const token = (await cookies()).get(COOKIE)?.value;
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, signingKey());
    if (typeof payload.email !== "string" || (payload.role !== "admin" && payload.role !== "participant")) return null;
    return { email: payload.email, role: payload.role };
  } catch {
    return null;
  }
}

export async function setSession(identity: Identity) {
  const token = await new SignJWT(identity)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("30d")
    .sign(signingKey());
  (await cookies()).set(COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });
}

export async function clearSession() {
  (await cookies()).delete(COOKIE);
}

export function newToken() {
  return randomBytes(32).toString("base64url");
}

export function tokenDigest(token: string) {
  return createHash("sha256").update(token).digest("hex");
}
