import { NextResponse } from "next/server";
import { API_URL } from "@/lib/api";
import { lerToken } from "@/lib/session";

/**
 * Confere um cupom antes de cobrar, em `POST /cupom/validar`.
 *
 * Existe para o checkout poder mostrar o preço com desconto ANTES de a pessoa
 * digitar o cartão. A rota da API não consome o cupom — quem o gasta é o
 * `cupomCodigo` enviado depois no `POST /assinatura`.
 *
 * Exige sessão, como a rota da API (só `JwtAuthGuard`, sem papel de admin).
 */
export async function POST(request: Request) {
  const token = await lerToken();
  if (!token) {
    return NextResponse.json({ erro: "Sessão expirada." }, { status: 401 });
  }

  let corpo: { codigo?: unknown; planoId?: unknown };
  try {
    corpo = await request.json();
  } catch {
    return NextResponse.json({ erro: "Requisição inválida." }, { status: 400 });
  }

  /* O cadastro é em maiúsculas; digitar minúsculo não pode invalidar. */
  const codigo = String(corpo.codigo ?? "").trim().toUpperCase();
  const planoId = Number(corpo.planoId);

  if (!codigo) {
    return NextResponse.json({ erro: "Digite o cupom." }, { status: 400 });
  }
  if (!Number.isInteger(planoId) || planoId <= 0) {
    return NextResponse.json({ erro: "Plano inválido." }, { status: 400 });
  }

  const resposta = await fetch(`${API_URL}/cupom/validar`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ codigo, planoId }),
    cache: "no-store",
  });

  const texto = await resposta.text();
  let dados: unknown = null;
  try {
    dados = texto ? JSON.parse(texto) : null;
  } catch {
    dados = null;
  }

  if (!resposta.ok) {
    const mensagem = (dados as { message?: string | string[] } | null)?.message;
    const detalhe = Array.isArray(mensagem) ? mensagem.join(" · ") : mensagem;
    return NextResponse.json(
      { erro: detalhe || "Não foi possível conferir o cupom." },
      { status: resposta.status },
    );
  }

  /*
   * Cupom recusado volta como 200 com `valido: false` e um `motivo` — não é
   * erro de requisição. O motivo é do backend e diz a coisa certa ("expirado",
   * "não vale para este plano"), então repassamos em vez de inventar um texto.
   */
  return NextResponse.json(dados);
}
