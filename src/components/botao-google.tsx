"use client";

import Script from "next/script";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { Aviso } from "@/components/campo";

/**
 * Entrar com o Google.
 *
 * Usamos o Google Identity Services, que devolve um **ID token** ao navegador;
 * ele vai por POST para a nossa rota, que repassa à API. Escolhemos isso em
 * vez do fluxo de redirect porque assim o nosso JWT nunca passa pela URL — no
 * redirect ele ficaria no histórico, no `Referer` e no log de qualquer proxy.
 *
 * Sem `NEXT_PUBLIC_GOOGLE_CLIENT_ID` o componente não desenha nada. É de
 * propósito: um botão que sempre falha é pior do que botão nenhum, e assim o
 * recurso simplesmente não existe onde ainda não foi configurado.
 */
export function BotaoGoogle({ proximo = "/inicio" }: { proximo?: string }) {
  const router = useRouter();
  const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;

  const alvo = useRef<HTMLDivElement>(null);
  const [erro, setErro] = useState("");
  const [entrando, setEntrando] = useState(false);
  const [pronto, setPronto] = useState(false);

  const aoReceberCredencial = useCallback(
    async (resposta: { credential?: string }) => {
      const idToken = resposta?.credential;
      if (!idToken) {
        setErro("O Google não devolveu um token. Tente de novo.");
        return;
      }

      setErro("");
      setEntrando(true);

      const r = await fetch("/api/auth/google", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ idToken }),
      });

      const corpo = await r.json().catch(() => ({}));

      if (!r.ok) {
        setEntrando(false);
        setErro(corpo.erro ?? "Não foi possível entrar com o Google.");
        return;
      }

      /*
        `refresh` antes de navegar: o cookie acabou de ser gravado, e sem isso
        o layout da plataforma renderizaria com a sessão anterior (nenhuma) e
        devolveria a pessoa para o login.
      */
      router.refresh();
      router.push(proximo);
    },
    [proximo, router],
  );

  useEffect(() => {
    if (!pronto || !clientId || !alvo.current) return;

    const google = (window as any).google;
    if (!google?.accounts?.id) return;

    google.accounts.id.initialize({
      client_id: clientId,
      callback: aoReceberCredencial,
    });

    google.accounts.id.renderButton(alvo.current, {
      type: "standard",
      theme: "outline",
      size: "large",
      text: "continue_with",
      shape: "pill",
      locale: "pt-BR",
      width: 320,
    });
  }, [pronto, clientId, aoReceberCredencial]);

  if (!clientId) return null;

  return (
    <div className="flex flex-col gap-3">
      <Script
        src="https://accounts.google.com/gsi/client"
        strategy="afterInteractive"
        onReady={() => setPronto(true)}
      />

      <div className="flex items-center gap-3">
        <span className="bg-borda h-px flex-1" />
        <span className="text-texto-3 text-xs">ou</span>
        <span className="bg-borda h-px flex-1" />
      </div>

      {/* O Google desenha o próprio botão aqui — o visual dele é exigência da marca. */}
      <div className="flex justify-center">
        <div ref={alvo} />
      </div>

      {entrando && (
        <p className="text-texto-3 text-center text-sm">Entrando…</p>
      )}
      {erro && <Aviso>{erro}</Aviso>}
    </div>
  );
}
