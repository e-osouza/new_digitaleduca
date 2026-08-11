import { NextResponse } from "next/server";
import { API_URL } from "@/lib/api";
import { lerToken } from "@/lib/session";

/** Cria ou atualiza a nota do usuário para um vídeo (1 a 5). */
export async function POST(request: Request) {
  const token = await lerToken();
  if (!token) {
    return NextResponse.json({ erro: "Sessão expirada." }, { status: 401 });
  }

  let corpo: { videoId?: unknown; nota?: unknown };
  try {
    corpo = await request.json();
  } catch {
    return NextResponse.json({ erro: "Requisição inválida." }, { status: 400 });
  }

  const videoId = Number(corpo.videoId);
  const nota = Number(corpo.nota);

  if (!Number.isInteger(videoId) || videoId <= 0) {
    return NextResponse.json({ erro: "videoId inválido." }, { status: 400 });
  }
  if (!Number.isInteger(nota) || nota < 1 || nota > 5) {
    return NextResponse.json({ erro: "A nota vai de 1 a 5." }, { status: 400 });
  }

  const resposta = await fetch(`${API_URL}/avaliacao-video`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ videoId, nota }),
    cache: "no-store",
  });

  if (!resposta.ok) {
    return NextResponse.json(
      { erro: "Não foi possível registrar sua nota." },
      { status: 502 },
    );
  }

  return NextResponse.json({ ok: true });
}
