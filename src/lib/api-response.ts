export async function readApiResponse<T extends object>(response: Response): Promise<T & { error?: string }> {
  const body = await response.text();
  let parsed: unknown = {};
  if (body) {
    try { parsed = JSON.parse(body); } catch { parsed = {}; }
  }
  const data = parsed && typeof parsed === "object" && !Array.isArray(parsed)
    ? parsed as Record<string, unknown>
    : {};
  if (!response.ok && typeof data.error !== "string") {
    data.error = response.status >= 500
      ? "O serviço está indisponível no momento. Avise o organizador para verificar a configuração do site."
      : "Não foi possível concluir a solicitação. Tente novamente.";
  }
  return data as T & { error?: string };
}
