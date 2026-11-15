import assert from "node:assert/strict";
import test from "node:test";
import { readApiResponse } from "../src/lib/api-response";

test("an empty server error becomes a useful message", async () => {
  const data = await readApiResponse<object>(new Response(null, { status: 500 }));
  assert.match(data.error || "", /serviço está indisponível/);
});

test("malformed JSON does not replace the server error with a parsing error", async () => {
  const data = await readApiResponse<object>(new Response("{", { status: 500 }));
  assert.match(data.error || "", /serviço está indisponível/);
});

test("a server-provided error remains visible", async () => {
  const data = await readApiResponse<object>(new Response(JSON.stringify({ error: "Configuração pendente." }), { status: 503 }));
  assert.equal(data.error, "Configuração pendente.");
});
