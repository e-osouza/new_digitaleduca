"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Aviso, Campo } from "@/components/campo";

/**
 * Exclusão da própria conta. Dois passos e senha obrigatória: é irreversível e
 * a API apaga também as assinaturas do usuário.
 */
export function ExcluirConta() {
  const router = useRouter();
  const [aberto, setAberto] = useState(false);
  const [erro, setErro] = useState("");
  const [enviando, setEnviando] = useState(false);

  async function excluir(evento: React.FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    setErro("");
    setEnviando(true);

    const dados = new FormData(evento.currentTarget);

    try {
      const resposta = await fetch("/api/conta/excluir", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ senha: String(dados.get("senha") ?? "") }),
      });

      const corpo = (await resposta.json().catch(() => ({}))) as { erro?: string };

      if (!resposta.ok) {
        setErro(corpo.erro ?? "Não foi possível excluir a conta.");
        setEnviando(false);
        return;
      }

      router.replace("/");
      router.refresh();
    } catch {
      setErro("Falha de conexão.");
      setEnviando(false);
    }
  }

  return (
    <section className="border-alerta/40 flex flex-col gap-4 rounded-xl border p-5">
      <div className="flex flex-col gap-1">
        <h2 className="text-alerta font-display text-base font-semibold">
          Excluir conta
        </h2>
        <p className="text-texto-3 text-sm leading-relaxed">
          Apaga seu cadastro e suas assinaturas. O histórico de progresso e a
          sua lista são perdidos. Não há como desfazer.
        </p>
      </div>

      {!aberto ? (
        <button
          type="button"
          onClick={() => setAberto(true)}
          className="border-alerta/50 text-alerta hover:bg-alerta/10 flex min-h-11 w-fit items-center rounded-full border px-5 text-sm font-semibold transition-colors"
        >
          Quero excluir minha conta
        </button>
      ) : (
        <form onSubmit={excluir} className="flex max-w-sm flex-col gap-4">
          {erro && <Aviso>{erro}</Aviso>}

          <Campo
            id="senha-exclusao"
            name="senha"
            rotulo="Confirme sua senha"
            type="password"
            autoComplete="current-password"
            required
            placeholder="••••••••"
            dica="Precisamos confirmar que é você."
          />

          <div className="flex flex-wrap gap-2">
            <button
              type="submit"
              disabled={enviando}
              className="bg-alerta flex min-h-11 items-center rounded-full px-5 text-sm font-bold text-white transition-opacity disabled:opacity-60"
            >
              {enviando ? "Excluindo…" : "Excluir definitivamente"}
            </button>
            <button
              type="button"
              onClick={() => setAberto(false)}
              disabled={enviando}
              className="border-borda bg-superficie hover:bg-superficie-2 flex min-h-11 items-center rounded-full border px-5 text-sm font-semibold transition-colors"
            >
              Cancelar
            </button>
          </div>
        </form>
      )}
    </section>
  );
}
