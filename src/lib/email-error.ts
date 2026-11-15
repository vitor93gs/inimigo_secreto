type ProviderError = { name?: unknown; statusCode?: unknown; message?: unknown };

export function emailSendError(error: unknown) {
  const provider = error && typeof error === "object" ? error as ProviderError : {};
  const status = typeof provider.statusCode === "number" ? provider.statusCode : null;
  const message = typeof provider.message === "string" ? provider.message : "";

  if (status === 401 || /api key is invalid/i.test(message)) {
    return "A chave RESEND_API_KEY foi recusada. Confira a chave no painel do Resend.";
  }
  if (status === 403 && /domain|testing emails|from/i.test(message)) {
    return "O remetente foi recusado pelo Resend. Confira EMAIL_FROM e verifique o domínio no Resend.";
  }
  if (status === 429) {
    return "O limite de envios do Resend foi atingido. Tente novamente mais tarde.";
  }
  if (status === 400 || status === 422) {
    return "O Resend recusou os dados do email. Confira EMAIL_FROM no painel da Vercel.";
  }
  return "Não foi possível enviar o email. Confira os Logs do Resend para identificar o erro.";
}
