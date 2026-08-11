import { NextResponse } from "next/server";
import { API_URL } from "@/lib/api";
import { lerToken } from "@/lib/session";

/** Remove da lista. O `id` é o do vínculo, não o do conteúdo. */
export async function DELETE(
  _request: Request,
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

  const resposta = await fetch(`${API_URL}/conteudos-selecionados/${id}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${token}` },
    cache: "no-store",
  });

  if (!resposta.ok) {
    return NextResponse.json(
      { erro: "Não foi possível remover agora." },
      { status: 502 },
    );
  }

  return NextResponse.json({ ok: true });
}
