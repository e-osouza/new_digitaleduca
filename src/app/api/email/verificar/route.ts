import { NextResponse } from "next/server";
import { API_URL } from "@/lib/api";

/** Confirma o e-mail com o código de 4 dígitos (campo `codigo` na API). */
export async function POST(request: Request) {
  let corpo: { email?: unknown; codigo?: unknown };
  try {
    corpo = await request.json();
  } catch {
    return NextResponse.json({ erro: "Requisição inválida." }, { status: 400 });
  }

  const email = String(corpo.email ?? "").trim().toLowerCase();
  const codigo = String(corpo.codigo ?? "").trim();

  if (!/^\d{4}$/.test(codigo)) {
    return NextResponse.json({ erro: "O código tem 4 dígitos." }, { status: 400 });
  }

  const resposta = await fetch(`${API_URL}/auth/email/verify`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, codigo }),
    cache: "no-store",
  });

  if (!resposta.ok) {
    return NextResponse.json(
      { erro: "Código inválido ou expirado." },
      { status: 400 },
    );
  }

  return NextResponse.json({ ok: true });
}
