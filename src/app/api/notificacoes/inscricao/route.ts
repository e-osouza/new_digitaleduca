import { NextResponse } from "next/server";
import { API_URL } from "@/lib/api";
import { lerToken } from "@/lib/session";

/** A chave pública VAPID, que o navegador precisa para se inscrever. */
export async function GET() {
  const token = await lerToken();
  if (!token) {
    return NextResponse.json({ erro: "Sessão expirada." }, { status: 401 });
  }

  const resposta = await fetch(`${API_URL}/notificacoes/chave-web`, {
    headers: { Authorization: `Bearer ${token}` },
    cache: "no-store",
  });

  if (!resposta.ok) {
    /*
      Sem chave, o componente simplesmente não oferece o botão. Devolver
      "não configurado" em vez de erro é o que permite essa decisão silenciosa.
    */
    return NextResponse.json({ chavePublica: null, configurado: false });
  }

  return NextResponse.json(await resposta.json());
}

/** Registra a inscrição deste navegador. */
export async function POST(request: Request) {
  const token = await lerToken();
  if (!token) {
    return NextResponse.json({ erro: "Sessão expirada." }, { status: 401 });
  }

  let corpo: { endpoint?: unknown; p256dh?: unknown; auth?: unknown };
  try {
    corpo = await request.json();
  } catch {
    return NextResponse.json({ erro: "Requisição inválida." }, { status: 400 });
  }

  const dados = {
    endpoint: String(corpo.endpoint ?? ""),
    p256dh: String(corpo.p256dh ?? ""),
    auth: String(corpo.auth ?? ""),
  };

  if (!dados.endpoint || !dados.p256dh || !dados.auth) {
    return NextResponse.json(
      { erro: "Inscrição incompleta." },
      { status: 400 },
    );
  }

  const resposta = await fetch(`${API_URL}/notificacoes/inscricao-web`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(dados),
    cache: "no-store",
  });

  if (!resposta.ok) {
    return NextResponse.json(
      { erro: "Não foi possível ativar os avisos." },
      { status: 502 },
    );
  }

  return NextResponse.json({ ok: true });
}

/** Cancela a inscrição deste navegador. */
export async function DELETE(request: Request) {
  const token = await lerToken();
  if (!token) {
    return NextResponse.json({ erro: "Sessão expirada." }, { status: 401 });
  }

  const corpo = await request.json().catch(() => ({}) as { endpoint?: string });
  const endpoint = String((corpo as { endpoint?: string }).endpoint ?? "");

  const resposta = await fetch(`${API_URL}/notificacoes/inscricao-web`, {
    method: "DELETE",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ endpoint }),
    cache: "no-store",
  });

  if (!resposta.ok) {
    return NextResponse.json(
      { erro: "Não foi possível desativar os avisos." },
      { status: 502 },
    );
  }

  return NextResponse.json({ ok: true });
}
