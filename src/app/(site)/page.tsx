import { redirect } from "next/navigation";
import { estaAutenticado } from "@/lib/session";
import { Landing } from "@/components/landing";

/** Visitante vê a página institucional; quem já entrou vai para a plataforma. */
export default async function Home() {
  if (await estaAutenticado()) redirect("/inicio");
  return <Landing />;
}
