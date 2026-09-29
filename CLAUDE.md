# Koin · gestor de portfólio cripto

Projeto da BitCoderSoft. Nome provisório: **Koin** (pode mudar; trocar em `APP.nome` e no `<title>`).

App web de gestão de portfólio só de criptomoedas, pensado para virar PWA instalável. Inspiração visual e de produto: CoinMarketCap, CoinGecko e as telas de mercado da Binance. Destino: publicação no portfólio da BitCoderSoft.

Este documento resume o que foi construído até aqui (etapas 0, 0.1 e 1, feitas no chat do claude.ai) e o plano das próximas etapas, para a continuação no VS Code.

---

## Situação atual

| Item | Estado |
|---|---|
| Arquivo principal | `koin.html` (single-file: HTML + CSS + JS, sem build) |
| Versão | `0.1.0` (vira `1.0.0` ao fechar a Etapa 7) |
| Etapas concluídas | 0 (fundação), 0.1 (navegação no topo), 1 (mercado) |
| Próxima etapa | 2 (página da moeda com gráfico interativo) |
| Pendência aberta | Confirmar no navegador se a CoinGecko responde direto do arquivo (ver "Verificação pendente") |

---

## Origem

O Koin nasceu da parte cripto do **Dash Finance**, painel pessoal de investimentos (ações, FIIs, BDRs e cripto) do mesmo autor, também single-file. Boa parte da lógica foi testada lá com dados reais. O Dash Finance é de uso pessoal e fica congelado em ~70%; o Koin é o produto publicável.

Recomendação: colocar uma cópia do `dash-finance.html` numa pasta `referencia/` do repositório (sem versionar dados pessoais), para consulta do motor de custo nas etapas 3 a 5.

---

## Decisões de produto

- **Só cripto.** Nada de bolsa.
- **Sem login.** Os dados ficam no aparelho de quem usa. Troca de aparelho resolvida por backup em arquivo (Etapa 5).
- **Moeda de exibição:** Real (padrão), Dólar ou Bitcoin. Tudo é guardado e calculado em **reais**; a conversão acontece só na hora de mostrar.
- **Tema escuro primeiro.** Os tokens do tema claro já estão escritos (comentados em `:root[data-tema="claro"]`), para ligar numa etapa futura.
- **Primeiro a web larga**, depois o responsivo (Etapa 6) e o PWA (Etapa 7). Mesmo assim, construir cada componente sem travar o caminho pro celular.

---

## Design

### Identidade
- Fundo em **tinta azul**, não preto puro. A cor da marca é **latão** (moeda é metal). Verde e vermelho **só** para alta e queda.
- Evitar de propósito o clichê de app cripto "preto com verde neon".
- Ousadia concentrada num lugar: a moeda do logo e o número grande do saldo (fonte Unbounded). O resto é quieto.

### Tokens principais
| Nome | Valor | Uso |
|---|---|---|
| `--bg` | `#0D111C` | fundo do app |
| `--superficie` | `#131A29` | painéis |
| `--superficie-2` | `#1A2334` | cartões, hover, menus |
| `--superficie-3` | `#212C41` | estados ativos |
| `--borda` | `#232E44` | divisões |
| `--texto` | `#E7ECF5` | texto principal |
| `--texto-2` | `#A3AEC4` | secundário |
| `--texto-3` | `#6B7791` | apoio |
| `--marca` | `#E9B949` | latão: marca, foco, ação principal |
| `--alta` | `#22C38E` | só valorização |
| `--queda` | `#F2555A` | só desvalorização |

Raios por hierarquia: controle 8px, cartão 14px, painel 18px.

### Tipografia
- **Manrope** na interface, com números de largura fixa (`font-feature-settings: "tnum"`), para preço não "dançar".
- **Unbounded** só no nome da marca e no saldo em destaque.
- Sem caixa-alta em rótulos.

### Navegação (importante)
- **Não usar barra lateral.** O autor considera o menu lateral com ícones uma assinatura visual de projeto feito com IA. Foi trocado na Etapa 0.1.
- Navegação horizontal no topo, alinhada à largura do conteúdo (1240px). Links diretos + **grupos com menu suspenso** no estilo do CoinMarketCap: seções com título, item com ícone em círculo de latão, nome e uma linha de descrição.
- Com mouse, o menu abre ao passar por cima e fecha com folga de 180ms; no toque, abre e fecha no clique; Esc e clique fora fecham.
- Item ativo: fio de latão colado na borda de baixo do topo. Página dentro de um grupo acende o botão do grupo.
- O menu é montado a partir das listas `NAV` e `NAV_CONTA`. Para crescer, acrescente itens ou seções ali.

### Movimento
- Preço que muda pisca verde ou vermelho (estilo Binance) e o número desliza até o valor novo (`piscar`, `animarNumero`).
- Minigráfico de 7 dias se desenha da esquerda para a direita só na primeira carga.
- Esqueleto de carregamento no lugar de tela vazia.
- `prefers-reduced-motion` respeitado em tudo.

---

## Arquitetura do código

Tudo dentro de um IIFE em `'use strict'`, dividido em blocos com cabeçalho de comentário. Ordem no arquivo:

1. **Configuração** (`APP`, `BINANCE`)
2. **Armazenamento** (`armazem`) [HERANÇA]
3. **Estado central** (`estado`)
4. **Formatação** (`formatarBR`, `formatarPreco`, `formatarPct`, `formatarCompacto`, `escapar`) [HERANÇA]
5. **Moeda de exibição** (`formatarMoeda`, `preencherValores`, `buscarTaxas`, `trocarMoeda`)
6. **Movimento** (`animarNumero`, `piscar`, `avisar`)
7. **Ícones** (`ICONES`, `icone()`, `varHTML()`, `MARCA_SVG`)
8. **Roteador** (`ROTAS`, `NAV`, `NAV_CONTA`, `resolverRota`, `navegar`) [HERANÇA]
9. **Casca** (`cascaHTML`, menus suspensos, `desenhar`)
10. **Pulso do mercado** (BTC no topo)
11. **Páginas** (Portfólio, Ajustes, Sistema visual, placeholders)
12. **Mercado** (Etapa 1)
13. **Início**

### Estado central (a mudança mais importante em relação ao Dash Finance)
No Dash Finance cada mudança redesenhava a página inteira. Aqui a tela é desenhada uma vez e só os pedaços que mudam se atualizam no lugar.

```js
estado.definir('moeda', 'USD');           // avisa quem ouve 'moeda'
estado.ouvir('moeda', fn);                // devolve função pra parar de ouvir
estado.ouvir('conexao', fn, true);        // true = ouvinte da página atual
```
Ouvintes marcados como da página são removidos sozinhos ao trocar de rota (`estado.limparPagina()` dentro de `desenhar`).

### Valores em dinheiro: atributo `data-brl`
Qualquer elemento com `data-brl="1234.56"` é preenchido por `preencherValores()` e **se reescreve sozinho** quando a moeda de exibição muda. Opcional: `data-tipo="preco"` (casas adaptativas: `0,00001234`) ou `data-tipo="compacto"` (`1,23 bi`). Nunca montar texto de dinheiro direto no HTML de uma página: sempre `data-brl`.

`formatarMoeda(brl, tipo)` converte: R$ direto; US$ = R$ ÷ USDTBRL; ₿ = R$ ÷ BTCBRL (8 casas abaixo de 1 ₿). Taxas da Binance com cache de 5 min. Sem taxa, os botões US$ e ₿ se desativam com explicação.

### Rotas
- `ROTAS` mapeia caminho → `{ titulo, icone, etapa, render, montar? }`.
- `render(r)` devolve o HTML do miolo; `montar(miolo)` liga o que precisa depois (dados, timers, ouvintes).
- Rotas dinâmicas: `'/moeda'` tem `dinamica: true`; `/moeda/bitcoin` chega como `r.param = 'bitcoin'`. A página de moeda acende "Mercado" no menu.
- Rota atual guardada em memória (`rotaAtual`) e espelhada em `#/rota` via `history.pushState` quando o navegador deixa.

---

## Convenções (valem para todo código novo)

- **Tags nos comentários:** toda mudança leva `[ETAPA N]` (ou `[ETAPA N.x]` para ajuste). Herdado do Dash Finance leva `[HERANÇA]`. O guia no topo do HTML lista o histórico.
- **Links internos sem `href`:** use `<a role="link" tabindex="0" data-rota="/rota">`. O preview do claude.ai trata qualquer `href` como link externo. Navegar por código: `navegar('/rota')`.
- **Formulários sem submit nativo:** o preview bloqueia `<form>` antes do evento `submit`. Botões `type="button"` com `data-*` e tratamento no `click`; Enter tratado no `keydown`. (Na Etapa 3, reaproveitar o padrão `processarFormulario` do Dash Finance.)
- **Armazenamento só por `armazem`**, nunca `localStorage` direto. Chaves com prefixo `KOIN_` (automático).
- **Notação brasileira:** vírgula nos decimais, ponto nos milhares. Sempre pelos formatadores.
- **Formatação humana do código:** uma propriedade CSS por linha, blocos separados, comentários explicando o porquê. Nada de CSS compactado em uma linha (o código é inspecionável num site publicado).
- **Textos da interface:** português simples, frase em caixa normal, sem travessão separando ideias, sem frases de efeito. Botão diz o que faz ("Salvar chave", não "Enviar").
- **Página "Sistema visual"** (menu da engrenagem) é a vitrine dos componentes. Sai do menu antes da publicação.

---

## Fontes de dados

### Binance (pública, sem chave)
- REST base: `https://data-api.binance.vision` (recomendada pela própria Binance para quem só consome dados de mercado).
- `/api/v3/ticker/price?symbols=["USDTBRL","BTCBRL"]` → taxas de conversão (cache 5 min).
- `/api/v3/ticker/24hr?symbol=BTCBRL` → pulso do topo (a cada 30s).
- `/api/v3/ticker/price` (todos) → descobrir quais moedas têm par USDT (cache 1h).
- `/api/v3/ticker/24hr?symbols=[...]` → modo simplificado do mercado.
- **WebSocket:** `wss://data-stream.binance.vision/stream?streams=btcusdt@miniTicker/...` Um socket só, com as moedas da tabela + `usdtbrl@miniTicker`. Reconexão com espera crescente (2s, 4s, 8s... até 60s). Fechado ao sair do Mercado.
- Limites são por IP. Se vier 429/418, parar e esperar (insistir gera banimento de 2 min a 3 dias).

### CoinGecko
- Base: `https://api.coingecko.com/api/v3`
- `/coins/markets?vs_currency=brl&order=market_cap_desc&per_page=100&page=1&sparkline=true&price_change_percentage=1h,24h,7d` → 1 chamada traz as 100 maiores com ranking, logo, preço em reais, variações, volume, valor de mercado e minigráfico de 7 dias.
- **Sem chave** funciona (API pública, ~10 a 30 chamadas por minuto por IP). **Chave Demo gratuita** (opcional, colada em Ajustes): 100/min, 10 mil/mês.
- A chave vai como **parâmetro na URL** (`x_cg_demo_api_key`), não no cabeçalho: cabeçalho customizado dispara a checagem prévia de CORS, que já bloqueou outra API (bolsai) no Dash Finance.
- Cache de 5 minutos. Se falhar e houver cache vencido, usa o cache (avisando). Sem cache, cai para o modo simplificado.

### Casamento CoinGecko × Binance
Pelo símbolo (`btc` → `BTCUSDT`). Como símbolos se repetem entre moedas diferentes, o "ao vivo" só liga se o preço da Binance estiver **a até 10%** do preço da CoinGecko (`DIVERGENCIA_MAX`). Lição herdada do Dash Finance (caso do par ENABRL parado com preço antigo).

---

## O que cada etapa entregou

### Etapa 0 · Fundação
Design system, casca, roteador, estado central, armazenamento com fallback, moeda de exibição R$/US$/₿, pulso do BTC ao vivo no topo, avisos rápidos, página Ajustes (moeda, tema, modo de armazenamento), página Sistema visual (cores, tipos, controles, tabela com preço simulado piscando, indicadores, esqueleto).

### Etapa 0.1 · Navegação no topo
Barra lateral removida. Topo com links, grupo "Análise" (Balanceamento, Objetivos) e menu da engrenagem (Ajustes, Sistema visual). Rodapé com versão, aviso de privacidade e autoria.

### Etapa 1 · Mercado
- Destaques: 3 maiores altas e 3 maiores quedas em 24h; cartão com valor de mercado e volume somados das 100 maiores e peso do bitcoin.
- Tabela das 100 maiores: estrela de favorita, posição, logo, nome, preço, 1h, 24h, 7d, volume, valor de mercado, minigráfico de 7 dias.
- Abas: Todas, Favoritas, Em alta, Em queda. Ordenação clicando no cabeçalho.
- Favoritas salvas em `prefs.favoritos` (ids da CoinGecko).
- Busca do topo: filtra enquanto digita; Enter em outra página leva ao Mercado filtrado; Esc limpa.
- Preço e 24h ao vivo pelo WebSocket, com pisca e deslize. Indicador "Preços ao vivo" na página.
- Modo simplificado automático (30 principais, só Binance) quando a CoinGecko não responde.
- Ajustes: campo da chave Demo da CoinGecko (salvar/remover).
- Rota `/moeda/<id>` criada, ainda com placeholder da Etapa 2.

### Verificação pendente
Testado só com respostas simuladas no formato das documentações. Falta confirmar **no navegador real** se a CoinGecko aceita chamadas direto do arquivo (CORS). Como checar: abrir o Mercado; se a tabela vier com logos e minigráficos, está ok; se aparecer "Modo simplificado", a CoinGecko recusou (ver o motivo no console, F12). Se for bloqueio de origem, testar servindo por servidor local (`python -m http.server`) antes de decidir outro caminho.

---

## Próximas etapas

### Etapa 2 · Página da moeda
- Rota `/moeda/<id>` (já existe o esqueleto em `paginaMoeda`).
- Cabeçalho: logo, nome, símbolo, preço ao vivo (mesmo WebSocket, 1 stream), variação 24h, favorita.
- **Gráfico interativo** com **Lightweight Charts** (TradingView), carregado por CDN: linha e velas, zoom, cursor com preço e data, períodos 1D, 7D, 1M, 3M, 1A. Dados: klines da Binance (`/api/v3/klines`, par USDT convertido pelo USDTBRL do mesmo dia, lógica já pronta no Dash Finance em `buscarHistoricoCripto`). Moeda sem par na Binance: `/coins/{id}/market_chart` da CoinGecko.
- Estatísticas: máxima e mínima 24h, volume, valor de mercado, oferta circulante e máxima, máxima histórica e distância dela (CoinGecko `/coins/{id}`, cache longo).
- Conversor rápido (quantidade ↔ reais).
- Espaço reservado para "sua posição" e "seus lançamentos" (preenchido na Etapa 3/4).

### Etapa 3 · Motor e lançamentos
Portar do Dash Finance (buscar pelas tags `[CRIPTO v2]`, `[CRIPTO v2.1]`, `[MOTOR v2]`):
- `pernasDaTransacao`: cada transação vira variações de quantidade por ativo. COMPRA/ENTRADA soma; VENDA/SAIDA subtrai; CONVERSAO subtrai da origem e soma no destino.
- `processarCarteira`: custo e posição. **Entrada sempre custo zero.** Saída baixa custo pelo preço médio. Conversão leva o custo da origem inteiro pro destino, sem cotação. Guarda `qtdComCusto` para o **preço médio de compra** (entrada gratuita não mexe no PM).
- `ordenarTransacoes`: data → prioridade no dia (entrada/compra, conversão, venda/saída) → criadoEm → id.
- `primeiroFuroDeSaldo` + `verificarCronologia`: nenhuma baixa pode ficar sem saldo na data; vale para salvar, editar e excluir.
- Formulário guiado (tipo primeiro, token em lista nas baixas, sugestões com `data-auto`), `processarFormulario` sem submit nativo.
- **Novo em relação ao Dash Finance:** lucro **realizado** (valor recebido na venda menos o custo baixado), guardado por transação.
- Identificação de moeda pelo **id da CoinGecko** (não só símbolo), para não confundir moedas homônimas.

### Etapa 4 · Portfólio
- Saldo grande (Unbounded) em R$/US$/₿, custo total, lucro realizado e não realizado, variação 24h da carteira.
- **Evolução real do patrimônio:** reconstruída dia a dia (quantidade que havia em cada dia × preço daquele dia), não o custo acumulado.
- Alocação em rosca animada (ECharts ou ApexCharts via CDN).
- Tabela de ativos: preço, 24h, quantidade (com "sem custo" em verde quando houver entrada gratuita), PM de compra, custo, saldo atual, lucro, % da carteira. Rentabilidade pelo valor (saldo ÷ custo), não pelo PM.
- Posição de custo zero: mostra valor atual e "custo zero" no lugar da porcentagem.

### Etapa 5 · Extras
- **Balanceamento:** alocação ideal por moeda ou grupo, nota 0 a 10 por moeda, peso ideal, desvio em pontos percentuais, simulador de aporte (só compra, guloso pela maior falta). Vocabulário: "alocação ideal", "nota", "peso ideal", "desvio". A palavra "meta" fica reservada para Objetivos.
- **Objetivos:** patrimônio total, patrimônio numa moeda, com progresso, aporte mensal (informado ou média real) e conclusão estimada. Concluídos guardados com data.
- **Alertas de preço** (no app; notificação de sistema depois do PWA).
- **Backup:** exportar/importar JSON com prévia, verificação da carteira e "desfazer última importação" (portar do Dash Finance, tag `[BACKUP v1]`).

### Etapa 6 · Responsivo
- Navegação vira **barra inferior** com ícones no celular (padrão de app nativo). Menus agrupados viram folha que sobe de baixo.
- Tabelas viram cartões; formulários em tela cheia com rodapé fixo; campos com 16px (evita zoom do iPhone); respeito a `safe-area-inset`.
- Referência: bloco `[MOBILE v1]` do Dash Finance.

### Etapa 7 · PWA
- Separar em `index.html` + `manifest.webmanifest` + `sw.js` + ícones (192, 512, maskable).
- Service worker: cache da casca e das bibliotecas de CDN; dados de mercado com rede primeiro e cache de reserva.
- Tela de instalação, splash, `theme-color`, modo standalone.
- Hospedagem: GitHub Pages do repositório da BitCoderSoft.
- Versão `1.0.0`.

---

## Sugestão para o repositório

```
koin/
  index.html            (hoje: koin.html; renomear na Etapa 7)
  CLAUDE.md             (este arquivo)
  referencia/
    dash-finance.html   (consulta do motor; sem dados pessoais)
```
Um commit por etapa (ou por ajuste `N.x`), com a tag no título: `ETAPA 2: página da moeda com gráfico interativo`.

---

## Para começar no VS Code

Com este arquivo na raiz como `CLAUDE.md`, o Claude Code já lê o contexto ao abrir o projeto. Primeira mensagem sugerida:

> Leia o CLAUDE.md e o koin.html. Antes da Etapa 2, preciso confirmar a pendência da CoinGecko: vou abrir o Mercado no navegador e te conto o resultado. Depois seguimos para a página da moeda.
