import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /*
   * O `next dev` bloqueia requisições de origem cruzada aos seus próprios
   * assets — os chunks do Turbopack entre eles. Ao abrir a aplicação por um
   * túnel, o HTML chegava inteiro mas o JavaScript era recusado: a página não
   * hidratava e o formulário de login virava um submit nativo, que recarregava
   * a tela com e-mail e senha na URL sem entrar.
   *
   * Vale só em desenvolvimento; em produção a opção é ignorada.
   */
  allowedDevOrigins: ["*.ngrok-free.app", "*.ngrok.io", "*.trycloudflare.com"],
  images: {
    // Todas as imagens vêm do proxy de otimização da própria API (`/img`).
    loader: "custom",
    loaderFile: "./src/lib/image-loader.ts",
  },
};

export default nextConfig;
