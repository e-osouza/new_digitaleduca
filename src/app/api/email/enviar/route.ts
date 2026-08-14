import { NextResponse } from "next/server";
import { API_URL } from "@/lib/api";
import { excedeuLimite, origemDaChamada } from "@/lib/limite";

/**
 * Reenvia o código de confirmação de e-mail. Endpoint público na API — e
 * público aqui também, já que o `proxy.ts` não cobre `/api` e quem ainda não
 * confirmou o e-mail pode nem ter sessão.
 */

/** Três pedidos por endereço a cada dez minutos. */
const POR_EMAIL = { janela: 600, maximo: 3 };
/** Teto por origem, para que variar o e-mail não contorne o limite acima. */
const POR_ORIGEM = { janela: 3600, maximo: 20 };

export async function POST(request: Request) {
  let corpo: { email?: unknown };
  try {
    corpo = await request.json();
  } catch {
    return NextResponse.json({ erro: "Requisição inválida." }, { status: 400 });
  }

  const email = String(corpo.email ?? "").trim().toLowerCase();
  if (!email.includes("@")) {
    return NextResponse.json({ erro: "Informe um e-mail válido." }, { status: 400 });
  }

  /*
   * O limite vem ANTES da chamada à API: é o disparo do e-mail que queremos
   * conter, e ele acontece lá. Recusar por excesso não revela nada sobre a
   * conta — a resposta depende de quantas vezes ESTE cliente pediu, não de o
   * endereço existir.
   */
  if (
    excedeuLimite(`email:${email}`, POR_EMAIL) ||
    excedeuLimite(`origem:${origemDaChamada(request)}`, POR_ORIGEM)
  ) {
    return NextResponse.json(
      { erro: "Muitos pedidos seguidos. Aguarde alguns minutos e tente de novo." },
      { status: 429 },
    );
  }

  const resposta = await fetch(`${API_URL}/auth/email/send`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email }),
    cache: "no-store",
  });

  /*
   * Recusa da API por e-mail desconhecido vira sucesso, pelo mesmo motivo do
   * `/api/senha/solicitar`: responder diferente para endereço cadastrado e não
   * cadastrado transforma este endpoint numa lista de quem tem conta aqui.
   *
   * Só falha de infraestrutura (5xx) chega ao cliente como erro — nesse caso
   * não há nada a esconder, e a pessoa precisa saber que pode tentar de novo.
   */
  if (!resposta.ok && resposta.status !== 404 && resposta.status !== 400) {
    return NextResponse.json(
      { erro: "Não foi possível enviar o código agora." },
      { status: 502 },
    );
  }

  return NextResponse.json({ ok: true });
}
