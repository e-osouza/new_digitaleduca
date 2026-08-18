import { NextResponse } from "next/server";
import { API_URL } from "@/lib/api";
import { lerToken } from "@/lib/session";

/** Repassa a imagem do avatar para a API (que comprime e apaga a anterior). */
export async function POST(request: Request) {
  const token = await lerToken();
  if (!token) {
    return NextResponse.json({ erro: "Sessão expirada." }, { status: 401 });
  }

  let arquivo: FormDataEntryValue | null;
  try {
    const form = await request.formData();
    arquivo = form.get("avatar");
  } catch {
    return NextResponse.json({ erro: "Requisição inválida." }, { status: 400 });
  }

  if (!(arquivo instanceof File) || arquivo.size === 0) {
    return NextResponse.json({ erro: "Escolha uma imagem." }, { status: 400 });
  }

  const upstream = new FormData();
  upstream.append("avatar", arquivo, arquivo.name || "avatar");

  const resposta = await fetch(`${API_URL}/usuario/avatar`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
    body: upstream,
    cache: "no-store",
  });

  if (!resposta.ok) {
    let mensagem = "Não foi possível enviar a foto.";
    if (resposta.status === 413) {
      mensagem = "Imagem muito grande (máximo de 15 MB).";
    } else {
      try {
        const corpo = (await resposta.json()) as { message?: string | string[] };
        if (Array.isArray(corpo.message)) mensagem = corpo.message.join(", ");
        else if (corpo.message) mensagem = corpo.message;
      } catch {
        // mantém a mensagem padrão
      }
    }
    return NextResponse.json({ erro: mensagem }, { status: 502 });
  }

  const dados = (await resposta.json().catch(() => ({}))) as { avatar?: string };
  return NextResponse.json({ ok: true, avatar: dados.avatar ?? null });
}
