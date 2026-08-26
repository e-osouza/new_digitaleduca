"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import type { CaixaDeNotificacoes, Notificacao } from "@/types/api";

/** "há 3 h", "ontem" — precisão de relógio não ajuda quem só quer saber se é recente. */
function quando(iso: string) {
  const minutos = Math.round((Date.now() - new Date(iso).getTime()) / 60000);
  if (minutos < 1) return "agora";
  if (minutos < 60) return `há ${minutos} min`;
  const horas = Math.round(minutos / 60);
  if (horas < 24) return `há ${horas} h`;
  const dias = Math.round(horas / 24);
  if (dias === 1) return "ontem";
  if (dias < 30) return `há ${dias} dias`;
  return new Intl.DateTimeFormat("pt-BR", { dateStyle: "short" }).format(
    new Date(iso),
  );
}

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
      if (ref.current && !ref.current.contains(e.target as Node)) setAberto(false);
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
              {itens.map((n) => {
                const corpo = (
                  <>
                    <span className="flex items-start gap-2">
                      {/* Marca de não lida — acompanhada do peso do texto, nunca só a cor. */}
                      <span
                        aria-hidden="true"
                        className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${
                          n.lida ? "bg-transparent" : "bg-acento"
                        }`}
                      />
                      <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                        <span
                          className={`text-sm ${n.lida ? "text-texto-2" : "text-texto font-semibold"}`}
                        >
                          {n.titulo}
                        </span>
                        <span className="text-texto-2 line-clamp-2 text-xs">
                          {n.mensagem}
                        </span>
                        <span className="text-texto-3 text-[11px]">
                          {quando(n.createdAt)}
                          {!n.lida && (
                            <span className="sr-only"> · não lida</span>
                          )}
                        </span>
                      </span>
                    </span>
                  </>
                );

                return (
                  <li key={n.id}>
                    {n.link ? (
                      <Link
                        href={n.link}
                        onClick={() => {
                          if (!n.lida) marcar(n.id);
                          setAberto(false);
                        }}
                        className="hover:bg-superficie-2 block rounded-lg px-3 py-2.5 transition-colors"
                      >
                        {corpo}
                      </Link>
                    ) : (
                      <button
                        type="button"
                        onClick={() => !n.lida && marcar(n.id)}
                        className="hover:bg-superficie-2 block w-full rounded-lg px-3 py-2.5 text-left transition-colors"
                      >
                        {corpo}
                      </button>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
