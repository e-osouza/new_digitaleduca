"use client";

import { useCallback, useEffect, useState } from "react";

/** base64url → Uint8Array, formato exigido por `applicationServerKey`. */
function chaveParaBytes(base64: string) {
  const preenchido = (base64 + "=".repeat((4 - (base64.length % 4)) % 4))
    .replace(/-/g, "+")
    .replace(/_/g, "/");
  const bruto = atob(preenchido);
  return Uint8Array.from([...bruto].map((c) => c.charCodeAt(0)));
}

type Estado = "verificando" | "indisponivel" | "desligado" | "ligado" | "negado";

/**
 * Liga e desliga os avisos no navegador.
 *
 * Fica dentro do painel do sino porque é ali que a pessoa pensa no assunto —
 * uma opção escondida em configurações seria encontrada por quem já não
 * precisa dela.
 *
 * Não pedimos permissão sozinhos ao abrir a página. Navegador nenhum devolve
 * uma segunda chance depois de um "bloquear", e um pedido que chega sem
 * contexto costuma ser negado por reflexo — o que queimaria a permissão para
 * sempre. Só pedimos depois do clique, quando a intenção é explícita.
 */
export function AtivarAvisos() {
  const [estado, setEstado] = useState<Estado>("verificando");
  const [ocupado, setOcupado] = useState(false);
  const [erro, setErro] = useState("");

  const verificar = useCallback(async () => {
    if (
      typeof window === "undefined" ||
      !("serviceWorker" in navigator) ||
      !("PushManager" in window) ||
      !("Notification" in window)
    ) {
      setEstado("indisponivel");
      return;
    }

    /* Sem chave VAPID no servidor não há o que oferecer. */
    const chave = await fetch("/api/notificacoes/inscricao")
      .then((r) => r.json())
      .catch(() => ({ configurado: false }));

    if (!chave.configurado) {
      setEstado("indisponivel");
      return;
    }

    if (Notification.permission === "denied") {
      setEstado("negado");
      return;
    }

    const registro = await navigator.serviceWorker.getRegistration("/sw.js");
    const inscricao = await registro?.pushManager.getSubscription();
    setEstado(inscricao ? "ligado" : "desligado");
  }, []);

  useEffect(() => {
    verificar();
  }, [verificar]);

  async function ligar() {
    setErro("");
    setOcupado(true);

    try {
      const permissao = await Notification.requestPermission();
      if (permissao !== "granted") {
        setEstado(permissao === "denied" ? "negado" : "desligado");
        return;
      }

      const { chavePublica } = await fetch("/api/notificacoes/inscricao").then(
        (r) => r.json(),
      );
      if (!chavePublica) throw new Error("sem chave");

      const registro = await navigator.serviceWorker.register("/sw.js");
      await navigator.serviceWorker.ready;

      const inscricao = await registro.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: chaveParaBytes(chavePublica),
      });

      const bruta = inscricao.toJSON() as {
        endpoint?: string;
        keys?: { p256dh?: string; auth?: string };
      };

      const r = await fetch("/api/notificacoes/inscricao", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          endpoint: bruta.endpoint,
          p256dh: bruta.keys?.p256dh,
          auth: bruta.keys?.auth,
        }),
      });
      if (!r.ok) throw new Error("falha ao salvar");

      setEstado("ligado");
    } catch {
      setErro("Não foi possível ativar agora.");
    } finally {
      setOcupado(false);
    }
  }

  async function desligar() {
    setErro("");
    setOcupado(true);

    try {
      const registro = await navigator.serviceWorker.getRegistration("/sw.js");
      const inscricao = await registro?.pushManager.getSubscription();

      if (inscricao) {
        /*
          Avisa o servidor ANTES de cancelar no navegador: depois do
          `unsubscribe` o endpoint deixa de existir, e sem ele o servidor não
          teria como achar a linha para apagar.
        */
        await fetch("/api/notificacoes/inscricao", {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ endpoint: inscricao.endpoint }),
        }).catch(() => {});

        await inscricao.unsubscribe();
      }

      setEstado("desligado");
    } catch {
      setErro("Não foi possível desativar agora.");
    } finally {
      setOcupado(false);
    }
  }

  if (estado === "verificando" || estado === "indisponivel") return null;

  return (
    <div className="border-borda-suave flex flex-col gap-1 border-t pt-3">
      {estado === "negado" ? (
        <p className="text-texto-3 text-xs leading-relaxed">
          Os avisos estão bloqueados para este site no seu navegador. Para
          voltar a recebê-los, libere as notificações nas permissões da página.
        </p>
      ) : (
        <button
          type="button"
          onClick={estado === "ligado" ? desligar : ligar}
          disabled={ocupado}
          className="text-texto-2 hover:bg-superficie-2 hover:text-texto flex min-h-10 items-center justify-between rounded-lg px-3 text-sm transition-colors disabled:opacity-60"
        >
          <span>
            {estado === "ligado"
              ? "Avisos ativos neste navegador"
              : "Receber avisos neste navegador"}
          </span>
          <span className="text-texto-3 text-xs">
            {ocupado ? "…" : estado === "ligado" ? "desativar" : "ativar"}
          </span>
        </button>
      )}

      {erro && <p className="text-alerta px-3 text-xs">{erro}</p>}
    </div>
  );
}
