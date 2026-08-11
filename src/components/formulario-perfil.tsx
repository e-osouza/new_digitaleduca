"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Aviso, Campo } from "@/components/campo";

export type CampoPerfil = {
  id: string;
  rotulo: string;
  exemplo?: string;
  dica?: string;
  multilinha?: boolean;
};

/**
 * Formulário genérico para os blocos de perfil complementar (negócio e
 * interesse). O route handler decide entre criar e atualizar, porque a API
 * separa as duas operações e só permite criar uma vez.
 */
export function FormularioPerfil({
  rota,
  campos,
  valores,
  rotuloBotao = "Salvar",
}: {
  rota: string;
  campos: CampoPerfil[];
  valores: Record<string, string | null | undefined>;
  rotuloBotao?: string;
}) {
  const router = useRouter();
  const [erro, setErro] = useState("");
  const [salvo, setSalvo] = useState(false);
  const [enviando, setEnviando] = useState(false);

  async function enviar(evento: React.FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    setErro("");
    setSalvo(false);
    setEnviando(true);

    const dados = new FormData(evento.currentTarget);
    const corpo: Record<string, string> = {};
    for (const [chave, valor] of dados.entries()) {
      if (typeof valor === "string") corpo[chave] = valor;
    }

    try {
      const resposta = await fetch(rota, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(corpo),
      });

      const retorno = (await resposta.json().catch(() => ({}))) as {
        erro?: string;
      };

      if (!resposta.ok) {
        setErro(retorno.erro ?? "Não foi possível salvar.");
        return;
      }

      setSalvo(true);
      router.refresh();
    } catch {
      setErro("Falha de conexão.");
    } finally {
      setEnviando(false);
    }
  }

  return (
    <form onSubmit={enviar} className="flex flex-col gap-4">
      {erro && <Aviso>{erro}</Aviso>}
      {salvo && (
        <p
          role="status"
          className="border-sucesso/40 bg-sucesso/10 text-sucesso animate-surgir rounded-lg border px-3.5 py-2.5 text-sm"
        >
          Alterações salvas.
        </p>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        {campos.map((campo) =>
          campo.multilinha ? (
            <div key={campo.id} className="flex flex-col gap-1.5 sm:col-span-2">
              <label htmlFor={campo.id} className="text-texto-2 text-sm font-medium">
                {campo.rotulo}
              </label>
              <textarea
                id={campo.id}
                name={campo.id}
                rows={3}
                defaultValue={valores[campo.id] ?? ""}
                placeholder={campo.exemplo}
                className="bg-superficie border-borda text-texto placeholder:text-texto-3 focus:border-acento rounded-lg border px-3.5 py-2.5 text-sm transition-colors outline-none"
              />
              {campo.dica && (
                <p className="text-texto-3 text-xs">{campo.dica}</p>
              )}
            </div>
          ) : (
            <Campo
              key={campo.id}
              id={campo.id}
              name={campo.id}
              rotulo={campo.rotulo}
              placeholder={campo.exemplo}
              dica={campo.dica}
              defaultValue={valores[campo.id] ?? ""}
            />
          ),
        )}
      </div>

      <button
        type="submit"
        disabled={enviando}
        className="bg-acento text-fundo hover:bg-acento-hover mt-1 flex min-h-11 w-fit items-center rounded-full px-6 text-sm font-bold transition-colors disabled:opacity-60"
      >
        {enviando ? "Salvando…" : rotuloBotao}
      </button>
    </form>
  );
}
