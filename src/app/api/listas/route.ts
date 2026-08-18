import { NextResponse } from "next/server";
import { API_URL } from "@/lib/api";
import { lerToken } from "@/lib/session";

/** Cria uma lista com as aulas escolhidas pelo usuário. */
export async function POST(request: Request) {
  const token = await lerToken();
  if (!token) {
    return NextResponse.json({ erro: "Sessão expirada." }, { status: 401 });
  }

  let corpo: { titulo?: unknown; descricao?: unknown; videoIds?: unknown };
  try {
    corpo = await request.json();
  } catch {
    return NextResponse.json({ erro: "Requisição inválida." }, { status: 400 });
  }

  const titulo = String(corpo.titulo ?? "").trim();
  const videoIds = Array.isArray(corpo.videoIds)
    ? corpo.videoIds.map(Number).filter((n) => Number.isInteger(n) && n > 0)
    : [];

  if (!titulo) {
    return NextResponse.json({ erro: "Dê um nome à lista." }, { status: 400 });
  }
  if (videoIds.length === 0) {
    return NextResponse.json(
      { erro: "Escolha ao menos uma aula." },
      { status: 400 },
    );
  }

  const dados: Record<string, unknown> = { titulo, videoIds };
  const descricao = String(corpo.descricao ?? "").trim();
  if (descricao) dados.descricao = descricao;

  const resposta = await fetch(`${API_URL}/listas`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(dados),
    cache: "no-store",
  });

  if (!resposta.ok) {
    let mensagem = "Não foi possível criar a lista.";
    try {
      const erro = (await resposta.json()) as { message?: string | string[] };
      if (Array.isArray(erro.message)) mensagem = erro.message.join(", ");
      else if (erro.message) mensagem = erro.message;
    } catch {
      // mantém a mensagem padrão
    }
    return NextResponse.json({ erro: mensagem }, { status: resposta.status });
  }

  const criada = (await resposta.json().catch(() => ({}))) as { id?: number };
  return NextResponse.json({ ok: true, id: criada.id ?? null });
}
