import { randomInt } from "node:crypto";

export type Participant = { id: string; name: string; email: string };
export type Draw = {
  _id: string;
  name: string;
  participants: Participant[];
  assignments: Record<string, string>;
  status: "draft" | "published";
  version: number;
  createdAt: Date;
  publishedAt?: Date;
};

function canComplete(givers: string[], recipients: string[]): boolean {
  const matches = new Map<string, string>();
  function assign(giver: string, seen: Set<string>): boolean {
    for (const recipient of recipients) {
      if (recipient === giver || seen.has(recipient)) continue;
      seen.add(recipient);
      const previous = matches.get(recipient);
      if (!previous || assign(previous, seen)) {
        matches.set(recipient, giver);
        return true;
      }
    }
    return false;
  }
  return givers.every((giver) => assign(giver, new Set()));
}

export function chooseRecipient(draw: Pick<Draw, "participants" | "assignments">, giverId: string): string | null {
  if (draw.assignments[giverId]) return draw.assignments[giverId];
  const ids = draw.participants.map((person) => person.id);
  if (!ids.includes(giverId)) return null;
  const used = new Set(Object.values(draw.assignments));
  const available = ids.filter((id) => !used.has(id) && id !== giverId);
  const remainingGivers = ids.filter((id) => id !== giverId && !draw.assignments[id]);
  const possible = available.filter((candidate) =>
    canComplete(remainingGivers, ids.filter((id) => !used.has(id) && id !== candidate)),
  );
  return possible.length ? possible[randomInt(possible.length)] : null;
}

export function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

export function publicDraw(draw: Draw) {
  return {
    id: draw._id,
    name: draw.name,
    status: draw.status,
    participants: draw.participants.length,
    completed: Object.keys(draw.assignments).length,
    createdAt: draw.createdAt,
  };
}
