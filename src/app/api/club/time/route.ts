import { NextResponse } from "next/server";
import { API_URL } from "@/lib/api";
import { lerToken } from "@/lib/session";
import { repassarErro } from "../_erro";

/** Convida alguém para o time do Club. */
export async function POST(request: Request) {
  const token = await lerToken();
  if (!token) {
    return NextResponse.json({ erro: "Sessão expirada." }, { status: 401 });
  }

  let corpo: { nome?: unknown; email?: unknown };
  try {
    corpo = await request.json();
  } catch {
    return NextResponse.json({ erro: "Requisição inválida." }, { status: 400 });
  }

  const nome = String(corpo.nome ?? "").trim();
  const email = String(corpo.email ?? "").trim();

  if (nome.length < 2) {
    return NextResponse.json(
      { erro: "Informe o nome de quem você quer convidar." },
      { status: 400 },
    );
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ erro: "E-mail inválido." }, { status: 400 });
  }

  const resposta = await fetch(`${API_URL}/club/time/convites`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ nome, email }),
    cache: "no-store",
  });

  if (!resposta.ok) {
    return repassarErro(resposta, "Não foi possível convidar agora.");
  }

  return NextResponse.json(await resposta.json());
}
