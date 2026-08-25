import { NextResponse } from "next/server";
import { API_URL } from "@/lib/api";
import { lerToken } from "@/lib/session";
import { repassarErro } from "../../../_erro";

/** Cancela um convite em aberto, devolvendo a vaga. */
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

  const resposta = await fetch(`${API_URL}/club/time/convites/${id}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${token}` },
    cache: "no-store",
  });

  if (!resposta.ok) {
    return repassarErro(resposta, "Não foi possível cancelar agora.");
  }

  return NextResponse.json({ ok: true });
}
