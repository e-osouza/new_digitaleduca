"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Aviso, Campo, Nota } from "@/components/campo";
import type { ConvitePublico } from "@/types/api";

/**
 * Aceite do convite.
 *
 * O formulário muda conforme `precisaCriarConta`: quem já tem conta só
 * confirma; quem não tem define a senha aqui mesmo. Pedir senha a quem já tem
 * conta seria pedir para trocá-la sem ter pedido — e pedir login antes de
 * aceitar jogaria a pessoa num fluxo que ela não veio fazer.
 */
export function FormularioConvite({
  token,
  convite,
}: {
  token: string;
  convite: ConvitePublico;
}) {
  const router = useRouter();
  const [erro, setErro] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [pronto, setPronto] = useState(false);

  async function aceitar(evento: React.FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    setErro("");
    setEnviando(true);

    const dados = new FormData(evento.currentTarget);
    const senha = String(dados.get("senha") ?? "");

    if (convite.precisaCriarConta && senha.length < 6) {
      setEnviando(false);
      setErro("A senha precisa ter pelo menos 6 caracteres.");
      return;
    }

    const resposta = await fetch(
      `/api/club/convites/${encodeURIComponent(token)}/aceitar`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(convite.precisaCriarConta ? { senha } : {}),
      },
    );

    const corpo = await resposta.json().catch(() => ({}));
    setEnviando(false);

    if (!resposta.ok) {
      setErro(corpo.erro ?? "Não foi possível aceitar o convite agora.");
      return;
    }

    setPronto(true);
    /* A pessoa ainda não está logada: o próximo passo é entrar. */
    router.push(`/?convite=aceito&email=${encodeURIComponent(convite.email)}`);
  }

  if (pronto) {
    return <Nota>Tudo certo. Levando você para a entrada…</Nota>;
  }

  return (
    <form onSubmit={aceitar} className="flex flex-col gap-4">
      <Campo
        id="email"
        rotulo="E-mail"
        defaultValue={convite.email}
        readOnly
        disabled
        dica={
          convite.precisaCriarConta
            ? "Sua conta será criada com este e-mail."
            : "Você já tem conta com este e-mail — ela entra no time."
        }
      />

      {convite.precisaCriarConta && (
        <Campo
          id="senha"
          name="senha"
          type="password"
          rotulo="Crie uma senha"
          required
          minLength={6}
          autoComplete="new-password"
          dica="Pelo menos 6 caracteres."
        />
      )}

      {erro && <Aviso>{erro}</Aviso>}

      <button
        type="submit"
        disabled={enviando}
        className="bg-acento text-white hover:bg-acento-hover flex min-h-12 items-center justify-center rounded-full px-7 text-sm font-bold transition-colors disabled:opacity-60"
      >
        {enviando ? "Entrando no time…" : "Aceitar convite"}
      </button>
    </form>
  );
}
