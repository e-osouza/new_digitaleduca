import { NextResponse } from "next/server";
import { API_URL } from "@/lib/api";

/** Reenvia o código de confirmação de e-mail. Endpoint público na API. */
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

  const resposta = await fetch(`${API_URL}/auth/email/send`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email }),
    cache: "no-store",
  });

  if (!resposta.ok) {
    return NextResponse.json(
      { erro: "Não foi possível enviar o código agora." },
      { status: 502 },
    );
  }

  return NextResponse.json({ ok: true });
}
