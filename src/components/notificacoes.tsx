"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { AtivarAvisos } from "@/components/ativar-avisos";
import { ItemNotificacao } from "@/components/notificacao-item";
import type { CaixaDeNotificacoes, Notificacao } from "@/types/api";

/**
 * Sino de notificações do cabeçalho.
 *
 * O contador vem do servidor junto da página — é um número só, e assim o ponto
 * aparece sem esperar requisição. A LISTA só é buscada quando o painel abre:
 * ela interessa a quem clica, e carregá-la em toda navegação seria uma consulta
 * por página para, quase sempre, não mostrar nada.
 *
 * Marcar como lida é otimista: o número cai na hora e a requisição segue por
 * baixo. Se falhar, o pior caso é o contador voltar na próxima navegação —
 * bem melhor do que travar a interface esperando confirmação de algo que não
 * muda nada no mundo.
 */
export function Notificacoes({ naoLidas = 0 }: { naoLidas?: number }) {
  const router = useRouter();
  const ref = useRef<HTMLDivElement>(null);

  const [aberto, setAberto] = useState(false);
  const [contador, setContador] = useState(naoLidas);
  const [itens, setItens] = useState<Notificacao[] | null>(null);
  const [erro, setErro] = useState("");

  /* O contador do servidor manda: ele chega novo a cada navegação. */
  useEffect(() => setContador(naoLidas), [naoLidas]);

  const carregar = useCallback(async () => {
    setErro("");
    try {
      const r = await fetch("/api/notificacoes?limit=15");
      if (!r.ok) throw new Error();
      const dados = (await r.json()) as CaixaDeNotificacoes;
      setItens(dados.data);
      setContador(dados.naoLidas);
    } catch {
      setItens([]);
      setErro("Não foi possível carregar agora.");
    }
  }, []);

  useEffect(() => {
    if (aberto && itens === null) carregar();
  }, [aberto, itens, carregar]);

  useEffect(() => {
    if (!aberto) return;
    const fora = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node))
        setAberto(false);
    };
    const esc = (e: KeyboardEvent) => {
      if (e.key === "Escape") setAberto(false);
    };
    document.addEventListener("mousedown", fora);
    document.addEventListener("keydown", esc);
    return () => {
      document.removeEventListener("mousedown", fora);
      document.removeEventListener("keydown", esc);
    };
  }, [aberto]);

  async function marcar(id?: number) {
    // Otimista: a interface já reflete o resultado esperado.
    if (id) {
      setItens((atuais) =>
        (atuais ?? []).map((n) => (n.id === id ? { ...n, lida: true } : n)),
      );
      setContador((c) => Math.max(0, c - 1));
    } else {
      setItens((atuais) => (atuais ?? []).map((n) => ({ ...n, lida: true })));
      setContador(0);
    }

    await fetch("/api/notificacoes/ler", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(id ? { id } : {}),
    }).catch(() => {});

    /* Sincroniza o contador que o servidor manda no cabeçalho. */
    router.refresh();
  }

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setAberto((a) => !a)}
        aria-expanded={aberto}
        aria-haspopup="dialog"
        aria-label={
          contador > 0
            ? `Notificações, ${contador} não ${contador === 1 ? "lida" : "lidas"}`
            : "Notificações"
        }
        title="Notificações"
        className={`border-borda hover:border-acento/60 hover:bg-superficie-2 hover:text-texto relative flex h-11 w-11 items-center justify-center rounded-full border transition-colors sm:h-10 sm:w-10 ${
          aberto ? "bg-superficie-2 text-texto" : "text-texto-2"
        }`}
      >
        <svg
          viewBox="0 0 20 20"
          aria-hidden="true"
          className="h-5 w-5"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M15 8a5 5 0 0 0-10 0c0 4-1.5 5.5-1.5 5.5h13S15 12 15 8Z" />
          <path d="M11.7 16a2 2 0 0 1-3.4 0" />
        </svg>

        {/*
          O número vai junto do ponto: cor sozinha não diz quantos são, e para
          quem não distingue a cor o ponto sumiria no contorno do botão.
        */}
        {contador > 0 && (
          <span className="bg-acento absolute -top-0.5 -right-0.5 flex h-5 min-w-5 items-center justify-center rounded-full px-1 text-[10px] font-bold text-white tabular-nums">
            {contador > 9 ? "9+" : contador}
          </span>
        )}
      </button>

      {aberto && (
        <div
          role="dialog"
          aria-label="Notificações"
          /*
            Ancorado à direita porque o sino é o último item do cabeçalho —
            abrir para a esquerda jogaria o painel para fora da tela.
          */
          className="border-borda-suave bg-superficie animate-subir absolute right-0 z-50 mt-2 flex w-[min(22rem,calc(100vw-2rem))] flex-col gap-3 rounded-2xl border p-4 shadow-xl"
        >
          <div className="flex items-baseline justify-between gap-3">
            <h2 className="font-display text-sm font-semibold">Notificações</h2>
            {contador > 0 && (
              <button
                type="button"
                onClick={() => marcar()}
                className="text-texto-3 hover:text-acento text-xs font-medium transition-colors"
              >
                Marcar todas como lidas
              </button>
            )}
          </div>

          {itens === null ? (
            <p className="text-texto-3 py-6 text-center text-sm">Carregando…</p>
          ) : itens.length === 0 ? (
            <div className="border-borda-suave flex flex-col items-center gap-2 rounded-xl border border-dashed px-4 py-6 text-center">
              <p className="text-texto-2 text-sm font-medium">
                {erro || "Nada por aqui"}
              </p>
              {!erro && (
                <p className="text-texto-3 text-xs leading-relaxed">
                  Quando entrar conteúdo novo ou a equipe enviar um aviso, ele
                  aparece aqui.
                </p>
              )}
            </div>
          ) : (
            <ul className="-mx-1 flex max-h-96 flex-col overflow-y-auto">
              {itens.map((n) => (
                <li key={n.id}>
                  <ItemNotificacao
                    notificacao={n}
                    aoLer={marcar}
                    aoNavegar={() => setAberto(false)}
                    denso
                  />
                </li>
              ))}
            </ul>
          )}

          {/*
            A saída para a caixa inteira. O painel mostra os 15 mais recentes e
            para por aí de propósito — quem precisa procurar um aviso de ontem
            precisa de uma página, com paginação, não de uma gaveta que cresce.
          */}
          <Link
            href="/notificacoes"
            onClick={() => setAberto(false)}
            className="border-borda-suave text-texto-2 hover:border-acento/60 hover:text-texto flex min-h-10 items-center justify-center rounded-full border text-sm font-semibold transition-colors"
          >
            Ver todas
          </Link>

          <AtivarAvisos />
        </div>
      )}
    </div>
  );
}
