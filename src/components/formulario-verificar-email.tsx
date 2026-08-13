"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Aviso, Campo } from "@/components/campo";

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

  async function reenviar() {
    setErro("");
    setEnviando(true);
    try {
      const resposta = await fetch("/api/email/enviar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      setAviso(
        resposta.ok ? "Enviamos um novo código." : "Não foi possível reenviar.",
      );
    } catch {
      setErro("Falha de conexão.");
    } finally {
      setEnviando(false);
    }
  }

  if (confirmado) {
    return (
      <p
        role="status"
        className="border-sucesso/40 bg-sucesso/10 text-sucesso rounded-lg border px-3.5 py-2.5 text-sm"
      >
        E-mail confirmado. Obrigado!
      </p>
    );
  }

  return (
    <form onSubmit={verificar} className="flex max-w-sm flex-col gap-4">
      {erro && <Aviso>{erro}</Aviso>}
      {aviso && (
        <p
          role="status"
          className="border-sucesso/40 bg-sucesso/10 text-sucesso rounded-lg border px-3.5 py-2.5 text-sm"
        >
          {aviso}
        </p>
      )}

      <Campo
        id="codigo"
        name="codigo"
        rotulo="Código de 4 dígitos"
        inputMode="numeric"
        autoComplete="one-time-code"
        required
        maxLength={4}
        pattern="\d{4}"
        placeholder="0000"
      />

      <div className="flex flex-wrap items-center gap-4">
        <button
          type="submit"
          disabled={enviando}
          className="bg-acento text-white hover:bg-acento-hover min-h-11 rounded-full px-6 text-sm font-bold transition-colors disabled:opacity-60"
        >
          {enviando ? "Confirmando…" : "Confirmar e-mail"}
        </button>

        <button
          type="button"
          onClick={reenviar}
          disabled={enviando}
          className="text-acento hover:text-acento-hover text-sm font-semibold transition-colors disabled:opacity-60"
        >
          Reenviar código
        </button>
      </div>
    </form>
  );
}
