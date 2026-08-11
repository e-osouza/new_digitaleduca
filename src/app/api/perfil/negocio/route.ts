import { NextResponse } from "next/server";
import { API_URL } from "@/lib/api";
import { lerToken } from "@/lib/session";

const CAMPOS = [
  "nomeEmpresa",
  "setorAtuacao",
  "numeroColaboradores",
  "faixaFaturamentoAnual",
  "faseAtual",
  "desafiosNegocio",
] as const;

/**
 * A API separa criação de atualização e só permite criar uma vez. Consultamos
 * `/negocio/me` para escolher entre POST e PATCH, em vez de tentar às cegas.
 */
export async function PUT(request: Request) {
  const token = await lerToken();
  if (!token) {
    return NextResponse.json({ erro: "Sessão expirada." }, { status: 401 });
  }

  let corpo: Record<string, unknown>;
  try {
    corpo = await request.json();
  } catch {
    return NextResponse.json({ erro: "Requisição inválida." }, { status: 400 });
  }

  const dados: Record<string, string> = {};
  for (const campo of CAMPOS) {
    const valor = corpo[campo];
    if (typeof valor === "string" && valor.trim().length > 0) {
      dados[campo] = valor.trim();
    }
  }

  if (!dados.nomeEmpresa) {
    return NextResponse.json(
      { erro: "Informe o nome da empresa." },
      { status: 400 },
    );
  }

  const cabecalhos = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  };

  const existente = await fetch(`${API_URL}/negocio/me`, {
    headers: { Authorization: `Bearer ${token}` },
    cache: "no-store",
  });

  const jaExiste = existente.ok && (await existente.text()).trim().length > 2;

  const resposta = await fetch(
    `${API_URL}${jaExiste ? "/negocio/update" : "/negocio/create"}`,
    {
      method: jaExiste ? "PATCH" : "POST",
      headers: cabecalhos,
      body: JSON.stringify(dados),
      cache: "no-store",
    },
  );

  if (!resposta.ok) {
    return NextResponse.json(
      { erro: "Não foi possível salvar os dados da empresa." },
      { status: 502 },
    );
  }

  return NextResponse.json({ ok: true });
}
