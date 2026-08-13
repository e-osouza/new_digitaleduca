import { NextResponse } from "next/server";
import { API_URL } from "@/lib/api";
import { lerToken } from "@/lib/session";

/**
 * Repassa a legenda WebVTT. Precisa do proxy porque a API exige JWT, e o
 * elemento <track> do navegador não envia cabeçalhos de autenticação.
 */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ vimeoId: string; trackId: string }> },
) {
  const token = await lerToken();
  if (!token) {
    return new NextResponse("Sessão expirada.", { status: 401 });
  }

  const { vimeoId, trackId } = await params;
  if (!/^\d+$/.test(vimeoId) || !/^\d+$/.test(trackId)) {
    return new NextResponse("Identificador inválido.", { status: 400 });
  }

  const resposta = await fetch(
    `${API_URL}/vimeo-client/video/${vimeoId}/text-track/${trackId}`,
    { headers: { Authorization: `Bearer ${token}` }, cache: "no-store" },
  );

  if (!resposta.ok) {
    return new NextResponse("Legenda indisponível.", { status: 404 });
  }

  return new NextResponse(await resposta.text(), {
    headers: {
      "Content-Type": "text/vtt; charset=utf-8",
      "Cache-Control": "private, max-age=3600",
    },
  });
}
