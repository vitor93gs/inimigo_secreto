import assert from "node:assert/strict";
import test from "node:test";
import { emailSendError, gmailSendError } from "../src/lib/email-error";

test("explains a rejected sender domain", () => {
  assert.match(emailSendError({ statusCode: 403, message: "The domain is not verified" }), /verifique o domínio/);
});

test("explains a rejected API key", () => {
  assert.match(emailSendError({ statusCode: 401, message: "API key is invalid" }), /RESEND_API_KEY/);
});

test("does not expose an unexpected provider message", () => {
  assert.doesNotMatch(emailSendError({ statusCode: 500, message: "sensitive provider detail" }), /sensitive provider detail/);
});

test("explains Gmail app password rejection without exposing SMTP details", () => {
  assert.match(gmailSendError({ code: "EAUTH", responseCode: 535 }), /GMAIL_APP_PASSWORD/);
  assert.doesNotMatch(gmailSendError({ code: "EAUTH", response: "private SMTP detail" }), /private SMTP detail/);
});
