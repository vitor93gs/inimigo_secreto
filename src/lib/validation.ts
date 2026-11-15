import { z } from "zod";
import { normalizeEmail } from "./draw";

export const drawInput = z.object({
  name: z.string().trim().min(2).max(80),
  participants: z.array(z.object({
    name: z.string().trim().min(1).max(80),
    email: z.email().transform(normalizeEmail),
  })).min(2).max(100),
}).superRefine((value, context) => {
  const emails = value.participants.map((person) => person.email);
  if (new Set(emails).size !== emails.length) {
    context.addIssue({ code: "custom", message: "Cada email deve aparecer apenas uma vez", path: ["participants"] });
  }
});
