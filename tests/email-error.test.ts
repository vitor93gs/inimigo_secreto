import assert from "node:assert/strict";
import test from "node:test";
import { emailSendError } from "../src/lib/email-error";

test("explains a rejected sender domain", () => {
  assert.match(emailSendError({ statusCode: 403, message: "The domain is not verified" }), /verifique o domínio/);
});

test("explains a rejected API key", () => {
  assert.match(emailSendError({ statusCode: 401, message: "API key is invalid" }), /RESEND_API_KEY/);
});

test("does not expose an unexpected provider message", () => {
  assert.doesNotMatch(emailSendError({ statusCode: 500, message: "sensitive provider detail" }), /sensitive provider detail/);
});
