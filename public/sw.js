/*
 * Service worker de notificações.
 *
 * Fica na raiz de propósito: o escopo de um service worker é a pasta onde ele
 * está servido, e só a partir da raiz ele cobre a plataforma inteira.
 *
 * Não faz cache de nada. É só o canal de push — misturar cache aqui traria
 * versões velhas da aplicação para dentro de um arquivo que quase nunca muda.
 */

self.addEventListener("push", (evento) => {
  if (!evento.data) return;

  let dados = {};
  try {
    dados = evento.data.json();
  } catch {
    // Payload sem JSON: mostra o texto cru em vez de engolir o aviso.
    dados = { title: "Digital Educa", body: evento.data.text() };
  }

  const titulo = dados.title || "Digital Educa";
  const corpo = dados.body || "";
  const extra = dados.data || {};

  evento.waitUntil(
    self.registration.showNotification(titulo, {
      body: corpo,
      icon: "/logo/favicon.png",
      badge: "/logo/favicon.png",
      image: dados.imageUrl || extra.imageUrl || undefined,
      /*
       * `tag` com o id evita empilhar a mesma notificação quando o envio é
       * repetido; sem ela, um reenvio viraria dois avisos idênticos.
       */
      tag: extra.notificacaoId ? `de-${extra.notificacaoId}` : undefined,
      data: {
        link: extra.link || dados.link || "/inicio",
        notificacaoId: extra.notificacaoId || null,
      },
    }),
  );
});

self.addEventListener("notificationclick", (evento) => {
  evento.notification.close();

  const dados = evento.notification.data || {};
  const destino = dados.link || "/inicio";

  evento.waitUntil(
    (async () => {
      /*
       * Marca como lida ao tocar. `keepalive` porque a aba pode nem existir e
       * o service worker é encerrado logo depois — sem isso a requisição
       * morreria antes de sair.
       */
      if (dados.notificacaoId) {
        try {
          await fetch("/api/notificacoes/ler", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ id: Number(dados.notificacaoId) }),
            keepalive: true,
          });
        } catch {
          // Falhar aqui não pode impedir a abertura do conteúdo.
        }
      }

      /*
       * Reaproveita uma aba já aberta da plataforma em vez de abrir outra:
       * quem tem o site aberto não quer uma segunda janela igual.
       */
      const abas = await self.clients.matchAll({
        type: "window",
        includeUncontrolled: true,
      });

      for (const aba of abas) {
        if (aba.url.includes(self.location.origin)) {
          await aba.focus();
          if ("navigate" in aba) await aba.navigate(destino);
          return;
        }
      }

      await self.clients.openWindow(destino);
    })(),
  );
});
