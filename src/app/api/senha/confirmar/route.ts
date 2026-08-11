import { NextResponse } from "next/server";
import { API_URL } from "@/lib/api";

/** Passo 3: grava a nova senha usando o token do passo anterior. */
export async function POST(request: Request) {
  let corpo: { token?: unknown; novaSenha?: unknown };
  try {
    corpo = await request.json();
  } catch {
    return NextResponse.json({ erro: "Requisição inválida." }, { status: 400 });
  }

  const token = String(corpo.token ?? "").trim();
  const novaSenha = String(corpo.novaSenha ?? "");

  if (!token) {
    return NextResponse.json(
      { erro: "Sessão de redefinição expirada. Recomece o processo." },
      { status: 400 },
    );
  }
  if (novaSenha.length < 6) {
    return NextResponse.json(
      { erro: "A senha precisa ter ao menos 6 caracteres." },
      { status: 400 },
    );
  }

  const resposta = await fetch(`${API_URL}/reset-password/confirm`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ token, novaSenha }),
    cache: "no-store",
  });

  if (!resposta.ok) {
    return NextResponse.json(
      { erro: "Não foi possível redefinir a senha. Peça um novo código." },
      { status: 400 },
    );
  }

  return NextResponse.json({ ok: true });
}
