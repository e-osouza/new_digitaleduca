import { NextResponse } from "next/server";
import { API_URL } from "@/lib/api";
import { gravarToken } from "@/lib/session";
import type { LoginResponse } from "@/types/api";

/**
 * Entra com o Google.
 *
 * O navegador manda o ID token que recebeu do Google; quem o valida é a API,
 * que confere assinatura, emissor, expiração e audiência. Aqui só repassamos e
 * guardamos o NOSSO token no cookie httpOnly — exatamente como no login por
 * senha, para a sessão ser a mesma coisa nos dois caminhos.
 *
 * O ID token não vai para o cliente em momento algum depois disto, e o nosso
 * JWT nunca chega ao JavaScript do navegador.
 */
export async function POST(request: Request) {
  let corpo: { idToken?: unknown };
  try {
    corpo = await request.json();
  } catch {
    return NextResponse.json({ erro: "Requisição inválida." }, { status: 400 });
  }

  const idToken = typeof corpo.idToken === "string" ? corpo.idToken : "";
  if (!idToken) {
    return NextResponse.json(
      { erro: "O Google não devolveu um token." },
      { status: 400 },
    );
  }

  const resposta = await fetch(`${API_URL}/auth/google`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ idToken }),
    cache: "no-store",
  });

  if (!resposta.ok) {
    /*
      Aqui a mensagem da API é repassada, ao contrário do login por senha, onde
      ela é trocada por um texto genérico. Não há o que proteger: nenhuma das
      respostas revela se um e-mail existe — elas falam do token e da conta
      Google ("confirme seu e-mail no Google", "não configurado") —, e sem esse
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
      { erro: mensagem || "Não foi possível entrar com o Google." },
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
