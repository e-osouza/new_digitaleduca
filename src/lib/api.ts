import "server-only";
import { lerToken } from "@/lib/session";

export const API_URL =
  process.env.NEXT_PUBLIC_API_URL ?? "https://api.digitaleduca.com.vc";

export class ApiError extends Error {
  constructor(
    readonly status: number,
    readonly rota: string,
    mensagem: string,
  ) {
    super(mensagem);
    this.name = "ApiError";
  }

  get naoAutenticado() {
    return this.status === 401;
  }

  get semPermissao() {
    return this.status === 403;
  }

  get naoEncontrado() {
    return this.status === 404;
  }

  /**
   * Conteúdo existe, o usuário está autenticado, mas a assinatura não cobre.
   *
   * A sessão já foi validada pelo layout da plataforma, então um 403 aqui só
   * pode ser falta de acesso — inclusive no formato genérico do Nest
   * ("Forbidden resource"). A API também usa 400 para o mesmo caso, com a
   * mensagem "Usuário não possui acesso a este conteúdo"; nesse status
   * conferimos o texto para não confundir com erro de validação.
   */
  get semAssinatura() {
    if (this.status === 403) return true;
    if (this.status !== 400) return false;
    return /acesso|assinatura|permiss/i.test(this.message);
  }
}

type Opcoes = RequestInit & {
  /** Anexa o JWT da sessão. Necessário na maior parte da API. */
  autenticado?: boolean;
  /** Segundos de cache no Data Cache do Next. `false` desliga. */
  revalidar?: number | false;
};

/**
 * Cliente HTTP da API DigitalEduca. Só roda no servidor: o JWT fica num cookie
 * httpOnly e nunca é entregue ao JavaScript do browser.
 */
export async function api<T>(rota: string, opcoes: Opcoes = {}): Promise<T> {
  const { autenticado = false, revalidar, headers, ...init } = opcoes;

  const cabecalhos = new Headers(headers);
  if (!cabecalhos.has("Accept")) cabecalhos.set("Accept", "application/json");

  if (autenticado) {
    const token = await lerToken();
    if (!token) throw new ApiError(401, rota, "Sessão ausente ou expirada.");
    cabecalhos.set("Authorization", `Bearer ${token}`);
  }

  const resposta = await fetch(`${API_URL}${rota}`, {
    ...init,
    headers: cabecalhos,
    ...(revalidar === false
      ? { cache: "no-store" as const }
      : { next: { revalidate: revalidar ?? 60 } }),
  });

  if (!resposta.ok) {
    throw new ApiError(
      resposta.status,
      rota,
      await extrairMensagem(resposta),
    );
  }

  if (resposta.status === 204) return undefined as T;

  /*
   * Vários endpoints respondem 200 com corpo vazio quando não há o que
   * devolver — `/progresso-video/{id}` de um vídeo nunca assistido, por
   * exemplo. Chamar `.json()` direto nesse caso lança SyntaxError, que não é
   * ApiError e por isso escapava do `apiOpcional`, derrubando a página.
   */
  const texto = await resposta.text();
  if (texto.trim().length === 0) return undefined as T;

  try {
    return JSON.parse(texto) as T;
  } catch {
    throw new ApiError(
      resposta.status,
      rota,
      "A API devolveu uma resposta que não é JSON.",
    );
  }
}

/** Igual a `api`, mas devolve `null` em vez de lançar. Útil em blocos opcionais da página. */
export async function apiOpcional<T>(
  rota: string,
  opcoes: Opcoes = {},
): Promise<T | null> {
  try {
    // Corpo vazio vira `undefined` em `api`; normalizamos para null.
    return (await api<T>(rota, opcoes)) ?? null;
  } catch (erro) {
    if (erro instanceof ApiError) return null;
    throw erro;
  }
}

async function extrairMensagem(resposta: Response): Promise<string> {
  try {
    const corpo = await resposta.json();
    const msg = (corpo as { message?: string | string[] }).message;
    if (Array.isArray(msg)) return msg.join(", ");
    if (typeof msg === "string") return msg;
  } catch {
    // resposta sem corpo JSON — cai no texto padrão
  }
  return `${resposta.status} ${resposta.statusText}`;
}
