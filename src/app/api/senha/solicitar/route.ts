import { NextResponse } from "next/server";
import { API_URL } from "@/lib/api";
import { excedeuLimite, origemDaChamada } from "@/lib/limite";

/** Passo 1: dispara o código de 4 dígitos por e-mail. */

/** Mesmas medidas do reenvio de confirmação — os dois disparam e-mail. */
const POR_EMAIL = { janela: 600, maximo: 3 };
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
   * Antes da chamada, pelo mesmo motivo do `/api/email/enviar`: é lá que o
   * e-mail sai. Recusar por excesso não vaza nada — depende do volume de
   * pedidos deste cliente, não da existência da conta.
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

  const resposta = await fetch(`${API_URL}/reset-password/request`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email }),
    cache: "no-store",
  });

  /*
   * Respondemos ok mesmo quando a API recusa: dizer "este e-mail não existe"
   * permitiria descobrir quem tem conta na plataforma.
   */
  if (!resposta.ok && resposta.status !== 404 && resposta.status !== 400) {
    return NextResponse.json(
      { erro: "Não foi possível enviar o código agora." },
      { status: 502 },
    );
  }

  return NextResponse.json({ ok: true });
}
