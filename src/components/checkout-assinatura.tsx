"use client";

import { useEffect, useId, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Modal } from "@/components/modal";
import { Aviso, Campo } from "@/components/campo";
import { formatarPreco } from "@/lib/format";
import {
  cpfValido,
  exigeCpf,
  formatarCpf,
  opcoesDeCobranca,
  type Cobranca,
} from "@/lib/assinatura";
import {
  gerarTokenDoCartao,
  iniciarMercadoPago,
  mercadoPagoConfigurado,
  montarCampos,
  traduzirErro,
  type CamposDoCartao,
} from "@/lib/mercadopago";
import type { Plano } from "@/types/api";

/**
 * Checkout da assinatura, em modal sobre a tela de planos.
 *
 * Os três campos do cartão são iframes do Mercado Pago — nosso JavaScript não
 * lê o que se digita neles. O que este componente monta é só a moldura: nome
 * do titular, parcelas e, quando parcelado, CPF. Ver `lib/mercadopago.ts`.
 */
export function CheckoutAssinatura({
  plano,
  destinoAposAssinar,
}: {
  plano: Plano;
  /** Para onde levar quem acabou de assinar — em geral, de volta ao conteúdo. */
  destinoAposAssinar?: string;
}) {
  const router = useRouter();
  const [aberto, setAberto] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setAberto(true)}
        className="bg-acento text-white hover:bg-acento-hover mt-auto flex min-h-12 items-center justify-center rounded-full px-6 text-sm font-bold transition-colors"
      >
        Assinar {plano.nome}
      </button>

      {/*
        O formulário só monta quando o modal abre. Montar antes injetaria os
        iframes do Mercado Pago em toda visita à página de planos, inclusive
        de quem só passou os olhos nos preços.
      */}
      {aberto && (
        <Formulario
          plano={plano}
          aoFechar={() => setAberto(false)}
          aoConcluir={() => {
            setAberto(false);
            router.replace(destinoAposAssinar ?? "/inicio");
            router.refresh();
          }}
        />
      )}
    </>
  );
}

function Formulario({
  plano,
  aoFechar,
  aoConcluir,
}: {
  plano: Plano;
  aoFechar: () => void;
  aoConcluir: () => void;
}) {
  const base = useId().replace(/:/g, "");
  const ids = {
    numero: `cartao-numero-${base}`,
    validade: `cartao-validade-${base}`,
    cvv: `cartao-cvv-${base}`,
  };

  const opcoes = opcoesDeCobranca(plano);
  const [cobranca, setCobranca] = useState<Cobranca>(opcoes[0]);
  const [titular, setTitular] = useState("");
  const [cpf, setCpf] = useState("");
  const [erro, setErro] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [pronto, setPronto] = useState(false);

  /*
   * O SDK fica em ref, e não em estado: trocá-lo não deve redesenhar nada, e
   * um render no meio da montagem dos iframes os derrubaria.
   */
  const mp = useRef<Awaited<ReturnType<typeof iniciarMercadoPago>> | null>(null);
  const campos = useRef<CamposDoCartao | null>(null);

  useEffect(() => {
    let vivo = true;

    (async () => {
      try {
        const instancia = await iniciarMercadoPago();
        if (!vivo) return;
        mp.current = instancia;
        campos.current = montarCampos(instancia, ids);
        setPronto(true);
      } catch (e) {
        if (vivo) setErro(traduzirErro(e));
      }
    })();

    return () => {
      vivo = false;
      campos.current?.desmontar();
      campos.current = null;
    };
    // Os ids são estáveis (useId) e o SDK monta uma vez só, por abertura.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const precisaCpf = exigeCpf(cobranca);

  async function enviar(evento: React.FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    setErro("");

    if (titular.trim().length < 3) {
      setErro("Digite o nome como está impresso no cartão.");
      return;
    }
    if (precisaCpf && !cpfValido(cpf)) {
      setErro("CPF do titular inválido.");
      return;
    }
    if (!mp.current) {
      setErro("O pagamento ainda está carregando. Tente de novo em instantes.");
      return;
    }

    setEnviando(true);
    try {
      /*
       * Primeiro o token, depois a assinatura. Se a tokenização falhar, nada
       * chega ao nosso servidor — e o cartão não foi cobrado.
       */
      const cardToken = await gerarTokenDoCartao(mp.current, {
        titular,
        cpf: precisaCpf ? cpf : undefined,
      });

      const resposta = await fetch("/api/assinatura", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          planoId: plano.id,
          cardToken,
          installments: cobranca.parcelas,
          ...(precisaCpf ? { payerDoc: cpf } : {}),
        }),
      });

      if (!resposta.ok) {
        const corpo = (await resposta.json().catch(() => ({}))) as {
          erro?: string;
        };
        /*
         * O token do Mercado Pago é de uso único: depois de uma recusa ele já
         * não vale, e tentar de novo com o mesmo daria outro erro, agora
         * enganoso. Por isso o formulário volta a pedir o cartão em vez de
         * deixar a pessoa clicar "Assinar" outra vez sobre o mesmo estado.
         */
        setErro(corpo.erro ?? "Não foi possível concluir a assinatura.");
        setEnviando(false);
        return;
      }

      aoConcluir();
    } catch (e) {
      setErro(traduzirErro(e));
      setEnviando(false);
    }
  }

  if (!mercadoPagoConfigurado()) {
    return (
      <Modal aberto titulo="Assinar" aoFechar={aoFechar} largura="30rem">
        <Aviso>
          O pagamento não está configurado neste ambiente. Fale com o suporte
          para concluir a assinatura.
        </Aviso>
      </Modal>
    );
  }

  return (
    <Modal
      aberto
      titulo={`Assinar ${plano.nome}`}
      aoFechar={aoFechar}
      largura="30rem"
      impedirFechar={enviando}
    >
      <form onSubmit={enviar} className="flex flex-col gap-5">
        {/*
          O valor fica no topo e muda junto com as parcelas. Quem chega aqui
          já escolheu o plano; o que ainda está em aberto é quanto vai sair
          hoje — e essa é a informação que precisa estar sob os olhos na hora
          de digitar o cartão.
        */}
        <div className="border-borda-suave bg-superficie-2 flex flex-col gap-1 rounded-xl border p-4">
          <span className="font-display text-2xl font-semibold tracking-tight">
            {cobranca.parcelas > 1
              ? `${cobranca.parcelas}x de ${formatarPreco(cobranca.valorParcela)}`
              : formatarPreco(cobranca.total)}
          </span>
          <span className="text-texto-3 text-xs">
            {cobranca.parcelas > 1
              ? `Total de ${formatarPreco(cobranca.total)} · cobrança única no cartão`
              : cobranca.desconto > 0
                ? `À vista, com ${formatarPreco(cobranca.desconto)} de desconto · renova automaticamente`
                : "Renova automaticamente · cancele quando quiser"}
          </span>
        </div>

        {opcoes.length > 1 && (
          <div className="flex flex-col gap-1.5">
            <label
              htmlFor={`parcelas-${base}`}
              className="text-texto-2 text-sm font-medium"
            >
              Parcelas
            </label>
            <select
              id={`parcelas-${base}`}
              value={cobranca.parcelas}
              onChange={(e) =>
                setCobranca(
                  opcoes.find((o) => o.parcelas === Number(e.target.value)) ??
                    opcoes[0],
                )
              }
              className="bg-superficie border-borda text-texto focus:border-acento focus:ring-acento/25 rounded-lg border px-3.5 py-2.5 text-sm outline-none focus:ring-2"
            >
              {opcoes.map((o) => (
                <option key={o.parcelas} value={o.parcelas}>
                  {o.parcelas === 1
                    ? `À vista — ${formatarPreco(o.total)}${
                        o.desconto > 0 ? " (10% off)" : ""
                      }`
                    : `${o.parcelas}x de ${formatarPreco(o.valorParcela)} — ${formatarPreco(o.total)}`}
                </option>
              ))}
            </select>
          </div>
        )}

        {/*
          Os três iframes do Mercado Pago. As caixas abaixo são só a moldura
          visual: a altura é fixa porque o conteúdo vive em outro documento e
          não estica o nosso.
        */}
        <div className="flex flex-col gap-1.5">
          <span className="text-texto-2 text-sm font-medium">
            Número do cartão
          </span>
          <div
            id={ids.numero}
            className="bg-superficie border-borda focus-within:border-acento h-11 rounded-lg border px-3.5 transition-[border-color]"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="flex flex-col gap-1.5">
            <span className="text-texto-2 text-sm font-medium">Validade</span>
            <div
              id={ids.validade}
              className="bg-superficie border-borda focus-within:border-acento h-11 rounded-lg border px-3.5 transition-[border-color]"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <span className="text-texto-2 text-sm font-medium">
              Código de segurança
            </span>
            <div
              id={ids.cvv}
              className="bg-superficie border-borda focus-within:border-acento h-11 rounded-lg border px-3.5 transition-[border-color]"
            />
          </div>
        </div>

        <Campo
          id={`titular-${base}`}
          rotulo="Nome no cartão"
          value={titular}
          onChange={(e) => setTitular(e.target.value)}
          placeholder="Como está impresso"
          autoComplete="cc-name"
          required
        />

        {precisaCpf && (
          <Campo
            id={`cpf-${base}`}
            rotulo="CPF do titular"
            value={cpf}
            onChange={(e) => setCpf(formatarCpf(e.target.value))}
            placeholder="000.000.000-00"
            inputMode="numeric"
            dica="Exigido pelo Mercado Pago para pagamentos parcelados."
            required
          />
        )}

        {erro && <Aviso>{erro}</Aviso>}

        <button
          type="submit"
          disabled={enviando || !pronto}
          className="bg-acento text-white hover:bg-acento-hover flex min-h-12 items-center justify-center rounded-full px-6 text-sm font-bold transition-colors disabled:opacity-60"
        >
          {enviando
            ? "Processando…"
            : pronto
              ? `Pagar ${formatarPreco(cobranca.total)}`
              : "Carregando…"}
        </button>

        <p className="text-texto-3 text-center text-xs leading-relaxed">
          Os dados do cartão são digitados direto no Mercado Pago e não passam
          pelos servidores da Digital Educa.
        </p>
      </form>
    </Modal>
  );
}
