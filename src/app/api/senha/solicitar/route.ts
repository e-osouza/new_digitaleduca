import { NextResponse } from "next/server";
import { API_URL } from "@/lib/api";

/** Passo 1: dispara o código de 4 dígitos por e-mail. */
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
