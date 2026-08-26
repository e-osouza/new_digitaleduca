import { NextResponse } from "next/server";
import { API_URL } from "@/lib/api";
import { lerToken } from "@/lib/session";

/**
 * A caixa de entrada, buscada quando o sino abre.
 *
 * Não vem do servidor junto da página: a lista só interessa a quem clicar, e
 * carregá-la em toda navegação custaria uma consulta por página para mostrar
 * nada na maior parte das vezes. O contador, esse sim, vem no cabeçalho.
 */
export async function GET(request: Request) {
  const token = await lerToken();
  if (!token) {
    return NextResponse.json({ erro: "Sessão expirada." }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const limite = searchParams.get("limit") ?? "20";

  const resposta = await fetch(`${API_URL}/notificacoes?limit=${limite}`, {
    headers: { Authorization: `Bearer ${token}` },
    cache: "no-store",
  });

  if (!resposta.ok) {
    return NextResponse.json(
      { erro: "Não foi possível carregar as notificações." },
      { status: 502 },
    );
  }

  return NextResponse.json(await resposta.json());
}
