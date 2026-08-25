import { NextResponse } from "next/server";
import { API_URL } from "@/lib/api";
import { repassarErro } from "../../../_erro";

/**
 * Aceita um convite. NÃO exige sessão: quem abre o link pode ainda nem ter
 * conta — é justamente este endpoint que a cria.
 */
export async function POST(
  request: Request,
  { params }: { params: Promise<{ token: string }> },
) {
  const { token } = await params;

  let corpo: { senha?: unknown } = {};
  try {
    corpo = await request.json();
  } catch {
    // corpo vazio é válido: quem já tem conta aceita sem informar senha
  }

  const senha = typeof corpo.senha === "string" ? corpo.senha : undefined;

  const resposta = await fetch(
    `${API_URL}/club/convites/${encodeURIComponent(token)}/aceitar`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(senha ? { senha } : {}),
      cache: "no-store",
    },
  );

  if (!resposta.ok) {
    return repassarErro(resposta, "Não foi possível aceitar o convite agora.");
  }

  return NextResponse.json(await resposta.json());
}
