import { NextResponse } from "next/server";
import { API_URL } from "@/lib/api";
import { gravarToken } from "@/lib/session";
import type { LoginResponse } from "@/types/api";

/**
 * Entra com a Apple.
 *
 * O navegador manda o `identityToken` que recebeu da Apple (e, no primeiro
 * login, o nome); quem o valida é a API, que confere assinatura, emissor,
 * expiração e audiência. Aqui só repassamos e guardamos o NOSSO token no cookie
 * httpOnly — exatamente como no login por senha e no Google, para a sessão ser
 * a mesma coisa em todos os caminhos.
 *
 * O identityToken não vai para o cliente depois disto, e o nosso JWT nunca
 * chega ao JavaScript do navegador.
 */
export async function POST(request: Request) {
  let corpo: { identityToken?: unknown; nome?: unknown };
  try {
    corpo = await request.json();
  } catch {
    return NextResponse.json({ erro: "Requisição inválida." }, { status: 400 });
  }

  const identityToken =
    typeof corpo.identityToken === "string" ? corpo.identityToken : "";
  if (!identityToken) {
    return NextResponse.json(
      { erro: "A Apple não devolveu um token." },
      { status: 400 },
    );
  }

  // O nome só vem no primeiro login; nas vezes seguintes segue ausente.
  const nome =
    typeof corpo.nome === "string" && corpo.nome.trim()
      ? corpo.nome.trim()
      : undefined;

  const resposta = await fetch(`${API_URL}/auth/apple`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(nome ? { identityToken, nome } : { identityToken }),
    cache: "no-store",
  });

  if (!resposta.ok) {
    /*
      A mensagem da API é repassada, como no Google: nenhuma das respostas
      revela se um e-mail existe — falam do token e da conta Apple —, e sem esse
      texto a pessoa fica sem saber o que fazer.
    */
    let mensagem = "";
    try {
      const erro = (await resposta.json()) as { message?: string | string[] };
      mensagem = Array.isArray(erro.message)
        ? erro.message.join(", ")
        : (erro.message ?? "");
    } catch {
      // segue sem mensagem
    }

    return NextResponse.json(
      { erro: mensagem || "Não foi possível entrar com a Apple." },
      { status: resposta.status === 401 ? 401 : 502 },
    );
  }

  const { access_token } = (await resposta.json()) as LoginResponse;
  if (!access_token) {
    return NextResponse.json(
      { erro: "A API não devolveu um token de acesso." },
      { status: 502 },
    );
  }

  await gravarToken(access_token);
  return NextResponse.json({ ok: true });
}
