import { Suspense } from "react";
import { api, ApiError } from "@/lib/api";
import { contarNotificacoesNaoLidas, normalizarMe } from "@/lib/queries";
import { encerrarSessaoExpirada } from "@/lib/sessao-expirada";
import { AppShell } from "@/components/app-shell";
import { saudacao } from "@/lib/saudacao";
import { AvisoEmail } from "@/components/aviso-email";
import { ProvedorPodcast } from "@/components/podcast/provedor";
import { MiniPlayerPodcast } from "@/components/podcast/mini-player";
import type { MeResponse } from "@/types/api";

/** Layout da plataforma logada: menu lateral fixo e conteúdo rolando ao lado. */
export default async function LayoutApp({
  children,
}: {
  children: React.ReactNode;
}) {
  /*
   * Esta é a única chamada estrita do layout: se a API recusar o token, o
   * cookie é apagado aqui. O proxy só verifica a presença do cookie, então
   * sem esta validação uma sessão expirada ficaria presa entre o login e a
   * plataforma.
   */
  let me: MeResponse | null = null;
  try {
    me = await api<MeResponse>("/usuario/me", {
      autenticado: true,
      revalidar: false,
    });
  } catch (erro) {
    if (erro instanceof ApiError && erro.naoAutenticado) {
      encerrarSessaoExpirada("/inicio");
    }
    // Outras falhas (API fora do ar) não devem deslogar ninguém.
  }

  const { usuario } = normalizarMe(me);

  /*
    Só o número. A lista fica para quando o sino abrir — buscá-la aqui seria
    uma consulta em toda navegação para, quase sempre, não mostrar nada.
  */
  const naoLidas = usuario ? await contarNotificacoesNaoLidas() : 0;

  // Só avisamos quando a API afirma que não está verificado — campo ausente
  // não deve virar alarme falso.
  const precisaConfirmar = usuario?.emailVerified === false;

  return (
    <Suspense>
      {/*
        O provedor fica ACIMA do AppShell de propósito: é o que mantém o
        elemento de mídia montado enquanto as páginas trocam por baixo. Descê-lo
        para dentro de uma página faria o áudio morrer na primeira navegação, e
        o mini player do rodapé não teria o que controlar.
      */}
      <ProvedorPodcast>
        <AppShell
          nome={usuario?.nome ?? null}
          email={usuario?.email ?? null}
          avatar={usuario?.avatar ?? null}
          saudacao={saudacao(usuario?.nome ?? null)}
          /*
            O papel já veio no /usuario/me que este layout busca de qualquer
            forma — o item do Club no menu não custa uma requisição a mais.
          */
          ehClub={usuario?.role === "CLUB"}
          naoLidas={naoLidas}
        >
          {precisaConfirmar && <AvisoEmail />}
          {children}
        </AppShell>

        <MiniPlayerPodcast />
      </ProvedorPodcast>
    </Suspense>
  );
}
