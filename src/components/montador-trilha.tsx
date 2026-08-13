"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { formatarDuracao } from "@/lib/format";
import { Aviso, Campo } from "@/components/campo";
import type { ConteudoCatalogo } from "@/types/api";

/**
 * Montagem manual: escolhe aulas do catálogo e envia `videoIds` na ordem em
 * que foram selecionadas — é essa ordem que vira o `orderIndex` da trilha.
 */
export function MontadorTrilha({
  catalogo,
}: {
  catalogo: ConteudoCatalogo[];
}) {
  const router = useRouter();
  const [escolhidas, setEscolhidas] = useState<
    { videoId: number; titulo: string; duracao: number }[]
  >([]);
  const [erro, setErro] = useState("");
  const [enviando, setEnviando] = useState(false);

  const selecionados = new Set(escolhidas.map((a) => a.videoId));
  const duracaoTotal = escolhidas.reduce((soma, a) => soma + a.duracao, 0);

  function alternar(videoId: number, titulo: string, duracao: number) {
    setEscolhidas((atual) =>
      atual.some((a) => a.videoId === videoId)
        ? atual.filter((a) => a.videoId !== videoId)
        : [...atual, { videoId, titulo, duracao }],
    );
  }

  async function criar(evento: React.FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    setErro("");
    setEnviando(true);

    const dados = new FormData(evento.currentTarget);

    try {
      const resposta = await fetch("/api/trilhas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          modo: "manual",
          titulo: String(dados.get("titulo") ?? "").trim(),
          descricao: String(dados.get("descricao") ?? "").trim(),
          videoIds: escolhidas.map((a) => a.videoId),
        }),
      });

      const corpo = (await resposta.json().catch(() => ({}))) as {
        erro?: string;
        id?: number | null;
      };

      if (!resposta.ok) {
        setErro(corpo.erro ?? "Não foi possível criar a trilha.");
        setEnviando(false);
        return;
      }

      router.replace(corpo.id ? `/trilhas/${corpo.id}` : "/trilhas");
      router.refresh();
    } catch {
      setErro("Falha de conexão.");
      setEnviando(false);
    }
  }

  return (
    <form onSubmit={criar} className="flex flex-col gap-8">
      {erro && <Aviso>{erro}</Aviso>}

      <div className="grid gap-4 sm:grid-cols-2">
        <Campo
          id="titulo"
          name="titulo"
          rotulo="Nome da trilha"
          required
          placeholder="Fundamentos de gestão financeira"
        />
        <Campo
          id="descricao"
          name="descricao"
          rotulo="Descrição (opcional)"
          placeholder="Para que serve esta trilha"
        />
      </div>

      <section className="flex flex-col gap-4">
        <h2 className="font-display text-lg font-semibold">
          Escolha as aulas
          {escolhidas.length > 0 && (
            <span className="text-texto-3 ml-2 text-sm font-normal tabular-nums">
              {escolhidas.length}{" "}
              {escolhidas.length === 1 ? "aula" : "aulas"}
              {duracaoTotal > 0 && ` · ${formatarDuracao(duracaoTotal)}`}
            </span>
          )}
        </h2>

        {catalogo.length === 0 ? (
          <p className="text-texto-3 text-sm">
            Nenhum conteúdo disponível no catálogo agora.
          </p>
        ) : (
          <div className="flex flex-col gap-4">
            {catalogo.map((conteudo) => (
              <details
                key={conteudo.id}
                className="border-borda-suave bg-superficie rounded-xl border"
              >
                <summary className="flex min-h-14 items-center gap-3 px-4 py-3 text-sm font-semibold">
                  <span className="flex-1">{conteudo.titulo}</span>
                  <span className="text-texto-3 text-xs font-normal tabular-nums">
                    {conteudo.totalAulas}{" "}
                    {conteudo.totalAulas === 1 ? "aula" : "aulas"}
                  </span>
                </summary>

                <ul className="divide-borda-suave divide-y border-t">
                  {conteudo.aulas.map((aula) => {
                    const marcada = selecionados.has(aula.videoId);
                    const ordem =
                      escolhidas.findIndex((a) => a.videoId === aula.videoId) + 1;

                    return (
                      <li key={aula.videoId}>
                        <label className="hover:bg-superficie-2 flex min-h-14 cursor-pointer items-center gap-3 px-4 py-3 transition-colors">
                          <input
                            type="checkbox"
                            checked={marcada}
                            onChange={() =>
                              alternar(
                                aula.videoId,
                                aula.titulo,
                                aula.duracaoSegundos,
                              )
                            }
                            className="accent-acento h-4 w-4 shrink-0"
                          />

                          {marcada && (
                            <span className="bg-acento text-white flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold tabular-nums">
                              {ordem}
                            </span>
                          )}

                          <span className="flex min-w-0 flex-1 flex-col">
                            <span className="text-sm leading-snug">
                              {aula.titulo}
                            </span>
                            {aula.moduloTitulo && (
                              <span className="text-texto-3 text-xs">
                                {aula.moduloTitulo}
                              </span>
                            )}
                          </span>

                          {aula.duracaoSegundos > 0 && (
                            <span className="text-texto-3 shrink-0 text-xs tabular-nums">
                              {formatarDuracao(aula.duracaoSegundos)}
                            </span>
                          )}
                        </label>
                      </li>
                    );
                  })}
                </ul>
              </details>
            ))}
          </div>
        )}
      </section>

      <button
        type="submit"
        disabled={enviando || escolhidas.length === 0}
        className="bg-acento text-white hover:bg-acento-hover flex min-h-12 w-fit items-center rounded-full px-7 text-sm font-bold transition-colors disabled:opacity-60"
      >
        {enviando
          ? "Criando…"
          : escolhidas.length === 0
            ? "Escolha ao menos uma aula"
            : `Criar trilha com ${escolhidas.length} ${escolhidas.length === 1 ? "aula" : "aulas"}`}
      </button>
    </form>
  );
}
