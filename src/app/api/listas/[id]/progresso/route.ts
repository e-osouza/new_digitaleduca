import { NextResponse } from "next/server";
import { API_URL } from "@/lib/api";
import { lerToken } from "@/lib/session";

/**
 * `PATCH /listas/{id}/progress` — o progresso da lista é independente do
 * progresso global do vídeo, por isso tem endpoint próprio.
 */
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const token = await lerToken();
  if (!token) {
    return NextResponse.json({ erro: "Sessão expirada." }, { status: 401 });
  }

  const { id } = await params;
  if (!/^\d+$/.test(id)) {
    return NextResponse.json({ erro: "ID inválido." }, { status: 400 });
  }

  let corpo: Record<string, unknown>;
  try {
    corpo = await request.json();
  } catch {
    return NextResponse.json({ erro: "Requisição inválida." }, { status: 400 });
  }

  const listaItemId = Number(corpo.listaItemId);
  const videoId = Number(corpo.videoId);
  const segundos = Math.max(0, Math.floor(Number(corpo.segundos ?? 0)));

  if (!Number.isInteger(listaItemId) || !Number.isInteger(videoId)) {
    return NextResponse.json(
      { erro: "Item ou vídeo inválido." },
      { status: 400 },
    );
  }

  const resposta = await fetch(`${API_URL}/listas/${id}/progress`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      listaItemId,
      videoId,
      segundos,
      concluido: Boolean(corpo.concluido),
    }),
    cache: "no-store",
  });

  if (!resposta.ok) {
    return NextResponse.json(
      { erro: "Não foi possível salvar o progresso." },
      { status: 502 },
    );
  }

  return NextResponse.json({ ok: true });
}
