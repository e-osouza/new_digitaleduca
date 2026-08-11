import { NextResponse } from "next/server";
import { API_URL, ApiError } from "@/lib/api";
import { lerToken } from "@/lib/session";

/** Recebe os pings do player e repassa para `PATCH /progresso-video`. */
export async function POST(request: Request) {
  const token = await lerToken();
  if (!token) {
    return NextResponse.json({ erro: "Sessão expirada." }, { status: 401 });
  }

  let corpo: { videoId?: number; seconds?: number; concluido?: boolean };
  try {
    corpo = await request.json();
  } catch {
    return NextResponse.json({ erro: "Requisição inválida." }, { status: 400 });
  }

  const videoId = Number(corpo.videoId);
  const seconds = Math.max(0, Math.floor(Number(corpo.seconds ?? 0)));

  if (!Number.isInteger(videoId) || videoId <= 0) {
    return NextResponse.json({ erro: "videoId inválido." }, { status: 400 });
  }

  const resposta = await fetch(`${API_URL}/progresso-video`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      videoId,
      seconds,
      concluido: Boolean(corpo.concluido),
    }),
    cache: "no-store",
  });

  if (!resposta.ok) {
    throw new ApiError(
      resposta.status,
      "/progresso-video",
      "Falha ao salvar o progresso.",
    );
  }

  return NextResponse.json({ ok: true });
}
