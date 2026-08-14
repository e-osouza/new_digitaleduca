"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Aviso } from "@/components/campo";
import { CampoCodigo } from "@/components/campo-codigo";
import { BotaoReenviar } from "@/components/botao-reenviar";

export function FormularioVerificarEmail({ email }: { email: string }) {
  const router = useRouter();
  const [erro, setErro] = useState("");
  const [aviso, setAviso] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [confirmado, setConfirmado] = useState(false);

  async function verificar(evento: React.FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    setErro("");
    setAviso("");
    setEnviando(true);

    const dados = new FormData(evento.currentTarget);

    try {
      const resposta = await fetch("/api/email/verificar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          codigo: String(dados.get("codigo") ?? "").trim(),
        }),
      });

      const corpo = (await resposta.json().catch(() => ({}))) as { erro?: string };

      if (!resposta.ok) {
        setErro(corpo.erro ?? "Não foi possível confirmar.");
        return;
      }

      setConfirmado(true);
      router.refresh();
    } catch {
      setErro("Falha de conexão.");
    } finally {
      setEnviando(false);
    }
  }

  /* Lança em caso de falha: é assim que `BotaoReenviar` sabe não iniciar a espera. */
  async function reenviar() {
    setErro("");
    setAviso("");

    const resposta = await fetch("/api/email/enviar", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    }).catch(() => null);

    if (!resposta?.ok) {
      const corpo = (await resposta?.json().catch(() => ({}))) as {
        erro?: string;
      };
      setErro(corpo?.erro ?? "Não foi possível reenviar agora.");
      throw new Error("falha ao reenviar");
    }

    setAviso("Enviamos um novo código. O anterior deixou de valer.");
  }

  /*
   * Estado de passagem: o `router.refresh()` acima recarrega a página, que
   * então cai no cartão de "e-mail confirmado" servido pelo servidor. Isto
   * cobre o intervalo até a resposta chegar — sem ele o formulário ficaria
   * intacto na tela, como se o envio não tivesse acontecido.
   */
  if (confirmado) {
    return (
      <p
        role="status"
        className="border-sucesso/40 bg-sucesso/10 text-sucesso w-full rounded-lg border px-3.5 py-2.5 text-sm font-semibold"
      >
        E-mail confirmado. Obrigado!
      </p>
    );
  }

  return (
    <form onSubmit={verificar} className="flex w-full flex-col items-center gap-5">
      {/*
        As mensagens ocupam a largura do cartão; o `items-center` do formulário
        as encolheria para o tamanho do texto.
      */}
      {erro && (
        <div className="w-full">
          <Aviso>{erro}</Aviso>
        </div>
      )}
      {aviso && (
        <p
          role="status"
          className="border-sucesso/40 bg-sucesso/10 text-sucesso w-full rounded-lg border px-3.5 py-2.5 text-sm"
        >
          {aviso}
        </p>
      )}

      <CampoCodigo id="codigo" name="codigo" rotulo="Código de 4 dígitos" autoFocus />

      <div className="flex w-full flex-col items-center gap-3">
        <button
          type="submit"
          disabled={enviando}
          className="bg-acento text-white hover:bg-acento-hover min-h-12 w-full rounded-full px-6 text-sm font-bold transition-colors disabled:opacity-60"
        >
          {enviando ? "Confirmando…" : "Confirmar e-mail"}
        </button>

        <BotaoReenviar aoReenviar={reenviar} ocupado={enviando} />
      </div>
    </form>
  );
}
