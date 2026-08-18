/**
 * Ilustrações dos estados vazios.
 *
 * São desenhos de linha construídos com os MESMOS tokens do tema — nada de
 * cor fixa, nada de arquivo em `/public`. Assim a arte acompanha o claro e o
 * escuro sozinha, e um ajuste na paleta não deixa uma ilustração para trás.
 *
 * Todas nascem num viewBox 200 × 150 e escalam pela largura do contêiner.
 */

/**
 * Sem listas: uma pilha de cartões cujo conteúdo vai se apagando linha a
 * linha até virar um espaço tracejado — o lugar vazio esperando ser
 * preenchido. O "+" repete o gesto do botão logo abaixo.
 */
export function IlustracaoListasVazias() {
  return (
    <svg viewBox="0 0 200 150" className="h-auto w-full" role="presentation">
      <defs>
        {/*
          Brilho difuso atrás da pilha, para o desenho não flutuar solto no
          fundo da página. `currentColor` resolve na classe do próprio <stop>.
        */}
        <radialGradient id="ilu-listas-brilho">
          <stop
            offset="0%"
            className="text-acento"
            stopColor="currentColor"
            stopOpacity="0.16"
          />
          <stop
            offset="100%"
            className="text-acento"
            stopColor="currentColor"
            stopOpacity="0"
          />
        </radialGradient>
      </defs>

      <circle cx="100" cy="76" r="64" fill="url(#ilu-listas-brilho)" />

      {/* Cartões da pilha, aparecendo só pela borda superior. */}
      <rect
        x="58"
        y="14"
        width="84"
        height="10"
        rx="5"
        className="fill-superficie stroke-borda-suave opacity-55"
        strokeWidth="2"
      />
      <rect
        x="45"
        y="26"
        width="110"
        height="10"
        rx="5"
        className="fill-superficie stroke-borda-suave opacity-80"
        strokeWidth="2"
      />

      {/* Cartão da frente. */}
      <rect
        x="30"
        y="38"
        width="140"
        height="96"
        rx="16"
        className="fill-superficie stroke-borda"
        strokeWidth="2"
      />

      {/* Primeira aula, ainda nítida. */}
      <g className="fill-borda-suave">
        <rect x="46" y="54" width="18" height="18" rx="5" />
        <rect x="72" y="57" width="60" height="5" rx="2.5" />
        <rect x="72" y="66" width="36" height="5" rx="2.5" />
      </g>

      {/* Segunda já desbotando: a lista se dissolve em vez de acabar seca. */}
      <g className="fill-borda-suave opacity-55">
        <rect x="46" y="80" width="18" height="18" rx="5" />
        <rect x="72" y="83" width="52" height="5" rx="2.5" />
        <rect x="72" y="92" width="28" height="5" rx="2.5" />
      </g>

      {/* A vaga em aberto. */}
      <rect
        x="46"
        y="104"
        width="88"
        height="22"
        rx="8"
        fill="none"
        strokeWidth="2"
        strokeDasharray="5 6"
        strokeLinecap="round"
        className="stroke-acento opacity-45"
      />

      {/*
        O anel na cor do FUNDO (e não branco) recorta o selo da pilha nos dois
        temas — é o que o descola do cartão sem precisar de sombra.
      */}
      <circle
        cx="160"
        cy="128"
        r="14"
        className="fill-acento stroke-fundo"
        strokeWidth="4"
      />
      <path
        d="M160 122v12M154 128h12"
        stroke="#fff"
        strokeWidth="2.6"
        strokeLinecap="round"
      />
    </svg>
  );
}

/**
 * Nada salvo: três capas lado a lado com o marcador desenhado em tracejado
 * sobre a do meio — a mesma silhueta do botão "Salvar", só que vazia. As de
 * fora ficam desbotadas para o olho cair na do centro, onde está o gesto que
 * falta.
 */
export function IlustracaoSalvosVazios() {
  return (
    <svg viewBox="0 0 200 150" className="h-auto w-full" role="presentation">
      <defs>
        <radialGradient id="ilu-salvos-brilho">
          <stop
            offset="0%"
            className="text-acento"
            stopColor="currentColor"
            stopOpacity="0.16"
          />
          <stop
            offset="100%"
            className="text-acento"
            stopColor="currentColor"
            stopOpacity="0"
          />
        </radialGradient>
      </defs>

      <circle cx="100" cy="72" r="66" fill="url(#ilu-salvos-brilho)" />

      {/* Capas laterais: menores, desbotadas, ancoradas na mesma base. */}
      <g className="opacity-50">
        <rect
          x="22"
          y="42"
          width="46"
          height="62"
          rx="9"
          className="fill-superficie stroke-borda-suave"
          strokeWidth="2"
        />
        <rect x="22" y="112" width="36" height="5" rx="2.5" className="fill-borda-suave" />
        <rect
          x="132"
          y="42"
          width="46"
          height="62"
          rx="9"
          className="fill-superficie stroke-borda-suave"
          strokeWidth="2"
        />
        <rect x="132" y="112" width="36" height="5" rx="2.5" className="fill-borda-suave" />
      </g>

      {/* Capa do meio. */}
      <rect
        x="74"
        y="28"
        width="52"
        height="76"
        rx="11"
        className="fill-superficie stroke-borda"
        strokeWidth="2"
      />
      <g className="fill-borda-suave">
        <rect x="74" y="112" width="44" height="5" rx="2.5" />
        <rect x="74" y="121" width="28" height="5" rx="2.5" />
      </g>

      {/*
        O marcador vazio. Mesma silhueta do ícone do botão "Salvar", redesenhada
        na escala do quadro — em tracejado, porque aqui ela é a ação que ainda
        não aconteceu.
      */}
      <path
        d="M90 48h20a4 4 0 0 1 4 4v32l-14-10-14 10V52a4 4 0 0 1 4-4Z"
        fill="none"
        strokeWidth="2"
        strokeDasharray="4 5"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="stroke-acento opacity-45"
      />
    </svg>
  );
}

/**
 * Nada em andamento: a arte deitada da própria página, com a barra de
 * progresso PARADA NO ZERO e o cursor estacionado na largada.
 *
 * O vazio aqui não é ausência de conteúdo — é ausência de percurso. Por isso
 * o desenho mostra um player inteiro e funcional, com só a régua vazia: é
 * exatamente o que a tela diria se pudesse falar.
 */
export function IlustracaoEmAndamentoVazio() {
  return (
    <svg viewBox="0 0 200 150" className="h-auto w-full" role="presentation">
      <defs>
        <radialGradient id="ilu-andamento-brilho">
          <stop
            offset="0%"
            className="text-acento"
            stopColor="currentColor"
            stopOpacity="0.16"
          />
          <stop
            offset="100%"
            className="text-acento"
            stopColor="currentColor"
            stopOpacity="0"
          />
        </radialGradient>
      </defs>

      <circle cx="100" cy="70" r="66" fill="url(#ilu-andamento-brilho)" />

      {/* Moldura 16/9, a mesma proporção dos cards desta página. */}
      <rect
        x="38"
        y="30"
        width="124"
        height="70"
        rx="12"
        className="fill-superficie stroke-borda"
        strokeWidth="2"
      />

      {/* Botão de play, neutro: o acento fica reservado para a régua. */}
      <circle
        cx="100"
        cy="58"
        r="16"
        className="fill-superficie stroke-borda-suave"
        strokeWidth="2"
      />
      <path d="M96 51l11 7-11 7Z" className="fill-borda-suave" />

      {/* Régua cheia, percurso nenhum. */}
      <rect x="54" y="86" width="92" height="5" rx="2.5" className="fill-borda-suave" />

      {/*
        O cursor na largada é o que diz "zero assistido". O anel na cor do
        FUNDO o recorta da régua nos dois temas, sem precisar de sombra.
      */}
      <circle
        cx="54"
        cy="88.5"
        r="6"
        className="fill-acento stroke-fundo"
        strokeWidth="3.5"
      />

      {/* Título do card, esmaecendo — como nas demais ilustrações da família. */}
      <g className="fill-borda-suave">
        <rect x="38" y="112" width="76" height="5" rx="2.5" />
        <rect x="38" y="121" width="48" height="5" rx="2.5" className="opacity-55" />
      </g>
    </svg>
  );
}

/**
 * Sem estatísticas: o painel de um gráfico com os eixos prontos e as barras
 * ainda por preencher, desenhadas em tracejado.
 *
 * A escolha é dizer "aqui é onde seus números vão aparecer" em vez de
 * "não há dados" — o mesmo motivo pelo qual as barras têm alturas diferentes:
 * uma fileira de tocos iguais leria como gráfico quebrado, não como espera.
 */
export function IlustracaoSemEstatisticas() {
  return (
    <svg viewBox="0 0 200 150" className="h-auto w-full" role="presentation">
      <defs>
        <radialGradient id="ilu-estatisticas-brilho">
          <stop
            offset="0%"
            className="text-acento"
            stopColor="currentColor"
            stopOpacity="0.16"
          />
          <stop
            offset="100%"
            className="text-acento"
            stopColor="currentColor"
            stopOpacity="0"
          />
        </radialGradient>
      </defs>

      <circle cx="100" cy="72" r="66" fill="url(#ilu-estatisticas-brilho)" />

      <rect
        x="30"
        y="32"
        width="140"
        height="88"
        rx="14"
        className="fill-superficie stroke-borda"
        strokeWidth="2"
      />

      {/* Eixos: a estrutura existe, é o conteúdo que falta. */}
      <path
        d="M46 50V102H154"
        fill="none"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="stroke-borda-suave"
      />

      {/*
        Barras por preencher. São traçados de topo arredondado e base aberta,
        e não retângulos: um retângulo tracejado lê como caixa, enquanto isto
        lê como barra assentada na linha do eixo.
      */}
      <g
        fill="none"
        strokeWidth="2"
        strokeDasharray="4 5"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="stroke-acento opacity-45"
      >
        <path d="M54 102V82a4 4 0 0 1 4-4h6a4 4 0 0 1 4 4v20" />
        <path d="M80 102V68a4 4 0 0 1 4-4h6a4 4 0 0 1 4 4v34" />
        <path d="M106 102V76a4 4 0 0 1 4-4h6a4 4 0 0 1 4 4v26" />
        <path d="M132 102V60a4 4 0 0 1 4-4h6a4 4 0 0 1 4 4v42" />
      </g>

    </svg>
  );
}

/**
 * Sem trilhas: a rota serpenteando entre estações vazias, tracejada.
 *
 * É o mesmo desenho do ícone de Trilhas no menu, ampliado — a serpentina com
 * um nó em cada ponta. Diferente das outras telas, aqui o vazio não é do
 * usuário: as formações são curadoria da equipe. Por isso nenhuma estação
 * está "cumprida" e não há gesto a convidar; o traçado é só o percurso que
 * ainda não foi publicado.
 */
export function IlustracaoSemTrilhas() {
  return (
    <svg viewBox="0 0 200 150" className="h-auto w-full" role="presentation">
      <defs>
        <radialGradient id="ilu-trilhas-brilho">
          <stop
            offset="0%"
            className="text-acento"
            stopColor="currentColor"
            stopOpacity="0.16"
          />
          <stop
            offset="100%"
            className="text-acento"
            stopColor="currentColor"
            stopOpacity="0"
          />
        </radialGradient>
      </defs>

      <circle cx="100" cy="74" r="66" fill="url(#ilu-trilhas-brilho)" />

      {/* A rota. Começa e termina rente à borda dos nós, sem folga. */}
      <path
        d="M46 38H114a18 18 0 0 1 0 36H86a18 18 0 0 0 0 36h68"
        fill="none"
        strokeWidth="2.5"
        strokeDasharray="4 6"
        strokeLinecap="round"
        className="stroke-acento opacity-45"
      />

      {/*
        As estações. O preenchimento é sólido de propósito: é ele que corta o
        tracejado por baixo, sem precisar de máscara.
      */}
      <g className="fill-superficie stroke-borda" strokeWidth="2">
        <circle cx="38" cy="38" r="9" />
        <circle cx="100" cy="74" r="9" />
        <circle cx="162" cy="110" r="9" />
      </g>
    </svg>
  );
}
