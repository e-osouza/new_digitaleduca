"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Aviso } from "@/components/campo";

/**
 * Questionário de trilha automática. Os seis campos são obrigatórios no
 * `CreateAutoTrailDto`, então usamos opções fechadas: garante resposta válida
 * e evita texto livre que a API não sabe interpretar.
 */
const PERGUNTAS = [
  {
    id: "objetivo",
    titulo: "Qual é o seu objetivo agora?",
    opcoes: [
      "Aumentar as vendas",
      "Organizar a gestão",
      "Melhorar o marketing",
      "Controlar as finanças",
      "Liderar melhor o time",
    ],
  },
  {
    id: "areaInteresse",
    titulo: "Em que área quer se aprofundar?",
    opcoes: ["Vendas", "Marketing", "Gestão", "Finanças", "Inovação", "Liderança"],
  },
  {
    id: "nivelAtual",
    titulo: "Como você avalia seu nível hoje?",
    opcoes: ["Iniciante", "Intermediário", "Avançado"],
  },
  {
    id: "tempoDisponivel",
    titulo: "Quanto tempo por semana você tem?",
    opcoes: ["Até 1 hora", "1 a 3 horas", "3 a 5 horas", "Mais de 5 horas"],
  },
  {
    id: "preferencia",
    titulo: "Que formato você prefere?",
    opcoes: ["Aulas curtas", "Aulas longas", "Palestras", "Podcasts"],
  },
  {
    id: "objetivoFinal",
    titulo: "Onde quer chegar?",
    opcoes: [
      "Escalar o negócio",
      "Profissionalizar a operação",
      "Assumir uma liderança",
      "Trocar de área",
      "Me manter atualizado",
    ],
  },
] as const;

export function QuestionarioTrilha() {
  const router = useRouter();
  const [indice, setIndice] = useState(0);
  const [respostas, setRespostas] = useState<Record<string, string>>({});
  const [erro, setErro] = useState("");
  const [enviando, setEnviando] = useState(false);

  const pergunta = PERGUNTAS[indice];
  const ultima = indice === PERGUNTAS.length - 1;
  const escolhida = respostas[pergunta.id];

  function escolher(valor: string) {
    setRespostas((atual) => ({ ...atual, [pergunta.id]: valor }));
    setErro("");
    if (!ultima) setIndice(indice + 1);
  }

  async function criar() {
    setErro("");
    setEnviando(true);

    try {
      const resposta = await fetch("/api/trilhas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ modo: "auto", ...respostas }),
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
    <div className="flex flex-col gap-6">
      {erro && <Aviso>{erro}</Aviso>}

      <div className="flex flex-col gap-2">
        <div className="text-texto-3 flex items-center justify-between text-xs tabular-nums">
          <span>
            Pergunta {indice + 1} de {PERGUNTAS.length}
          </span>
          <span>{Math.round((indice / PERGUNTAS.length) * 100)}%</span>
        </div>
        <div className="bg-superficie-2 h-1.5 overflow-hidden rounded-full">
          <div
            className="bg-acento ease-suave h-full rounded-full transition-[width] duration-500"
            style={{ width: `${(indice / PERGUNTAS.length) * 100}%` }}
          />
        </div>
      </div>

      <fieldset className="flex flex-col gap-4">
        <legend className="font-display text-lg font-semibold text-balance">
          {pergunta.titulo}
        </legend>

        <div className="grid gap-2.5 sm:grid-cols-2">
          {pergunta.opcoes.map((opcao) => {
            const ativa = escolhida === opcao;
            return (
              <button
                key={opcao}
                type="button"
                onClick={() => escolher(opcao)}
                aria-pressed={ativa}
                className={`flex min-h-12 items-center rounded-xl border px-4 text-left text-sm font-medium transition-colors ${
                  ativa
                    ? "border-acento bg-acento/10 text-acento"
                    : "border-borda bg-superficie text-texto hover:border-acento/60 hover:bg-superficie-2"
                }`}
              >
                {opcao}
              </button>
            );
          })}
        </div>
      </fieldset>

      <div className="flex flex-wrap items-center gap-3">
        {indice > 0 && (
          <button
            type="button"
            onClick={() => setIndice(indice - 1)}
            className="border-borda bg-superficie hover:border-acento/60 hover:bg-superficie-2 flex min-h-11 items-center rounded-full border px-5 text-sm font-semibold transition-colors"
          >
            ← Voltar
          </button>
        )}

        {ultima && escolhida && (
          <button
            type="button"
            onClick={criar}
            disabled={enviando}
            className="bg-acento text-white hover:bg-acento-hover flex min-h-11 items-center rounded-full px-6 text-sm font-bold transition-colors disabled:opacity-60"
          >
            {enviando ? "Montando sua trilha…" : "Montar minha trilha"}
          </button>
        )}
      </div>
    </div>
  );
}
