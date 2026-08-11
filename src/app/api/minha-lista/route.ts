import { NextResponse } from "next/server";
import { API_URL, ApiError } from "@/lib/api";
import { lerToken } from "@/lib/session";

/** Salva um conteúdo na lista do usuário. */
export async function POST(request: Request) {
  const token = await lerToken();
  if (!token) {
    return NextResponse.json({ erro: "Sessão expirada." }, { status: 401 });
  }

  let corpo: { conteudoId?: unknown };
  try {
    corpo = await request.json();
  } catch {
    return NextResponse.json({ erro: "Requisição inválida." }, { status: 400 });
  }

  const conteudoId = Number(corpo.conteudoId);
  if (!Number.isInteger(conteudoId) || conteudoId <= 0) {
    return NextResponse.json({ erro: "conteudoId inválido." }, { status: 400 });
  }

  const resposta = await fetch(`${API_URL}/conteudos-selecionados/create`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ conteudoId }),
    cache: "no-store",
  });

  if (!resposta.ok) {
    // A mensagem importa: em 400 é ela que distingue falta de acesso de erro
    // de validação (ver ApiError.semAssinatura).
    let mensagem = "";
    try {
      const corpoErro = (await resposta.json()) as { message?: string | string[] };
      mensagem = Array.isArray(corpoErro.message)
        ? corpoErro.message.join(", ")
        : (corpoErro.message ?? "");
    } catch {
      // segue sem mensagem
    }

    const erro = new ApiError(
      resposta.status,
      "/conteudos-selecionados/create",
      mensagem,
    );

    if (erro.semAssinatura) {
      return NextResponse.json(
        { erro: "Salvar na lista exige uma assinatura ativa." },
        { status: 403 },
      );
    }

    return NextResponse.json(
      { erro: mensagem || "Não foi possível salvar agora." },
      { status: 502 },
    );
  }

  return NextResponse.json({ ok: true });
}
