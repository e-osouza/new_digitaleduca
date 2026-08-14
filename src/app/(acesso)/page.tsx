import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { estaAutenticado } from "@/lib/session";
import { FormularioLogin } from "@/components/formulario-login";
import { MolduraAcesso } from "@/components/moldura-acesso";
import { Nota } from "@/components/campo";

export const metadata: Metadata = { title: "Entrar" };

/**
 * Home da plataforma: o login.
 *
 * A página institucional saiu deste projeto — ela agora vive em
 * `digitaleduca.com.vc`, e este app responde por
 * `plataforma.digitaleduca.com.vc`. Como o domínio só serve quem vai acessar a
 * plataforma, a raiz é a tela de entrada, sem intermediários.
 *
 * `/entrar` continua existindo como redirect: o `proxy.ts`, o fluxo de sessão
 * expirada e links antigos apontam para lá.
 */
export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{
    proximo?: string;
    expirada?: string;
    criada?: string;
  }>;
}) {
  const { proximo, expirada, criada } = await searchParams;

  // Quem chega vindo de /api/auth/expirar já teve o cookie apagado; não faz
  // sentido conferir a sessão de novo.
  if (!expirada && (await estaAutenticado())) redirect("/inicio");

  // Só aceitamos caminhos internos — evita redirecionamento para fora do site.
  const destino = proximo?.startsWith("/") ? proximo : "/inicio";

  return (
    <MolduraAcesso
      titulo="Entrar"
      descricao="Acesse suas trilhas, aulas e o progresso de onde parou."
      /*
       * `criada=1` chega de quem acabou de se cadastrar sem que o login
       * automático desse certo. Sem esta nota, a pessoa criava a conta e caía
       * num formulário de login em branco, sem saber se tinha funcionado.
       */
      aviso={
        expirada ? (
          <Nota>Sua sessão expirou. Entre de novo para continuar de onde parou.</Nota>
        ) : criada ? (
          <Nota>
            Conta criada. Entre com o e-mail e a senha que você acabou de
            cadastrar.
          </Nota>
        ) : null
      }
    >
      <Suspense>
        <FormularioLogin proximo={destino} />
      </Suspense>
    </MolduraAcesso>
  );
}
