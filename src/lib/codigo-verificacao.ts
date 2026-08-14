import "server-only";

/**
 * Envio do código de 4 dígitos para os dois endpoints que o validam:
 * `/auth/email/verify` e `/reset-password/verify-code`.
 *
 * ## Por que isto existe
 *
 * O nome do campo é incerto. O `docs/API.md` documenta `code`; este projeto
 * sempre enviou `codigo`. Os DTOs (`VerifyEmailCodeDto`, `VerifyCodeDto`) são
 * publicados VAZIOS no OpenAPI, então a spec não decide a disputa — e a casa já
 * foi mordida por isso antes: o exemplo de `PATCH /progresso-video` documenta
 * `seconds` e a API recusa exatamente esse nome.
 *
 * Enquanto ninguém confirma contra a API de verdade, tentamos `codigo` e, SÓ se
 * a resposta for uma queixa de validação sobre o nome do campo, repetimos com
 * `code`. A troca é registrada no log do servidor para que a dúvida se resolva
 * na primeira vez que alguém usar a tela.
 *
 * ## O cuidado que a repetição exige
 *
 * Código errado também devolve 400. Repetir a chamada nesse caso gastaria duas
 * tentativas do contador da API por digitação errada e poderia travar a conta na
 * metade do tempo. Por isso a repetição depende de a mensagem parecer uma
 * reclamação sobre o CAMPO, não sobre o valor.
 */

/** Mensagens de erro do Nest, achatadas em uma lista. */
function mensagens(corpo: unknown): string[] {
  const bruto = (corpo as { message?: unknown } | null)?.message;
  if (Array.isArray(bruto)) return bruto.map(String);
  if (typeof bruto === "string") return [bruto];
  return [];
}

/**
 * A recusa foi sobre o NOME do campo?
 *
 * Cobre os dois formatos que o `ValidationPipe` produz: `property codigo should
 * not exist` (whitelist) e `code should not be empty` / `code must be a string`
 * (campo obrigatório ausente).
 */
function reclamaDoCampo(corpo: unknown): boolean {
  return mensagens(corpo).some(
    (mensagem) =>
      /^property (codigo|code) should not exist$/i.test(mensagem.trim()) ||
      /^(codigo|code) (should not be empty|must be)/i.test(mensagem.trim()),
  );
}

/**
 * Manda o código e devolve a resposta da API.
 *
 * `rota` é o caminho completo, já com `API_URL`.
 */
export async function enviarCodigo(
  rota: string,
  dados: { email: string; codigo: string },
): Promise<Response> {
  const chamar = (campo: "codigo" | "code") =>
    fetch(rota, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: dados.email, [campo]: dados.codigo }),
      cache: "no-store",
    });

  const primeira = await chamar("codigo");
  if (primeira.ok || primeira.status !== 400) return primeira;

  /*
   * `clone()` porque o corpo só pode ser lido uma vez, e quem chamou ainda pode
   * querer ler o desta resposta se ela for a que voltar.
   */
  const corpo = await primeira
    .clone()
    .json()
    .catch(() => null);

  if (!reclamaDoCampo(corpo)) return primeira;

  const segunda = await chamar("code");

  if (segunda.ok) {
    console.warn(
      `[codigo-verificacao] ${rota} recusou o campo "codigo" e aceitou "code". ` +
        `Fixe o nome no cliente e apague este fallback.`,
    );
  }

  return segunda;
}
