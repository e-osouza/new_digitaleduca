"use client";

import Image from "next/image";
import { useCallback, useEffect, useRef, useState } from "react";
import { Player } from "@/components/player";
import { OndaAudio } from "@/components/podcast/onda";
import { formatarData, formatarRelogio } from "@/lib/format";
import Link from "next/link";
import { PARAM_EPISODIO, rotaDoEpisodio } from "@/lib/podcast";
import {
  LIMIAR_CONCLUSAO,
  useReprodutorPodcast,
  type Episodio,
  type ModoPodcast,
} from "@/components/podcast/provedor";

const VELOCIDADES = [1, 1.25, 1.5, 2];

/**
 * Relógio que admite não saber.
 *
 * A duração vem da listagem, e alguns episódios chegam da API com ela em zero
 * — o vídeo foi cadastrado sem o campo preenchido. `formatarRelogio(0)` diz
 * "00:00", que é uma afirmação FALSA: o episódio não tem zero minuto, nós é
 * que não sabemos quantos ele tem. Enquanto ninguém der o play (é o elemento
 * de mídia que revela a duração real), o traço é a resposta honesta.
 */
function relogioConhecido(segundos: number) {
  return segundos > 0 ? formatarRelogio(segundos) : "--:--";
}


/**
 * Tela do podcast: player à esquerda, playlist à direita.
 *
 * A página NÃO possui o áudio — quem toca é o provedor, no layout. Aqui só há
 * comando e leitura de estado, e é isso que permite sair da tela sem cortar o
 * episódio: o rodapé assume com o mesmo elemento.
 */
export function PaginaPodcast({
  episodios,
  descricao,
  episodioInicial = null,
}: {
  episodios: Episodio[];
  descricao: string;
  /**
   * Episódio que chega pela URL e deve abrir TOCANDO — é o que acontece ao
   * clicar num card de podcast em qualquer outro ponto da plataforma.
   */
  episodioInicial?: number | null;
}) {
  const r = useReprodutorPodcast();

  /*
   * As duas funções saem do contexto por desestruturação, e não como `r.algo`
   * dentro do efeito: `r` é recriado a cada `timeupdate` (o tempo é estado),
   * então usá-lo como dependência faria os efeitos abaixo rodarem umas quatro
   * vezes por segundo. Estas duas são estáveis.
   */
  const { registrarPagina, cederPara, retomarEm, definirModo, abrir, preparar } = r;

  /* Enquanto esta tela existe, o mini player do rodapé se cala. */
  useEffect(() => {
    registrarPagina(true);
    return () => registrarPagina(false);
  }, [registrarPagina]);

  /*
   * Chegada por um card de podcast: abre tocando o episódio pedido.
   *
   * O `?episodio=` sai da URL logo em seguida, por `replaceState` — assim um
   * F5 mais tarde não arrasta a pessoa de volta para esse episódio depois de
   * ela ter escolhido outro na playlist. Trocar por `router.replace` daria uma
   * navegação e remontaria a tela no meio da reprodução.
   *
   * A guarda de uma vez só é necessária: o efeito depende de `abrir`, que muda
   * quando o episódio no ar muda — sem ela, escolher outro episódio na
   * playlist devolveria o comando ao da URL.
   */
  const jaAbriuDaUrl = useRef(false);

  useEffect(() => {
    if (jaAbriuDaUrl.current || episodioInicial === null) return;

    const pedido = episodios.find((e) => e.conteudoId === episodioInicial);
    if (!pedido) return;

    jaAbriuDaUrl.current = true;
    abrir(pedido, episodios);

    const url = new URL(window.location.href);
    url.searchParams.delete(PARAM_EPISODIO);
    window.history.replaceState(null, "", url.pathname + url.search);
  }, [abrir, episodioInicial, episodios]);

  // Sem nada tocando, a tela já mostra o primeiro episódio pronto para o play.
  const emFoco = r.episodio ?? episodios[0] ?? null;

  /*
   * A linha de pessoas sob o título prioriza os convidados: num podcast é o
   * convidado que puxa o clique, e o apresentador é o mesmo em quase toda a
   * série. Episódio sem convidado cadastrado mostra quem apresenta; sem
   * nenhum vínculo, sai vazia e o título assume.
   */
  const pessoasEmFoco = (
    emFoco?.convidados.length ? emFoco.convidados : (emFoco?.apresentadores ?? [])
  ).join(", ");

  /*
   * Adianta a mídia do episódio em foco.
   *
   * As duas idas à rede que separam o clique do som — identificar o episódio e
   * assinar a URL no Vimeo — custavam 1,6s medidos, e aconteciam DEPOIS do
   * clique. Disparadas aqui, correm enquanto a pessoa lê a ficha.
   *
   * Só quando não há nada tocando: com o áudio no ar, a banda é do episódio
   * atual, e disputá-la para adiantar o seguinte atrapalharia quem está
   * ouvindo agora.
   */
  useEffect(() => {
    if (!emFoco || r.episodio) return;
    preparar(emFoco);
  }, [emFoco, r.episodio, preparar]);

  /*
   * Posição do <Player> de vídeo, gravada em ref porque chega a cada
   * `timeupdate` — em estado, seriam quatro renders por segundo da tela toda.
   * É ela que devolve o ponto ao áudio na volta.
   */
  const tempoDoVideo = useRef(0);
  /*
   * Instante do último avanço do vídeo. `timeupdate` só dispara enquanto ele
   * TOCA, então "houve avanço há menos de um segundo" é o mesmo que "estava
   * tocando" — e é como sabemos se devemos ou não continuar em áudio ao sair
   * da tela. Antes um sinalizador ligava na primeira reprodução e nunca mais
   * desligava: pausar o vídeo e sair começava a tocar o áudio sozinho.
   */
  const avancoEm = useRef(0);

  /*
   * Troca de modo com continuidade.
   *
   * A parte que importa é o `cederPara`/`retomarEm`: quem reproduz muda de
   * dono, mas o episódio segue do mesmo segundo — trocar de modo não é
   * recomeçar. O `apagando` é só o acabamento: sem ele a substituição de uma
   * capa quadrada por um quadro 16/9 é um corte seco.
   */
  const [apagando, setApagando] = useState(false);

  /*
   * Ponto de retomada do vídeo, amarrado ao episódio que o gerou.
   *
   * Guardar só o número deixava a posição do episódio anterior vazar para o
   * seguinte quando se troca de faixa em modo vídeo — o novo começaria no
   * minuto em que o antigo parou. Comparar o `conteudoId` no render também
   * dispensa um efeito de limpeza, que chegaria tarde demais: o <Player> já
   * teria montado com o valor errado.
   */
  const [retomada, setRetomada] = useState<{
    conteudoId: number;
    segundos: number;
  } | null>(null);

  const trocarModo = useCallback(
    (destino: ModoPodcast) => {
      if (destino === r.modo) return;

      const indoParaVideo = destino === "video";
      const posicao = indoParaVideo ? cederPara() : tempoDoVideo.current;
      const tocava = indoParaVideo ? r.tocando : Date.now() - avancoEm.current < 1000;
      /*
       * Só existe posição a passar adiante se o áudio estiver COM o episódio.
       *
       * Sem esta pergunta, trocar para vídeo antes de dar o play gravava uma
       * retomada em zero — `cederPara` devolve a posição de um elemento que
       * nunca tocou — e essa retomada, por ser do mesmo episódio, ganhava do
       * ponto salvo no servidor: o vídeo começava do zero mesmo para quem
       * tinha parado no minuto vinte. O áudio nunca sofreu disso porque ele
       * lê a posição do próprio `midia.segundos`.
       */
      const comOEpisodio = r.episodio?.conteudoId === emFoco?.conteudoId;

      setApagando(true);

      window.setTimeout(() => {
        definirModo(destino);
        if (indoParaVideo) {
          tempoDoVideo.current = comOEpisodio ? posicao : 0;
          setRetomada(
            emFoco && comOEpisodio
              ? { conteudoId: emFoco.conteudoId, segundos: posicao }
              : null,
          );
        } else {
          retomarEm(posicao, tocava);
        }
        setApagando(false);
      }, 180);
    },
    [cederPara, definirModo, emFoco, r.episodio, r.modo, r.tocando, retomarEm],
  );

  const marcarTempoDoVideo = useCallback((segundos: number) => {
    tempoDoVideo.current = segundos;
    avancoEm.current = Date.now();
  }, []);


  /*
   * Sair da tela devolve o episódio ao áudio — SEMPRE, e não só quando o vídeo
   * chegou a andar. Em modo vídeo o elemento do provedor fica sem fonte
   * nenhuma, de propósito; sem esta volta, o mini player apareceria no rodapé
   * sem ter o que tocar. Em modo áudio o provedor ignora a chamada — ver
   * `retomarEm`, onde está o porquê.
   */
  useEffect(() => {
    return () => {
      retomarEm(tempoDoVideo.current, Date.now() - avancoEm.current < 1000);
    };
  }, [retomarEm]);

  const noAr = r.episodio?.conteudoId === emFoco?.conteudoId;

  if (!emFoco) return null;

  const duracao = noAr && r.duracao > 0 ? r.duracao : emFoco.duracao;
  const tempo = noAr ? r.tempo : 0;
  const preenchido = duracao > 0 ? Math.min((tempo / duracao) * 100, 100) : 0;
  const modoVideo = r.modo === "video";
  const ouvidoEmFoco = r.concluidos.has(emFoco.conteudoId) || emFoco.concluido;
  /*
   * Quando oferecer "ouvir de novo".
   *
   * A pergunta certa não é se o episódio está carregado — é ONDE ele está.
   * Chegar por um card já o deixa no ar, parado na posição salva, que num
   * episódio terminado é o fim: ali "continuar" não significa nada.
   *
   * Então: já ouvido, parado, e a agulha ou no começo (nunca recomeçou) ou
   * além do mesmo limiar que marca o episódio como concluído — reaproveitado
   * de propósito, para o botão não discordar do visto da playlist. Se a pessoa
   * pausou no meio de uma segunda escuta, isto é falso e o botão volta a ser
   * continuar: reiniciar ali jogaria fora o que ela acabou de ouvir.
   */
  const naPonta =
    r.tempo <= 1 || (duracao > 0 && r.tempo / duracao >= LIMIAR_CONCLUSAO);
  const reouvir = ouvidoEmFoco && !r.tocando && naPonta;
  const progressoEmFoco = noAr ? preenchido : emFoco.percentual;

  return (
    <div className="calha grid w-full gap-5 py-6 lg:grid-cols-[minmax(0,1.55fr)_minmax(0,1fr)] lg:py-8">
      {/* ---------- coluna do player ---------- */}
      <div className="flex min-w-0 flex-col gap-5">
        <section className="border-borda-suave bg-superficie flex flex-col gap-6 rounded-2xl border p-5 sm:p-7">
          {/*
            Em vídeo o quadro ocupa a largura inteira do cartão e o texto desce
            para baixo dele; em áudio, a capa quadrada fica ao lado do texto.
            A opacidade cobre a troca — ver `trocarModo`.
          */}
          <div
            className={`ease-suave transition-opacity duration-200 ${
              apagando ? "opacity-0" : "opacity-100"
            } ${
              modoVideo
                ? "flex flex-col gap-5"
                : "flex flex-col gap-6 sm:flex-row sm:gap-7"
            }`}
          >
            <div
              className={
                modoVideo
                  ? "flex flex-col gap-3"
                  : "flex shrink-0 flex-col gap-3"
              }
            >
              {modoVideo && r.midia ? (
                /*
                 * O player da plataforma, o mesmo das aulas: controles
                 * próprios, qualidade, legendas, PiP e — o que motivou a
                 * troca — a tela cheia com a barra da casa, em vez dos
                 * controles nativos do navegador.
                 */
                <Player
                  key={r.midia.videoId}
                  vimeoId={r.midia.vimeoId}
                  videoId={r.midia.videoId}
                  segundosIniciais={
                    retomada?.conteudoId === emFoco.conteudoId
                      ? retomada.segundos
                      : r.midia.segundos
                  }
                  titulo={`${emFoco.convidado}${emFoco.tema ? ` — ${emFoco.tema}` : ""}`}
                  aoProgredir={marcarTempoDoVideo}
                  aoFinalizar={r.proximo}
                />
              ) : (
                <div
                  className={`bg-superficie-2 relative w-full overflow-hidden rounded-xl ${
                    modoVideo
                      ? "aspect-video"
                      : "aspect-square sm:w-[248px] lg:w-[300px]"
                  }`}
                >
                  {emFoco.capa && (
                    <Image
                      src={emFoco.capa}
                      alt=""
                      fill
                      sizes={modoVideo ? "(max-width: 1024px) 100vw, 640px" : "300px"}
                      className="object-cover"
                      priority
                    />
                  )}

                  {/*
                    Em vídeo, o quadro É o único comando disponível.

                    O <Player> só monta depois que o episódio abre, porque é a
                    abertura que descobre o id no Vimeo. Até lá o modo vídeo
                    mostrava a capa e mais nada: a fileira de transporte fica
                    escondida (quem comanda o vídeo é o próprio Player), então
                    quem trocasse de modo antes de dar o play ficava sem
                    NENHUMA forma de começar — capa parada e nenhum botão.

                    O play sobre o quadro é a saída, e é também o gesto que a
                    pessoa já espera de uma miniatura de vídeo. Ele abre o
                    episódio exatamente como o botão grande do modo áudio,
                    inclusive na regra de recomeçar o que já foi ouvido.
                  */}
                  {modoVideo && (
                    <button
                      type="button"
                      onClick={() =>
                        r.abrir(emFoco, episodios, { doComeco: reouvir })
                      }
                      disabled={r.carregando}
                      aria-label={reouvir ? "Ver de novo" : "Assistir"}
                      className="group absolute inset-0 flex items-center justify-center bg-black/35 transition-colors hover:bg-black/45 disabled:cursor-default"
                    >
                      <span className="from-acento to-acento-claro ease-suave flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br text-white shadow-lg ring-8 ring-white/10 transition-transform group-hover:scale-105 group-active:scale-95">
                        {r.carregando ? (
                          <IconeCarregando />
                        ) : reouvir ? (
                          <IconeRepetir />
                        ) : (
                          <IconePlay />
                        )}
                      </span>
                    </button>
                  )}

                  {/*
                    O selo de ouvido sobre a capa, como na playlist. É a mesma
                    informação que a ficha dá lá embaixo em "Você ouviu", mas
                    aqui ela chega antes de qualquer leitura — e é o que
                    explica o botão de ouvir de novo, logo abaixo.
                  */}
                  {ouvidoEmFoco && !modoVideo && (
                    <span className="bg-cromo/90 text-sucesso absolute top-3 left-3 flex items-center gap-1.5 rounded-full py-1.5 pr-3 pl-2 text-xs font-bold shadow-sm backdrop-blur-sm">
                      <IconeVistoCheio />
                      Ouvido
                    </span>
                  )}
                </div>
              )}
            </div>

            <div className="flex min-w-0 flex-1 flex-col gap-3">
              {/*
                O alternador abre a coluna do texto, no lugar onde antes ficava
                o aviso de "Reproduzindo agora".

                O aviso saiu porque era redundante: a onda animando, o botão em
                pausa e a régua andando já dizem que há som no ar, cada um
                melhor do que uma frase. O alternador, ao contrário, é uma
                escolha — e escolha se oferece antes de a pessoa começar a
                ouvir, não escondida embaixo da capa.
              */}
              <AlternadorModo modo={r.modo} aoTrocar={trocarModo} />

              <h1 className="font-display text-xl leading-tight font-semibold tracking-tight text-balance sm:text-2xl">
                {emFoco.tema ?? emFoco.convidado}
              </h1>

              {/*
                Quem está na conversa, direto do cadastro. Antes esta linha
                repetia o pedaço do título antes do travessão — o que dava o
                nome certo na maioria dos episódios e o do apresentador nos
                que têm convidado. O título continua valendo como recurso
                final, para o episódio cadastrado sem nenhum vínculo.
              */}
              {pessoasEmFoco ? (
                <p className="text-texto-2 font-medium">{pessoasEmFoco}</p>
              ) : (
                emFoco.tema && (
                  <p className="text-texto-2 font-medium">{emFoco.convidado}</p>
                )
              )}

              <div className="text-texto-3 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm tabular-nums">
                {duracao > 0 && (
                  <span className="flex items-center gap-1.5">
                    <IconeRelogio />
                    {formatarRelogio(duracao)}
                  </span>
                )}
                {emFoco.publicadoEm && (
                  <span className="flex items-center gap-1.5">
                    <IconeCalendario />
                    Publicado em {formatarData(emFoco.publicadoEm)}
                  </span>
                )}
              </div>

              {/*
                Falta de assinatura não é erro técnico: tem desfecho. Aula e
                palestra já caíam numa tela de conversão; um episódio bloqueado
                mostrava só o aviso e parava ali. O retorno viaja na URL para a
                pessoa voltar ao podcast, e não à ficha do conteúdo.
              */}
              {r.erro && noAr && (
                <div className="border-alerta/40 bg-alerta/10 flex flex-col items-start gap-3 rounded-xl border p-4">
                  <p className="text-texto text-sm font-medium">{r.erro}</p>
                  {r.bloqueado && (
                    <Link
                      href={`/planos?conteudo=${emFoco.conteudoId}&voltar=${encodeURIComponent(
                        rotaDoEpisodio(emFoco.conteudoId),
                      )}`}
                      className="bg-acento text-white hover:bg-acento-hover flex min-h-10 items-center rounded-full px-5 text-sm font-bold transition-colors"
                    >
                      Ver planos
                    </Link>
                  )}
                </div>
              )}
            </div>
          </div>

          {/*
            Transporte próprio SÓ em áudio. Em vídeo quem comanda é o <Player>,
            que traz a barra completa — duas réguas sobre o mesmo episódio
            brigariam entre si, e a de baixo mostraria um tempo que não é o
            dele.
          */}
          {!modoVideo && (
          <div className="border-borda-suave flex flex-col gap-4 border-t pt-5 sm:gap-5">
            {/*
              A onda vem antes da régua e diz a mesma coisa em outra escala: a
              régua é precisão, a onda é a sensação de que há som acontecendo.
              Clicar nela também busca — é o alvo grande, para o mouse; a régua
              continua sendo o comando de teclado e de leitor de tela.
            */}
            <OndaAudio
              semente={emFoco.conteudoId}
              progresso={progressoEmFoco}
              tocando={r.tocando}
              aoBuscar={
                noAr && duracao > 0
                  ? (fracao) => r.irPara(fracao * duracao)
                  : undefined
              }
            />

            <div className="flex items-center gap-3">
              <span className="text-texto-3 w-10 shrink-0 text-[11px] tabular-nums sm:w-12 sm:text-xs">
                {formatarRelogio(tempo)}
              </span>
              <input
                type="range"
                min={0}
                max={Math.max(duracao, 1)}
                step={1}
                value={tempo}
                onChange={(e) => r.irPara(Number(e.target.value))}
                disabled={!noAr}
                aria-label="Posição do episódio"
                className="regua-podcast w-full min-w-0 disabled:opacity-50"
                style={{ "--preenchido": `${preenchido}%` } as React.CSSProperties}
              />
              <span className="text-texto-3 w-10 shrink-0 text-right text-[11px] tabular-nums sm:w-12 sm:text-xs">
                {relogioConhecido(duracao)}
              </span>
            </div>

            {/*
              Os rótulos somem no celular: "Velocidade" sozinho mede mais que
              o botão que ele descreve, e cinco comandos com legenda não cabem
              numa faixa de 375px. Era esta fileira que empurrava a largura da
              coluna e estourava a página inteira para fora da tela.
            */}
            <div className="flex items-center justify-center gap-4 xs:gap-6 sm:gap-10">
              <Comando
                rotulo="Velocidade"
                onClick={() =>
                  r.definirVelocidade(
                    VELOCIDADES[
                      (VELOCIDADES.indexOf(r.velocidade) + 1) % VELOCIDADES.length
                    ],
                  )
                }
              >
                <span className="text-sm font-bold tabular-nums">
                  {r.velocidade}x
                </span>
              </Comando>

              <Comando rotulo="Voltar" onClick={() => r.pular(-15)} desativado={!noAr}>
                <IconePular sentido="tras" />
              </Comando>

              {/*
                Episódio já ouvido vira "ouvir de novo", e não um play comum.
                A diferença não é só o ícone: a posição salva de um episódio
                terminado está NO FIM, então o play normal retomaria no último
                segundo e acabaria na hora. Este recomeça do zero.

                Só vale enquanto ele não está no ar — depois de começar de
                novo, o botão volta a ser pausar/continuar como qualquer outro.
              */}
              <button
                type="button"
                onClick={() => {
                  if (noAr) {
                    r.alternar();
                    return;
                  }
                  r.abrir(emFoco, episodios, { doComeco: reouvir });
                }}
                disabled={r.carregando}
                aria-label={
                  r.tocando ? "Pausar" : reouvir ? "Ouvir de novo" : "Tocar"
                }
                title={reouvir ? "Ouvir de novo desde o início" : undefined}
                /*
                  A peça principal da fileira, e o tamanho diz isso: degradê
                  entre os dois tons de acento, halo do mesmo acento por fora e
                  um empurrão de escala ao apertar. Os outros quatro comandos
                  seguem discretos de propósito — só um deles é o que a pessoa
                  procura no escuro.
                */
                className="from-acento to-acento-claro ring-acento/10 hover:ring-acento/20 flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-gradient-to-br text-white shadow-lg ring-8 transition-all active:scale-95 disabled:opacity-60 sm:h-[72px] sm:w-[72px]"
              >
                {r.carregando ? (
                  <IconeCarregando />
                ) : r.tocando ? (
                  <IconePausa />
                ) : reouvir ? (
                  <IconeRepetir />
                ) : (
                  <IconePlay />
                )}
              </button>

              <Comando rotulo="Avançar" onClick={() => r.pular(15)} desativado={!noAr}>
                <IconePular sentido="frente" />
              </Comando>

              <Comando rotulo="Próximo" onClick={r.proximo} desativado={!noAr}>
                <IconeProximo />
              </Comando>
            </div>
          </div>
          )}
        </section>

        {/*
          Ficha do episódio. Ocupa o lugar do antigo "Sobre o podcast", que
          repetia a mesma frase em todos os episódios — abaixo do player o que
          se quer saber é sobre o que está tocando. A descrição do podcast
          sobrou como rodapé, que é o peso que ela merece.
        */}
        <section className="border-borda-suave bg-superficie flex flex-col gap-5 rounded-2xl border p-5 sm:p-7">
          <h2 className="font-display font-semibold">Sobre o episódio</h2>

          {emFoco.descricao ? (
            <p className="text-texto-2 w-full text-sm leading-relaxed">
              {emFoco.descricao}
            </p>
          ) : (
            <p className="text-texto-3 text-sm">
              Este episódio ainda não tem descrição.
            </p>
          )}

          {/*
            Grade, e não linha corrida: os rótulos mudam de episódio para
            episódio (nem todo um tem nível ou categoria) e uma lista de pares
            aguenta as ausências sem deixar buraco.
          */}
          <dl className="grid gap-x-8 gap-y-4 sm:grid-cols-2">
            {emFoco.apresentadores.length > 0 && (
              <Ficha
                rotulo="Apresentado por"
                valor={emFoco.apresentadores.join(", ")}
              />
            )}
            {emFoco.convidados.length > 0 && (
              <Ficha
                rotulo={
                  emFoco.convidados.length > 1 ? "Convidados" : "Convidado"
                }
                valor={emFoco.convidados.join(", ")}
              />
            )}
            {emFoco.categoria && (
              <Ficha rotulo="Categoria" valor={emFoco.categoria} />
            )}
            {/*
              Duração e data de publicação NÃO se repetem aqui: as duas já
              estão no cabeçalho do player, ao lado do relógio e do calendário,
              a um palmo de distância. Esta ficha existe para o que só ela diz —
              quem apresenta, quem participa, o assunto e o quanto você ouviu.
            */}
            <Ficha
              rotulo="Você ouviu"
              valor={
                ouvidoEmFoco
                  ? "O episódio inteiro"
                  : progressoEmFoco > 0
                    ? `${Math.round(progressoEmFoco)}% — faltam ${formatarRelogio(
                        Math.max(duracao - (progressoEmFoco / 100) * duracao, 0),
                      )}`
                    : "Ainda não começou"
              }
            />
          </dl>

          <p className="border-borda-suave text-texto-3 border-t pt-4 text-xs leading-relaxed">
            {descricao}
          </p>
        </section>
      </div>

      {/* ---------- playlist ---------- */}
      <section className="border-borda-suave bg-superficie flex h-fit min-w-0 flex-col gap-3 rounded-2xl border p-4 sm:p-5 lg:sticky lg:top-4">
        <div className="flex items-center justify-between gap-3">
          <h2 className="font-display font-semibold">Playlist</h2>
          <span className="text-texto-3 text-xs tabular-nums">
            {episodios.length}{" "}
            {episodios.length === 1 ? "episódio" : "episódios"}
          </span>
        </div>

        <ul className="-mx-1 flex max-h-[62vh] flex-col gap-1 overflow-y-auto px-1">
          {episodios.map((ep, indice) => {
            const atual = r.episodio?.conteudoId === ep.conteudoId;

            /*
             * O episódio no ar informa a si mesmo: o percentual do servidor é
             * de quando a página carregou, e ver a própria barra parada
             * enquanto se ouve seria estranho.
             */
            const andamento =
              atual && r.duracao > 0
                ? Math.min((r.tempo / r.duracao) * 100, 100)
                : ep.percentual;

            const ouvido = r.concluidos.has(ep.conteudoId) || ep.concluido;
            const restante = Math.max(
              ep.duracao - (andamento / 100) * ep.duracao,
              0,
            );

            return (
              <li key={ep.conteudoId}>
                <button
                  type="button"
                  /*
                   * Episódio já ouvido recomeça do zero também aqui — pela
                   * mesma razão do botão grande: a posição salva dele está no
                   * fim, e "continuar" seria acabar no mesmo instante.
                   */
                  onClick={() =>
                    r.abrir(ep, episodios, { doComeco: ouvido && !atual })
                  }
                  aria-current={atual ? "true" : undefined}
                  className={`flex w-full items-center gap-3 rounded-xl p-2 text-left transition-colors ${
                    atual
                      ? "bg-acento/10"
                      : "hover:bg-superficie-2 active:bg-borda-suave"
                  }`}
                >
                  <span
                    className={`w-4 shrink-0 text-center text-xs font-semibold tabular-nums ${
                      atual ? "text-acento" : "text-texto-3"
                    }`}
                  >
                    {atual ? <IconeOnda animando={r.tocando} /> : indice + 1}
                  </span>

                  <span className="bg-superficie-2 relative h-12 w-12 shrink-0 overflow-hidden rounded-lg">
                    {ep.capa && (
                      <Image
                        src={ep.capa}
                        alt=""
                        fill
                        sizes="48px"
                        className={`object-cover ${ouvido ? "opacity-45" : ""}`}
                      />
                    )}

                    {/*
                      O visto fica SOBRE a capa, e não numa coluna própria: a
                      linha já tem número, título, tema e duração, e mais uma
                      coluna espremeria o texto que importa.
                    */}
                    {ouvido && (
                      <span className="absolute inset-0 flex items-center justify-center bg-black/45">
                        <span className="bg-sucesso flex h-6 w-6 items-center justify-center rounded-full text-white">
                          <IconeVisto />
                        </span>
                      </span>
                    )}
                  </span>

                  <span className="flex min-w-0 flex-1 flex-col gap-1">
                    {/*
                      Título inteiro numa linha só, e não convidado em cima com
                      tema embaixo. `separarTitulo` parte o título da API em
                      dois para o cabeçalho do player, onde há espaço para os
                      dois pesos; aqui a lista quer uma coisa só, e mostrar
                      apenas o convidado deixaria "Tallis Gomes" sem dizer sobre
                      o quê é o episódio.
                    */}
                    <span
                      className={`line-clamp-2 text-sm leading-snug font-semibold ${
                        atual
                          ? "text-acento"
                          : ouvido
                            ? "text-texto-3"
                            : "text-texto"
                      }`}
                    >
                      {ep.tema ? `${ep.convidado} — ${ep.tema}` : ep.convidado}
                    </span>

                    {/*
                      Duração sempre, mesmo no que já foi ouvido: ela é a ficha
                      do episódio, não o estado de quem escuta — e o visto sobre
                      a capa já conta essa parte. "Faltam" só entra no que foi
                      começado e não terminado, que é quando a pergunta existe.
                    */}
                    <span className="text-texto-3 flex items-center gap-2 text-xs tabular-nums">
                      {ep.duracao > 0 && formatarRelogio(ep.duracao)}
                      {!ouvido && andamento > 0 && (
                        <span>· faltam {formatarRelogio(restante)}</span>
                      )}
                    </span>

                    {/*
                      A barra só aparece no que foi COMEÇADO e não terminado —
                      é a pergunta que ela responde ("o que falta acabar"). Numa
                      lista em que toda linha tem barra, as cheias e as vazias
                      viram ruído e a informação some.
                    */}
                    {!ouvido && andamento > 0 && (
                      <span className="bg-superficie-2 mt-1 block h-1 overflow-hidden rounded-full">
                        <span
                          className="bg-acento ease-suave block h-full rounded-full transition-[width] duration-500"
                          style={{ width: `${andamento}%` }}
                        />
                      </span>
                    )}
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      </section>
    </div>
  );
}

/* ------------------------------------------------------------------ */

/** Par rótulo/valor da ficha do episódio. */
function Ficha({ rotulo, valor }: { rotulo: string; valor: string }) {
  return (
    <div className="flex flex-col gap-0.5">
      <dt className="text-texto-3 text-[11px] font-semibold tracking-[0.08em] uppercase">
        {rotulo}
      </dt>
      <dd className="text-texto-2 text-sm">{valor}</dd>
    </div>
  );
}

/** Botão secundário do painel de controles: ícone em cima, rótulo embaixo. */
function Comando({
  rotulo,
  onClick,
  desativado = false,
  children,
}: {
  rotulo: string;
  onClick: () => void;
  desativado?: boolean;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={desativado}
      aria-label={rotulo}
      className="text-texto-2 hover:text-acento flex flex-col items-center gap-1.5 transition-colors disabled:opacity-40"
    >
      <span className="flex h-6 items-center justify-center">{children}</span>
      <span className="xs:block hidden text-[11px] font-medium">{rotulo}</span>
    </button>
  );
}

function AlternadorModo({
  modo,
  aoTrocar,
}: {
  modo: ModoPodcast;
  aoTrocar: (valor: ModoPodcast) => void;
}) {
  return (
    /*
     * `inline-flex` e largura de conteúdo, sem `flex-1` nos botões.
     *
     * Repartir o espaço funcionava enquanto o alternador vivia sob a capa de
     * 300px, mas em modo vídeo o pai passa a ser `fit-content` — e aí
     * `flex-1` (base 0) não tem espaço definido para repartir: o botão
     * encolhia e "Com vídeo" quebrava em duas linhas. Medido pelo conteúdo, o
     * controle tem o mesmo tamanho nos dois modos, que também é o certo: ele
     * não deveria mudar de forma quando a tela ao lado muda.
     */
    <div
      role="group"
      aria-label="Forma de reprodução"
      className="border-borda-suave bg-fundo-2 inline-flex w-fit gap-1 rounded-full border p-1"
    >
      {(
        [
          ["audio", "Só áudio"],
          ["video", "Com vídeo"],
        ] as const
      ).map(([valor, rotulo]) => (
        <button
          key={valor}
          type="button"
          onClick={() => aoTrocar(valor)}
          aria-pressed={modo === valor}
          className={`rounded-full px-4 py-1.5 text-xs font-semibold whitespace-nowrap transition-colors ${
            modo === valor
              ? "bg-acento text-white"
              : "text-texto-2 hover:text-texto"
          }`}
        >
          {rotulo}
        </button>
      ))}
    </div>
  );
}

/* ---------------------------- ícones ---------------------------- */

function IconePlay() {
  return (
    <svg viewBox="0 0 16 16" className="ml-1 h-6 w-6" fill="currentColor">
      <path d="M4 2.5v11l9-5.5-9-5.5Z" />
    </svg>
  );
}

function IconePausa() {
  return (
    <svg viewBox="0 0 16 16" className="h-6 w-6" fill="currentColor">
      <path d="M4.5 3h2.5v10H4.5zM9 3h2.5v10H9z" />
    </svg>
  );
}

/** Seta circular — reiniciar do começo. */
function IconeRepetir() {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
      className="h-6 w-6"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M3 12a9 9 0 1 0 2.64-6.36" />
      <path d="M3 4v5h5" />
    </svg>
  );
}

function IconeCarregando() {
  return (
    <svg viewBox="0 0 20 20" className="h-6 w-6 animate-spin" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <path d="M10 2.5a7.5 7.5 0 1 0 7.5 7.5" />
    </svg>
  );
}

function IconePular({ sentido }: { sentido: "tras" | "frente" }) {
  return (
    <svg
      viewBox="0 0 20 20"
      className={`h-6 w-6 ${sentido === "tras" ? "-scale-x-100" : ""}`}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M10 4.5a6 6 0 1 0 5.5 3.6" />
      <path d="M15.5 3v5h-5" />
    </svg>
  );
}

function IconeProximo() {
  return (
    <svg viewBox="0 0 20 20" className="h-6 w-6" fill="currentColor">
      <path d="M5 4.5v11l8-5.5-8-5.5Z" />
      <rect x="14" y="4.5" width="2" height="11" rx="1" />
    </svg>
  );
}

function IconeRelogio() {
  return (
    <svg viewBox="0 0 20 20" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="10" cy="10" r="7.5" />
      <path d="M10 5.5V10l3 1.8" />
    </svg>
  );
}

function IconeVisto() {
  return (
    <svg viewBox="0 0 20 20" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round">
      <path d="m5 10.5 3.5 3.5L15 6.5" />
    </svg>
  );
}

/** Visto dentro de um círculo cheio — o selo sobre a capa. */
function IconeVistoCheio() {
  return (
    <svg viewBox="0 0 20 20" className="h-4 w-4" fill="currentColor" aria-hidden="true">
      <path d="M10 1.5a8.5 8.5 0 1 0 0 17 8.5 8.5 0 0 0 0-17Zm4.2 6.3-5 5.2a1 1 0 0 1-1.44 0L5.8 11a1 1 0 0 1 1.44-1.4l1.24 1.3 4.28-4.5a1 1 0 1 1 1.44 1.4Z" />
    </svg>
  );
}

function IconeCalendario() {
  return (
    <svg viewBox="0 0 20 20" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="4.5" width="14" height="13" rx="2" />
      <path d="M3 8.5h14M7 3v3M13 3v3" />
    </svg>
  );
}

/** Três barrinhas que sobem e descem enquanto o episódio toca. */
function IconeOnda({ animando }: { animando: boolean }) {
  return (
    <svg viewBox="0 0 16 16" className="h-3.5 w-3.5" fill="currentColor" aria-hidden="true">
      {[
        { x: 1.5, atraso: "0ms" },
        { x: 6.5, atraso: "160ms" },
        { x: 11.5, atraso: "320ms" },
      ].map(({ x, atraso }) => (
        <rect key={x} x={x} y="3" width="3" height="10" rx="1.5">
          {animando && (
            <animate
              attributeName="height"
              values="4;10;4"
              dur="0.9s"
              begin={atraso}
              repeatCount="indefinite"
            />
          )}
          {animando && (
            <animate
              attributeName="y"
              values="6;3;6"
              dur="0.9s"
              begin={atraso}
              repeatCount="indefinite"
            />
          )}
        </rect>
      ))}
    </svg>
  );
}
