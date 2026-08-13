import { NextResponse } from "next/server";
import { API_URL } from "@/lib/api";
import { lerToken } from "@/lib/session";

/** Recebe os pings do player e repassa para `PATCH /progresso-video`. */
export async function POST(request: Request) {
  const token = await lerToken();
  if (!token) {
    return NextResponse.json({ erro: "Sessão expirada." }, { status: 401 });
  }

  let corpo: { videoId?: number; segundos?: number; concluido?: boolean };
  try {
    corpo = await request.json();
  } catch {
    return NextResponse.json({ erro: "Requisição inválida." }, { status: 400 });
  }

  const videoId = Number(corpo.videoId);
  const segundos = Math.max(0, Math.floor(Number(corpo.segundos ?? 0)));

  if (!Number.isInteger(videoId) || videoId <= 0) {
    return NextResponse.json({ erro: "videoId inválido." }, { status: 400 });
  }

  /*
   * O campo é `segundos`, em português. O exemplo publicado no OpenAPI mostra
   * `seconds` e está errado: a API roda validação estrita e responde
   * "property seconds should not exist" — o DTO real é o mesmo dos demais
   * endpoints de progresso.
   */
  const payload = { videoId, segundos, concluido: Boolean(corpo.concluido) };

  const resposta = await fetch(`${API_URL}/progresso-video`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
    cache: "no-store",
  });

  if (!resposta.ok) {
    /*
     * Progresso é acessório: uma falha aqui não pode derrubar a requisição com
     * um 500 e um stack trace a cada ping — são quatro por minuto de aula.
     *
     * A mensagem da API vai para o log do servidor porque é a única pista do
     * motivo; antes ela era descartada e o erro chegava como "Falha ao salvar o
     * progresso", que não diz nada sobre o que a API recusou.
     */
    const detalhe = await resposta.text().catch(() => "");
    console.warn(
      `[progresso] PATCH /progresso-video devolveu ${resposta.status} para ${JSON.stringify(payload)} — ${detalhe.slice(0, 400)}`,
    );

    return NextResponse.json(
      { ok: false, erro: "Não foi possível salvar o progresso." },
      { status: resposta.status === 401 ? 401 : 202 },
    );
  }

  return NextResponse.json({ ok: true });
}
