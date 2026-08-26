import { NextResponse } from "next/server";
import { API_URL } from "@/lib/api";
import { lerToken } from "@/lib/session";

/**
 * Marca notificações como lidas.
 *
 * Sem `id` no corpo, marca todas — é o "limpar" do painel do sino. Com `id`,
 * marca só aquela, que é o que acontece ao clicar num aviso para abri-lo.
 */
export async function POST(request: Request) {
  const token = await lerToken();
  if (!token) {
    return NextResponse.json({ erro: "Sessão expirada." }, { status: 401 });
  }

  let corpo: { id?: unknown } = {};
  try {
    corpo = await request.json();
  } catch {
    // corpo vazio = marcar todas
  }

  const id = Number(corpo.id);
  const rota =
    Number.isInteger(id) && id > 0
      ? `/notificacoes/${id}/lida`
      : "/notificacoes/ler-todas";

  const resposta = await fetch(`${API_URL}${rota}`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
    cache: "no-store",
  });

  if (!resposta.ok) {
    return NextResponse.json(
      { erro: "Não foi possível marcar como lida." },
      { status: 502 },
    );
  }

  return NextResponse.json(await resposta.json().catch(() => ({ ok: true })));
}
