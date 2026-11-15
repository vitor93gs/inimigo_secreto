import assert from "node:assert/strict";
import test from "node:test";
import { chooseRecipient, type Participant } from "../src/lib/draw";

function people(count: number): Participant[] {
  return Array.from({ length: count }, (_, index) => ({ id: `p${index}`, name: `Pessoa ${index}`, email: `p${index}@test.local` }));
}

test("each draw completes with unique recipients and no self assignment", () => {
  for (let count = 2; count <= 12; count++) {
    for (let run = 0; run < 150; run++) {
      const participants = people(count);
      const assignments: Record<string, string> = {};
      const order = [...participants].sort(() => Math.random() - 0.5);
      for (const giver of order) {
        const recipient = chooseRecipient({ participants, assignments }, giver.id);
        assert.ok(recipient);
        assert.notEqual(recipient, giver.id);
        assert.ok(!Object.values(assignments).includes(recipient));
        assignments[giver.id] = recipient;
        assert.equal(chooseRecipient({ participants, assignments }, giver.id), recipient);
      }
      assert.equal(Object.keys(assignments).length, count);
      assert.equal(new Set(Object.values(assignments)).size, count);
    }
  }
});

test("separate draws can contain the same people without sharing assignments", () => {
  const participants = people(4);
  const first = { participants, assignments: {} as Record<string, string> };
  const second = { participants, assignments: {} as Record<string, string> };
  first.assignments.p0 = chooseRecipient(first, "p0")!;
  assert.equal(Object.keys(second.assignments).length, 0);
  assert.ok(chooseRecipient(second, "p0"));
});

test("unknown participant cannot draw", () => {
  assert.equal(chooseRecipient({ participants: people(3), assignments: {} }, "unknown"), null);
});
