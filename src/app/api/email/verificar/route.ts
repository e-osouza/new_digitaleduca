import { NextResponse } from "next/server";
import { API_URL } from "@/lib/api";
import { enviarCodigo } from "@/lib/codigo-verificacao";

/** Confirma o e-mail com o código de 4 dígitos. */
export async function POST(request: Request) {
  let corpo: { email?: unknown; codigo?: unknown };
  try {
    corpo = await request.json();
  } catch {
    return NextResponse.json({ erro: "Requisição inválida." }, { status: 400 });
  }

  const email = String(corpo.email ?? "").trim().toLowerCase();
  const codigo = String(corpo.codigo ?? "").trim();

  /*
   * Sem esta conferência, um e-mail vazio virava uma recusa da API traduzida
   * como "Código inválido ou expirado" — apontando para o campo errado, o único
   * que a pessoa realmente digitou.
   */
  if (!email.includes("@")) {
    return NextResponse.json(
      { erro: "Não conseguimos identificar sua conta. Recarregue a página." },
      { status: 400 },
    );
  }

  if (!/^\d{4}$/.test(codigo)) {
    return NextResponse.json({ erro: "O código tem 4 dígitos." }, { status: 400 });
  }

  const resposta = await enviarCodigo(`${API_URL}/auth/email/verify`, {
    email,
    codigo,
  });

  if (!resposta.ok) {
    return NextResponse.json(
      { erro: "Código inválido ou expirado." },
      { status: 400 },
    );
  }

  return NextResponse.json({ ok: true });
}
