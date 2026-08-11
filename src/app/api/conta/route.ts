import { NextResponse } from "next/server";
import { API_URL } from "@/lib/api";
import { lerToken } from "@/lib/session";

/** Campos que `PUT /usuario/update` aceita (UpdateUsuarioDto). */
const CAMPOS_TEXTO = [
  "nome",
  "email",
  "celular",
  "cargo",
  "funcao",
  "areaAtuacao",
  "tempoExperiencia",
  "objetivoPlataforma",
  "formatoAprendizado",
] as const;

export async function PUT(request: Request) {
  const token = await lerToken();
  if (!token) {
    return NextResponse.json({ erro: "Sessão expirada." }, { status: 401 });
  }

  let corpo: Record<string, unknown>;
  try {
    corpo = await request.json();
  } catch {
    return NextResponse.json({ erro: "Requisição inválida." }, { status: 400 });
  }

  const dados: Record<string, unknown> = {};

  for (const campo of CAMPOS_TEXTO) {
    const valor = corpo[campo];
    if (typeof valor === "string") {
      const limpo = valor.trim();
      // String vazia significa "não mexer" — a API não tem campo nulável aqui.
      if (limpo.length > 0) dados[campo] = limpo;
    }
  }

  if (typeof corpo.aceitaNotificacoes === "boolean") {
    dados.aceitaNotificacoes = corpo.aceitaNotificacoes;
  }

  if (typeof corpo.senha === "string" && corpo.senha.length > 0) {
    if (corpo.senha.length < 6) {
      return NextResponse.json(
        { erro: "A nova senha precisa ter ao menos 6 caracteres." },
        { status: 400 },
      );
    }
    dados.senha = corpo.senha;
  }

  if (Object.keys(dados).length === 0) {
    return NextResponse.json(
      { erro: "Nenhuma alteração para salvar." },
      { status: 400 },
    );
  }

  const resposta = await fetch(`${API_URL}/usuario/update`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(dados),
    cache: "no-store",
  });

  if (!resposta.ok) {
    let mensagem = "Não foi possível salvar as alterações.";
    try {
      const erro = (await resposta.json()) as { message?: string | string[] };
      if (Array.isArray(erro.message)) mensagem = erro.message.join(", ");
      else if (erro.message) mensagem = erro.message;
    } catch {
      // mantém a mensagem padrão
    }
    return NextResponse.json({ erro: mensagem }, { status: resposta.status });
  }

  return NextResponse.json({ ok: true });
}
