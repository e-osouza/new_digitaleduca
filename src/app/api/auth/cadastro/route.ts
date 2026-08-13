import { NextResponse } from "next/server";
import { API_URL } from "@/lib/api";
import { gravarToken } from "@/lib/session";
import type { LoginResponse } from "@/types/api";

/**
 * Cria a conta em `POST /usuario/create` e, se der certo, já faz login para o
 * usuário não precisar digitar as credenciais de novo.
 *
 * A API dispara o código de verificação de e-mail por conta própria; a
 * confirmação acontece depois, em `/auth/email/verify`.
 */
export async function POST(request: Request) {
  let corpo: Record<string, unknown>;
  try {
    corpo = await request.json();
  } catch {
    return NextResponse.json({ erro: "Requisição inválida." }, { status: 400 });
  }

  const nome = String(corpo.nome ?? "").trim();
  const email = String(corpo.email ?? "").trim().toLowerCase();
  const senha = String(corpo.senha ?? "");
  const celular = String(corpo.celular ?? "").trim();

  const faltando = [
    !nome && "nome",
    !email && "e-mail",
    !senha && "senha",
    !celular && "celular",
  ].filter(Boolean);

  if (faltando.length > 0) {
    return NextResponse.json(
      { erro: `Preencha: ${faltando.join(", ")}.` },
      { status: 400 },
    );
  }

  if (senha.length < 6) {
    return NextResponse.json(
      { erro: "A senha precisa ter ao menos 6 caracteres." },
      { status: 400 },
    );
  }

  const criacao = await fetch(`${API_URL}/usuario/create`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      nome,
      email,
      senha,
      celular,
      aceitaNotificacoes: Boolean(corpo.aceitaNotificacoes),
    }),
    cache: "no-store",
  });

  if (!criacao.ok) {
    let mensagem = "Não foi possível criar a conta.";
    try {
      const erro = (await criacao.json()) as { message?: string | string[] };
      if (Array.isArray(erro.message)) mensagem = erro.message.join(", ");
      else if (erro.message) mensagem = erro.message;
    } catch {
      // mantém a mensagem padrão
    }
    return NextResponse.json({ erro: mensagem }, { status: criacao.status });
  }

  // Login automático. Se falhar, a conta existe — mandamos o usuário ao login.
  const login = await fetch(`${API_URL}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, senha }),
    cache: "no-store",
  });

  if (!login.ok) {
    return NextResponse.json({ ok: true, autenticado: false });
  }

  const { access_token } = (await login.json()) as LoginResponse;
  if (access_token) await gravarToken(access_token);

  return NextResponse.json({ ok: true, autenticado: Boolean(access_token) });
}
