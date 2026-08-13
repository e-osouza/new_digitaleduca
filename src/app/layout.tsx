import type { Metadata, Viewport } from "next";
import { Outfit, Funnel_Display } from "next/font/google";
import "./globals.css";
import { lerTema } from "@/lib/tema";

// Mesmas famílias do site institucional.
const corpo = Outfit({
  variable: "--fonte-corpo",
  subsets: ["latin"],
  display: "swap",
});

const display = Funnel_Display({
  variable: "--fonte-display",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "Digital Educa | Educação Corporativa para Resultados",
    template: "%s · Digital Educa",
  },
  description:
    "Sua plataforma de educação corporativa com cursos, palestras e conteúdos exclusivos.",
  /*
   * Sem `icons` aqui: `app/icon.png` e `app/apple-icon.png` são convenções de
   * arquivo do Next, que já emite os <link> com tipo, tamanho e hash de cache.
   * Declarar também por metadata produziria duas tags para o mesmo ícone — e
   * era o `favicon.ico` do template, que vinha antes, que o navegador escolhia.
   */
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#F4F8FB" },
    { media: "(prefers-color-scheme: dark)", color: "#04121D" },
  ],
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Resolvido no servidor: o HTML já sai com o tema certo, sem piscada.
  const tema = await lerTema();

  return (
    <html
      lang="pt-BR"
      data-tema={tema}
      className={`${corpo.variable} ${display.variable} h-full antialiased`}
    >
      <body className="bg-fundo text-texto h-full">{children}</body>
    </html>
  );
}
