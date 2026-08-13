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
  searchParams: Promise<{ proximo?: string; expirada?: string }>;
}) {
  const { proximo, expirada } = await searchParams;

  // Quem chega vindo de /api/auth/expirar já teve o cookie apagado; não faz
  // sentido conferir a sessão de novo.
  if (!expirada && (await estaAutenticado())) redirect("/inicio");

  // Só aceitamos caminhos internos — evita redirecionamento para fora do site.
  const destino = proximo?.startsWith("/") ? proximo : "/inicio";

  return (
    <MolduraAcesso
      titulo="Entrar"
      descricao="Acesse suas trilhas, aulas e o progresso de onde parou."
      aviso={
        expirada ? (
          <Nota>Sua sessão expirou. Entre de novo para continuar de onde parou.</Nota>
        ) : null
      }
    >
      <Suspense>
        <FormularioLogin proximo={destino} />
      </Suspense>
    </MolduraAcesso>
  );
}
