import { NextResponse } from "next/server";
import { API_URL } from "@/lib/api";
import { NOME_COOKIE_SESSAO, lerToken } from "@/lib/session";

/**
 * Exclui a própria conta. A API exige a senha atual no corpo — é a confirmação
 * de que quem pediu está mesmo de posse das credenciais.
 */
export async function POST(request: Request) {
  const token = await lerToken();
  if (!token) {
    return NextResponse.json({ erro: "Sessão expirada." }, { status: 401 });
  }

  let corpo: { senha?: unknown };
  try {
    corpo = await request.json();
  } catch {
    return NextResponse.json({ erro: "Requisição inválida." }, { status: 400 });
  }

  const senha = String(corpo.senha ?? "");
  if (senha.length === 0) {
    return NextResponse.json(
      { erro: "Digite sua senha para confirmar." },
      { status: 400 },
    );
  }

  const resposta = await fetch(`${API_URL}/usuario/me`, {
    method: "DELETE",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ senha }),
    cache: "no-store",
  });

  if (!resposta.ok) {
    const mensagem =
      resposta.status === 401 || resposta.status === 400
        ? "Senha incorreta."
        : "Não foi possível excluir a conta agora.";
    return NextResponse.json({ erro: mensagem }, { status: resposta.status });
  }

  // A conta deixou de existir: o cookie não pode sobreviver à resposta.
  const ok = NextResponse.json({ ok: true });
  ok.cookies.delete(NOME_COOKIE_SESSAO);
  return ok;
}
