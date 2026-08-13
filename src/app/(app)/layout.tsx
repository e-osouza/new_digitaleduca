import { Suspense } from "react";
import { api, ApiError } from "@/lib/api";
import { normalizarMe } from "@/lib/queries";
import { encerrarSessaoExpirada } from "@/lib/sessao-expirada";
import { AppShell } from "@/components/app-shell";
import { saudacao } from "@/lib/saudacao";
import { AvisoEmail } from "@/components/aviso-email";
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

  // Só avisamos quando a API afirma que não está verificado — campo ausente
  // não deve virar alarme falso.
  const precisaConfirmar = usuario?.emailVerified === false;

  return (
    <Suspense>
      <AppShell
        nome={usuario?.nome ?? null}
        email={usuario?.email ?? null}
        saudacao={saudacao(usuario?.nome ?? null)}
      >
        {precisaConfirmar && <AvisoEmail />}
        {children}
      </AppShell>
    </Suspense>
  );
}
