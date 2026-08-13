import { NextResponse } from "next/server";
import { API_URL } from "@/lib/api";
import { lerToken } from "@/lib/session";

/** Campos exigidos por `CreateAutoTrailDto` — todos obrigatórios na API. */
const RESPOSTAS = [
  "objetivo",
  "areaInteresse",
  "nivelAtual",
  "tempoDisponivel",
  "preferencia",
  "objetivoFinal",
] as const;

/**
 * Cria a trilha: automática (a partir do questionário) ou manual (lista de
 * vídeos escolhidos). O modo vem no corpo para não multiplicar rotas.
 */
export async function POST(request: Request) {
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

  const manual = corpo.modo === "manual";
  let rota: string;
  let dados: Record<string, unknown>;

  if (manual) {
    const titulo = String(corpo.titulo ?? "").trim();
    const videoIds = Array.isArray(corpo.videoIds)
      ? corpo.videoIds.map(Number).filter((n) => Number.isInteger(n) && n > 0)
      : [];

    if (!titulo) {
      return NextResponse.json({ erro: "Dê um nome à trilha." }, { status: 400 });
    }
    if (videoIds.length === 0) {
      return NextResponse.json(
        { erro: "Escolha ao menos uma aula." },
        { status: 400 },
      );
    }

    rota = "/trilhas/manual";
    dados = { titulo, videoIds };
    const descricao = String(corpo.descricao ?? "").trim();
    if (descricao) dados.descricao = descricao;
  } else {
    const faltando = RESPOSTAS.filter(
      (campo) => String(corpo[campo] ?? "").trim().length === 0,
    );
    if (faltando.length > 0) {
      return NextResponse.json(
        { erro: "Responda todas as perguntas para montarmos a trilha." },
        { status: 400 },
      );
    }

    rota = "/trilhas/auto";
    dados = Object.fromEntries(
      RESPOSTAS.map((campo) => [campo, String(corpo[campo]).trim()]),
    );
    const titulo = String(corpo.titulo ?? "").trim();
    if (titulo) dados.titulo = titulo;
  }

  const resposta = await fetch(`${API_URL}${rota}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(dados),
    cache: "no-store",
  });

  if (!resposta.ok) {
    let mensagem = "Não foi possível criar a trilha.";
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
