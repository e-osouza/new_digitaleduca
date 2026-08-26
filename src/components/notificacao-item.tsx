"use client";

import Link from "next/link";
import type { Notificacao } from "@/types/api";

/** "há 3 h", "ontem" — precisão de relógio não ajuda quem só quer saber se é recente. */
export function quando(iso: string) {
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
 * Uma notificação na lista — a mesma peça no painel do sino e na página.
 *
 * Existe como componente próprio porque os dois lugares precisam concordar:
 * quando o painel ganhou a marca de não lida e o corte em duas linhas, a
 * página teria de repetir tudo à mão, e a primeira divergência apareceria na
 * primeira mudança.
 *
 * O que muda entre os dois é só o tamanho: `denso` é a versão do painel, que
 * mostra três linhas de cada aviso num espaço de 22rem.
 */
export function ItemNotificacao({
  notificacao,
  aoLer,
  aoNavegar,
  denso = false,
}: {
  notificacao: Notificacao;
  /** Marca como lida — otimista em quem chama. */
  aoLer: (id: number) => void;
  /** O painel se fecha ao navegar; a página não tem o que fechar. */
  aoNavegar?: () => void;
  denso?: boolean;
}) {
  const n = notificacao;

  const corpo = (
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
        <span
          className={`text-texto-2 text-xs ${denso ? "line-clamp-2" : "leading-relaxed"}`}
        >
          {n.mensagem}
        </span>
        <span className="text-texto-3 text-[11px]">
          {quando(n.createdAt)}
          {!n.lida && <span className="sr-only"> · não lida</span>}
        </span>
      </span>
    </span>
  );

  const classe = denso
    ? "hover:bg-superficie-2 block rounded-lg px-3 py-2.5 transition-colors"
    : "hover:bg-superficie-2 block px-4 py-4 transition-colors sm:px-5";

  return n.link ? (
    <Link
      href={n.link}
      onClick={() => {
        if (!n.lida) aoLer(n.id);
        aoNavegar?.();
      }}
      className={classe}
    >
      {corpo}
    </Link>
  ) : (
    <button
      type="button"
      onClick={() => !n.lida && aoLer(n.id)}
      className={`${classe} w-full text-left`}
    >
      {corpo}
    </button>
  );
}
