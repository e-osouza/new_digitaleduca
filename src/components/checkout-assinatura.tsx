"use client";

import Image from "next/image";
import { useEffect, useId, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Modal } from "@/components/modal";
import { Aviso, Campo } from "@/components/campo";
import { formatarPreco } from "@/lib/format";
import {
  cpfValido,
  formatarCpf,
  opcoesDeCobranca,
  type Cobranca,
} from "@/lib/assinatura";
import {
  gerarTokenDoCartao,
  iniciarMercadoPago,
  mercadoPagoConfigurado,
  montarCampos,
  observarBandeira,
  observarValidade,
  traduzirErro,
  type Bandeira,
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

  const [titular, setTitular] = useState("");
  const [cpf, setCpf] = useState("");
  const [erro, setErro] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [pronto, setPronto] = useState(false);
  /* Bandeira reconhecida enquanto a pessoa digita. Null = ainda indefinida. */
  const [bandeira, setBandeira] = useState<Bandeira | null>(null);
  /* Veredito do próprio Mercado Pago sobre cada campo do cartão. */
  const [valido, setValido] = useState({
    numero: false,
    validade: false,
    cvv: false,
  });

  /* Cupom aceito pela API. Null = nenhum aplicado. */
  const [cupom, setCupom] = useState<{
    codigo: string;
    percentual: number;
  } | null>(null);
  const [codigoDigitado, setCodigoDigitado] = useState("");
  const [conferindoCupom, setConferindoCupom] = useState(false);
  const [erroCupom, setErroCupom] = useState("");

  /*
   * As opções recalculam quando o cupom entra ou sai — e a escolha de parcelas
   * é preservada pelo número, não pelo objeto: `opcoes` é uma lista nova a
   * cada render com cupom diferente, e guardar o objeto deixaria a seleção
   * apontando para uma opção com o preço velho.
   */
  const opcoes = opcoesDeCobranca(plano, cupom?.percentual ?? 0);
  const [parcelasEscolhidas, setParcelasEscolhidas] = useState(1);
  const cobranca: Cobranca =
    opcoes.find((o) => o.parcelas === parcelasEscolhidas) ?? opcoes[0];

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
        observarBandeira(instancia, campos.current, (b) => {
          if (vivo) setBandeira(b);
        });
        observarValidade(campos.current, (v) => {
          if (vivo) setValido(v);
        });
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

  /*
   * CPF em qualquer forma de pagamento, e não só no parcelado.
   *
   * O backend só o EXIGE no avulso, mas repassa `payerDoc` ao Mercado Pago nos
   * dois caminhos — e no Brasil o MP costuma recusar cobrança de cartão sem a
   * identificação do pagador. Pedir sempre troca um campo a mais por uma
   * recusa a menos, e é o que todo checkout brasileiro já faz.
   */
  const precisaCpf = true;

  /*
   * Os três campos do cartão aprovados pelo Mercado Pago. É o que libera o
   * botão: o campo do número aceita até 20 dígitos enquanto não reconhece a
   * bandeira, e sem esta trava daria para apertar "Pagar" com um número que
   * nunca viraria token.
   */
  const cartaoCompleto = valido.numero && valido.validade && valido.cvv;

  async function conferirCupom() {
    const codigo = codigoDigitado.trim().toUpperCase();
    if (!codigo) return;

    setConferindoCupom(true);
    setErroCupom("");
    try {
      const resposta = await fetch("/api/cupom/validar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ codigo, planoId: plano.id }),
      });
      const corpo = (await resposta.json().catch(() => ({}))) as {
        valido?: boolean;
        motivo?: string;
        percentual?: number;
        codigo?: string;
        erro?: string;
      };

      if (!resposta.ok) {
        setErroCupom(corpo.erro ?? "Não foi possível conferir o cupom.");
        return;
      }
      /*
       * Cupom recusado volta 200 com `valido: false` — o motivo vem do
       * backend e diz a coisa certa ("expirado", "não vale para este plano").
       */
      if (!corpo.valido) {
        setCupom(null);
        setErroCupom(corpo.motivo ?? "Cupom inválido.");
        return;
      }

      setCupom({
        codigo: corpo.codigo ?? codigo,
        percentual: Number(corpo.percentual ?? 0),
      });
    } catch {
      setErroCupom("Falha de conexão ao conferir o cupom.");
    } finally {
      setConferindoCupom(false);
    }
  }

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
    if (!cartaoCompleto) {
      setErro("Confira os dados do cartão.");
      return;
    }

    setEnviando(true);
    try {
      /*
       * Primeiro o token, depois a assinatura. Se a tokenização falhar, nada
       * chega ao nosso servidor — e o cartão não foi cobrado.
       */
      const cartao = await gerarTokenDoCartao(mp.current, {
        titular,
        cpf,
      });

      const resposta = await fetch("/api/assinatura", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          planoId: plano.id,
          installments: cobranca.parcelas,
          payerDoc: cpf,
          /*
           * O cupom só é CONSUMIDO aqui. A validação anterior serviu para
           * mostrar o preço; é este campo que faz a API aplicar o desconto e
           * registrar o uso.
           */
          ...(cupom ? { cupomCodigo: cupom.codigo } : {}),
          /*
           * Vai o token E os metadados. A API grava bandeira, quatro últimos
           * dígitos e validade na assinatura — é o que o painel mostra depois
           * e o que identifica o cartão numa cobrança contestada.
           */
          ...cartao,
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
          {cupom && (
            <span className="text-sucesso flex items-center gap-1.5 text-xs font-semibold">
              Cupom {cupom.codigo} · {cupom.percentual}% de desconto
              <span className="text-texto-3 font-normal line-through">
                {formatarPreco(
                  opcoesDeCobranca(plano).find(
                    (o) => o.parcelas === cobranca.parcelas,
                  )?.total ?? plano.preco,
                )}
              </span>
            </span>
          )}
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
              onChange={(e) => setParcelasEscolhidas(Number(e.target.value))}
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
          {/*
            A logo fica DENTRO da moldura, à direita, sobre o iframe. O campo
            é do Mercado Pago e não aceita conteúdo nosso — então a moldura é
            nossa, o iframe ocupa o espaço restante, e a bandeira mora ao lado.
          */}
          <div className="bg-superficie border-borda focus-within:border-acento flex h-11 items-center gap-2 rounded-lg border pr-3 pl-3.5 transition-[border-color]">
            <div id={ids.numero} className="min-w-0 flex-1" />
            {bandeira?.logo && (
              <Image
                src={bandeira.logo}
                alt={bandeira.nome}
                title={bandeira.nome}
                width={34}
                height={22}
                unoptimized
                className="h-[22px] w-auto shrink-0 animate-surgir"
              />
            )}
          </div>
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
            dica="O Mercado Pago exige o documento de quem está pagando."
            required
          />
        )}

        {/*
          O cupom fica por ÚLTIMO, depois do cartão.
          
          É o caminho de quem NÃO tem cupom — a maioria — que manda no
          desenho: para essas pessoas o campo é um obstáculo a mais entre a
          decisão e o pagamento, e um campo vazio no meio do formulário
          convida a procurar um código que não existe. Quem tem o código
          desce até ele, aplica, e vê o resumo lá em cima mudar antes de
          apertar o botão.
        */}
        <div className="flex flex-col gap-1.5">
          <label
            htmlFor={`cupom-${base}`}
            className="text-texto-2 text-sm font-medium"
          >
            Cupom de desconto{" "}
            <span className="text-texto-3 font-normal">(opcional)</span>
          </label>

          <div className="flex gap-2">
            <input
              id={`cupom-${base}`}
              value={codigoDigitado}
              onChange={(e) => {
                setCodigoDigitado(e.target.value.toUpperCase());
                setErroCupom("");
                // Mexeu no código: o desconto que estava aplicado não vale mais.
                if (cupom) setCupom(null);
              }}
              onKeyDown={(e) => {
                /*
                 * Enter aqui confere o cupom em vez de enviar o formulário —
                 * senão a pessoa digitaria o código, apertaria Enter por
                 * reflexo e tentaria pagar sem o desconto.
                 */
                if (e.key === "Enter") {
                  e.preventDefault();
                  void conferirCupom();
                }
              }}
              placeholder="SEUCUPOM"
              autoComplete="off"
              spellCheck={false}
              disabled={enviando}
              className="bg-superficie border-borda text-texto placeholder:text-texto-3 focus:border-acento focus:ring-acento/25 min-w-0 flex-1 rounded-lg border px-3.5 py-2.5 text-sm uppercase transition-[border-color,box-shadow] outline-none focus:ring-2"
            />
            <button
              type="button"
              onClick={() => void conferirCupom()}
              disabled={
                conferindoCupom || enviando || codigoDigitado.trim().length === 0
              }
              className="border-borda text-texto hover:border-acento/60 hover:bg-superficie-2 shrink-0 rounded-lg border px-4 text-sm font-semibold transition-colors disabled:opacity-50"
            >
              {conferindoCupom ? "Conferindo…" : cupom ? "Aplicado" : "Aplicar"}
            </button>
          </div>

          {erroCupom && <p className="text-alerta text-xs">{erroCupom}</p>}
        </div>

        {erro && <Aviso>{erro}</Aviso>}

        <button
          type="submit"
          disabled={enviando || !pronto || !cartaoCompleto}
          className="bg-acento text-white hover:bg-acento-hover flex min-h-12 items-center justify-center rounded-full px-6 text-sm font-bold transition-colors disabled:opacity-60"
        >
          {enviando
            ? "Processando…"
            : !pronto
              ? "Carregando…"
              : cartaoCompleto
                ? `Pagar ${formatarPreco(cobranca.total)}`
                : "Preencha os dados do cartão"}
        </button>

        {/*
          Selo de segurança. Fica DEPOIS do botão de propósito: antes dele, o
          que a pessoa precisa ler é o valor. O cadeado só existe para quem
          hesitou na hora de apertar — e é aí que a frase responde a dúvida.
        */}
        <div className="border-borda-suave flex items-start gap-2.5 border-t pt-4">
          <svg
            viewBox="0 0 20 20"
            aria-hidden="true"
            className="text-sucesso mt-0.5 h-4 w-4 shrink-0"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.7"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <rect x="4" y="8.5" width="12" height="8" rx="2" />
            <path d="M6.75 8.5V6a3.25 3.25 0 0 1 6.5 0v2.5" />
          </svg>
          <p className="text-texto-3 text-xs leading-relaxed">
            <span className="text-texto-2 font-semibold">Ambiente seguro.</span>{" "}
            A conexão é criptografada e os dados do cartão são digitados direto
            no Mercado Pago — não passam pelos servidores da Digital Educa nem
            ficam guardados aqui.
          </p>
        </div>
      </form>
    </Modal>
  );
}
