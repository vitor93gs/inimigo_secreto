import assert from "node:assert/strict";
import { createHash, randomBytes } from "node:crypto";
import { MongoClient } from "mongodb";

process.loadEnvFile(".env.local");
const dbName = process.env.TEST_MONGODB_DB;
if (!dbName?.startsWith("inimigo_secreto_test_")) throw new Error("Use a unique TEST_MONGODB_DB beginning with inimigo_secreto_test_");
const base = process.env.TEST_BASE_URL || "http://localhost:3001";
const client = new MongoClient(process.env.MONGODB_URI);
await client.connect();
const db = client.db(dbName);

async function api(path, { method = "GET", cookie, body } = {}) {
  const response = await fetch(`${base}${path}`, {
    method, redirect: "manual",
    headers: { ...(cookie ? { Cookie: cookie } : {}), ...(body ? { "Content-Type": "application/json" } : {}) },
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = response.headers.get("content-type")?.includes("application/json") ? await response.json() : null;
  return { response, data };
}

async function signIn(email, drawId = null, expired = false) {
  const token = randomBytes(32).toString("base64url");
  await db.collection("loginTokens").insertOne({
    digest: createHash("sha256").update(token).digest("hex"), email, drawId,
    expiresAt: new Date(Date.now() + (expired ? -1000 : 15 * 60 * 1000)),
  });
  const result = await api(`/api/auth/verify?token=${token}`);
  return { ...result, token, cookie: result.response.headers.get("set-cookie")?.split(";")[0] };
}

const people = [
  { name: "Alice", email: "alice@test.example" },
  { name: "Bruno", email: "bruno@test.example" },
  { name: "Carla", email: "carla@test.example" },
];

try {
  assert.equal((await api("/api/admin/draws")).response.status, 401);
  const expired = await signIn(process.env.ADMIN_EMAIL, null, true);
  assert.match(expired.response.headers.get("location") || "", /acesso-invalido/);
  const admin = await signIn(process.env.ADMIN_EMAIL);
  assert.ok(admin.cookie);
  assert.match(admin.response.headers.get("location") || "", /\/admin$/);
  assert.match((await api(`/api/auth/verify?token=${admin.token}`)).response.headers.get("location") || "", /acesso-invalido/);

  const first = await api("/api/admin/draws", { method: "POST", cookie: admin.cookie, body: { name: "Novembro 2026", participants: people } });
  const second = await api("/api/admin/draws", { method: "POST", cookie: admin.cookie, body: { name: "Dezembro 2026", participants: people } });
  assert.equal(first.response.status, 201);
  assert.equal(second.response.status, 201);
  const a = first.data.draw.id;
  const b = second.data.draw.id;
  assert.notEqual(a, b);
  assert.equal((await api(`/api/draws/${a}`)).response.status, 404);
  assert.equal((await api(`/api/admin/draws/${a}`, { method: "PATCH", cookie: admin.cookie, body: { name: "Novembro atualizado", participants: people } })).response.status, 200);
  assert.equal((await api(`/api/admin/draws/${a}/publish`, { method: "POST", cookie: admin.cookie })).response.status, 200);
  assert.equal((await api(`/api/admin/draws/${b}/publish`, { method: "POST", cookie: admin.cookie })).response.status, 200);
  assert.equal((await api(`/api/admin/draws/${a}`, { method: "PATCH", cookie: admin.cookie, body: { name: "Não permitido", participants: people } })).response.status, 404);

  const unknown = await api("/api/auth/request", { method: "POST", body: { email: "unknown@test.example", drawId: a } });
  assert.equal(unknown.response.status, 200);
  assert.equal(await db.collection("loginTokens").countDocuments({ email: "unknown@test.example" }), 0);

  const users = await Promise.all(people.map((person) => signIn(person.email, a)));
  assert.ok(users.every((user) => user.cookie));
  assert.equal((await api("/api/admin/draws", { cookie: users[0].cookie })).response.status, 401);
  const picks = await Promise.all(users.map((user) => api(`/api/draws/${a}/pick`, { method: "POST", cookie: user.cookie })));
  assert.ok(picks.every((pick) => pick.response.status === 200), JSON.stringify(picks.map((pick) => pick.response.status)));
  const recipients = picks.map((pick) => pick.data.recipient);
  assert.equal(new Set(recipients).size, people.length);
  people.forEach((person, index) => assert.notEqual(recipients[index], person.name));
  assert.equal((await api(`/api/draws/${a}/pick`, { method: "POST", cookie: users[0].cookie })).data.recipient, recipients[0]);
  const own = await api(`/api/draws/${a}`, { cookie: users[0].cookie });
  assert.equal(own.data.me.recipient, recipients[0]);
  assert.equal(own.data.draw.completed, people.length);
  assert.equal(own.data.draw.participants, people.length);
  assert.equal(JSON.stringify(own.data).includes("alice@test.example"), false);
  assert.equal((await api(`/api/draws/${b}`)).data.draw.completed, 0);
  const otherRound = await signIn(people[0].email, b);
  assert.equal((await api(`/api/draws/${b}/pick`, { method: "POST", cookie: otherRound.cookie })).response.status, 200);
  assert.equal((await api(`/api/draws/${b}`)).data.draw.completed, 1);
  console.log("Integration checks passed: authentication, isolation, publishing, privacy, and concurrent picks.");
} finally {
  await db.dropDatabase();
  await client.close();
}
