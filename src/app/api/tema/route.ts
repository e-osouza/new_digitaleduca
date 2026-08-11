import { NextResponse } from "next/server";
import { DURACAO_TEMA, NOME_COOKIE_TEMA, ehTema } from "@/lib/tema";

export async function POST(request: Request) {
  let corpo: { tema?: unknown };
  try {
    corpo = await request.json();
  } catch {
    return NextResponse.json({ erro: "Requisição inválida." }, { status: 400 });
  }

  if (!ehTema(corpo.tema)) {
    return NextResponse.json({ erro: "Tema desconhecido." }, { status: 400 });
  }

  const resposta = NextResponse.json({ ok: true, tema: corpo.tema });

  // Sem httpOnly: é preferência de interface, não credencial.
  resposta.cookies.set(NOME_COOKIE_TEMA, corpo.tema, {
    httpOnly: false,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: DURACAO_TEMA,
  });

  return resposta;
}
