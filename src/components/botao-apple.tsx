"use client";

import Script from "next/script";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { Aviso } from "@/components/campo";

/**
 * Entrar com a Apple (web).
 *
 * Usa o Sign in with Apple JS em modo **popup**, que devolve o `id_token` ao
 * navegador; ele vai por POST para a nossa rota, que repassa à API. Popup em vez
 * de redirect pela mesma razão do Google: assim o nosso JWT nunca passa pela URL.
 *
 * Diferente do app nativo, o `clientId` aqui é o **Services ID** da Apple (não o
 * bundle id), e a Apple exige um `redirectURI` https já registrado nesse Services
 * ID. Sem `NEXT_PUBLIC_APPLE_CLIENT_ID` e `NEXT_PUBLIC_APPLE_REDIRECT_URI` o
 * componente não desenha nada — um botão que sempre falha é pior que botão nenhum.
 *
 * Não repete o divisor "ou": ele mora no BotaoGoogle, que vem logo acima.
 */
export function BotaoApple({ proximo = "/inicio" }: { proximo?: string }) {
  const router = useRouter();
  const clientId = process.env.NEXT_PUBLIC_APPLE_CLIENT_ID;
  const redirectURI = process.env.NEXT_PUBLIC_APPLE_REDIRECT_URI;

  const [erro, setErro] = useState("");
  const [entrando, setEntrando] = useState(false);
  const [pronto, setPronto] = useState(false);

  useEffect(() => {
    if (!pronto || !clientId || !redirectURI) return;
    const AppleID = (window as any).AppleID;
    if (!AppleID?.auth) return;
    AppleID.auth.init({
      clientId,
      scope: "name email",
      redirectURI,
      usePopup: true,
    });
  }, [pronto, clientId, redirectURI]);

  const entrar = useCallback(async () => {
    const AppleID = (window as any).AppleID;
    if (!AppleID?.auth) return;

    setErro("");
    setEntrando(true);

    let identityToken: string | undefined;
    let nome: string | undefined;
    try {
      const data = await AppleID.auth.signIn();
      identityToken = data?.authorization?.id_token;
      /*
        `user` só vem no PRIMEIRO login — depois a Apple não reenvia o nome.
        Montamos "nome" a partir dele quando existe; nas próximas vezes segue
        ausente e o backend resolve a conta pelo appleId.
      */
      const n = data?.user?.name;
      if (n) {
        nome = [n.firstName, n.lastName].filter(Boolean).join(" ").trim();
      }
    } catch (e: any) {
      setEntrando(false);
      // Fechar o popup não é erro que precise de aviso vermelho.
      if (e?.error === "popup_closed_by_user") return;
      setErro("Não foi possível entrar com a Apple. Tente de novo.");
      return;
    }

    if (!identityToken) {
      setEntrando(false);
      setErro("A Apple não devolveu um token. Tente de novo.");
      return;
    }

    const r = await fetch("/api/auth/apple", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(nome ? { identityToken, nome } : { identityToken }),
    });

    const corpo = await r.json().catch(() => ({}));

    if (!r.ok) {
      setEntrando(false);
      setErro(corpo.erro ?? "Não foi possível entrar com a Apple.");
      return;
    }

    /* `refresh` antes de navegar: o cookie acabou de ser gravado. */
    router.refresh();
    router.push(proximo);
  }, [proximo, router]);

  if (!clientId || !redirectURI) return null;

  return (
    <div className="flex flex-col gap-3">
      <Script
        src="https://appleid.cdn-apple.com/appleauth/static/jsapi/appleid/1/en_US/appleid.auth.js"
        strategy="afterInteractive"
        onReady={() => setPronto(true)}
      />

      <div className="flex justify-center">
        <button
          type="button"
          onClick={entrar}
          disabled={entrando}
          style={{ width: 320 }}
          className="flex h-11 items-center justify-center gap-2 rounded-full bg-black px-4 text-sm font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-60"
        >
          {/* Logo da Apple — exigência de marca no botão. */}
          <svg
            aria-hidden="true"
            viewBox="0 0 384 512"
            className="h-4 w-4"
            fill="currentColor"
          >
            <path d="M318.7 268.7c-.2-36.7 16.4-64.4 50-84.8-18.8-26.9-47.2-41.7-84.7-44.6-35.5-2.8-74.3 20.7-88.5 20.7-15 0-49.4-19.7-76.4-19.7C63.3 141.2 4 184.8 4 273.5q0 39.3 14.4 81.2c12.8 36.7 59 126.7 107.2 125.2 25.2-.6 43-17.9 75.8-17.9 31.8 0 48.3 17.9 76.4 17.9 48.6-.7 90.4-82.5 102.6-119.3-65.2-30.7-61.7-90-61.7-91.9zm-56.6-164.2c27.3-32.4 24.8-61.9 24-72.5-24.1 1.4-52 16.4-67.9 34.9-17.5 19.8-27.8 44.3-25.6 71.9 26.1 2 49.9-11.4 69.5-34.3z" />
          </svg>
          Continuar com a Apple
        </button>
      </div>

      {entrando && (
        <p className="text-texto-3 text-center text-sm">Entrando…</p>
      )}
      {erro && <Aviso>{erro}</Aviso>}
    </div>
  );
}
