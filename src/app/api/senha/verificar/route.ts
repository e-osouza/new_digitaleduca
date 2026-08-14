import { NextResponse } from "next/server";
import { API_URL } from "@/lib/api";
import { enviarCodigo } from "@/lib/codigo-verificacao";

/** Passo 2: troca o código pelo token de redefinição. */
export async function POST(request: Request) {
  let corpo: { email?: unknown; codigo?: unknown };
  try {
    corpo = await request.json();
  } catch {
    return NextResponse.json({ erro: "Requisição inválida." }, { status: 400 });
  }

  const email = String(corpo.email ?? "").trim().toLowerCase();
  const codigo = String(corpo.codigo ?? "").trim();

  if (!email.includes("@")) {
    return NextResponse.json(
      { erro: "Recomece informando o e-mail da conta." },
      { status: 400 },
    );
  }

  if (!/^\d{4}$/.test(codigo)) {
    return NextResponse.json(
      { erro: "O código tem 4 dígitos." },
      { status: 400 },
    );
  }

  const resposta = await enviarCodigo(`${API_URL}/reset-password/verify-code`, {
    email,
    codigo,
  });

  if (!resposta.ok) {
    return NextResponse.json(
      { erro: "Código inválido ou expirado." },
      { status: 400 },
    );
  }

  const dados = (await resposta.json().catch(() => ({}))) as {
    resetToken?: string;
    token?: string;
  };

  const token = dados.resetToken ?? dados.token;
  if (!token) {
    return NextResponse.json(
      { erro: "A API não devolveu o token de redefinição." },
      { status: 502 },
    );
  }

  return NextResponse.json({ token });
}
