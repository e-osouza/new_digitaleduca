import { NextResponse } from "next/server";
import { API_URL } from "@/lib/api";
import { gravarToken } from "@/lib/session";
import type { LoginResponse } from "@/types/api";

export async function POST(request: Request) {
  let corpo: { email?: string; senha?: string };
  try {
    corpo = await request.json();
  } catch {
    return NextResponse.json({ erro: "Requisição inválida." }, { status: 400 });
  }

  const email = corpo.email?.trim().toLowerCase();
  const senha = corpo.senha;

  if (!email || !senha) {
    return NextResponse.json(
      { erro: "Informe e-mail e senha." },
      { status: 400 },
    );
  }

  const resposta = await fetch(`${API_URL}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, senha }),
    cache: "no-store",
  });

  if (!resposta.ok) {
    // Mensagem genérica de propósito: não revelamos se o e-mail existe.
    return NextResponse.json(
      { erro: "E-mail ou senha incorretos." },
      { status: 401 },
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
