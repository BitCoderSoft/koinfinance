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
| Etapas concluídas | 0 (fundação), 0.1 (navegação no topo), 1 (mercado), 1.1 (CoinGecko com chave), 1.2 (tabela larga), 2 (página da moeda), 2.1 (sem chave do usuário), 3 (motor e lançamentos), 4 (portfólio) |
| Próxima etapa | 5 (extras: balanceamento, objetivos, alertas, backup) |
| Pendência aberta | Confirmar no navegador (com a chave) que o Mercado sai do modo simplificado (ver "Verificação pendente") |

---

## Origem

O Koin nasceu da parte cripto do **Dash Finance**, painel pessoal de investimentos (ações, FIIs, BDRs e cripto) do mesmo autor, também single-file. Boa parte da lógica foi testada lá com dados reais. O Dash Finance é de uso pessoal e fica congelado em ~70%; o Koin é o produto publicável.

O `dash-finance.html` foi anexado no chat na Etapa 3 e o motor cripto já foi portado. **O arquivo original contém tokens reais (brapi e bolsai) no código: nunca colocar ele no repositório.** Se precisar dele de novo (Balanceamento e Objetivos, Etapa 5, e Backup, `[BACKUP v1]`), colocar uma cópia limpa (sem tokens) em `referencia/`.

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
- O menu é montado a partir das listas `NAV` e `NAV_CONTA` (grupos hoje: Portfólio, Análise). Para crescer, acrescente itens ou seções ali.

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
- **Formulários sem submit nativo:** o preview bloqueia `<form>` antes do evento `submit`. Botões `type="button"` com `data-*` e tratamento no `click`; Enter tratado no `keydown`. (Na Etapa 3 a gaveta de lançamento seguiu isso: `data-lanc-salvar` no clique e Enter no `keydown`.)
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
- **Exige chave** (confirmado em 29/09/2026: sem chave o `/coins/markets` responde 403 "Request blocked" do CloudFront). Chave Demo gratuita: 30/min, 10 mil/mês. A chave Demo do autor está embutida em `CG_CHAVE_PADRAO`. **O usuário não informa chave própria** (o campo foi removido de Ajustes em 29/09/2026). Rever antes de publicar (chave no código é pública).
- **REGRA: no máximo 1 chamada por dia.** O Koin vive dos dados da Binance (preço, 24h e volume ao vivo). A CoinGecko só entra pro que a Binance não entrega (ranking, logo, valor de mercado, variação 1h/7d, minigráfico), e **só na primeira abertura do dia** (dia local, `diaDeHoje()`). Cache de hoje = não chama. Falhou = espera 30 min (`CG_ESPERA_FALHA`) e usa o cache antigo. Toda chamada nova à CoinGecko (Etapa 2 em diante) deve seguir a mesma regra, com cache longo por moeda.
- O `sparkline_in_7d` vem em **dólar** mesmo com `vs_currency=brl`. Serve pro formato do minigráfico, não pra valores.
- A chave vai como **parâmetro na URL** (`x_cg_demo_api_key`), não no cabeçalho: cabeçalho customizado dispara a checagem prévia de CORS, que já bloqueou outra API (bolsai) no Dash Finance.
- Cache diário (ver regra acima). Se falhar e houver cache de outro dia, usa o cache (avisando). Sem cache, cai para o modo simplificado.

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
- Ajustes: campo da chave Demo da CoinGecko (removido depois, ver Etapa 2.1).

### Etapa 2.1 · Sem chave do usuário
Removido de Ajustes o campo para o usuário colar a chave da CoinGecko. Só vale a chave embutida.

### Etapa 1.2 · Tabela do Mercado mais larga
Largura máxima 1240 para 1400px, colunas com largura fixa (minigráfico cabe sem rolagem, nome perto do preço).

### Etapa 1.1 · CoinGecko com chave e 1 chamada por dia
Chave Demo embutida, cache por dia local, espera de 30 min após falha (`MERCADO_FALHA`). Testado com chamada real: 1ª chamada HTTP, repetições no mesmo dia sem HTTP, cache de ontem renova, falha usa cache velho sem martelar.
- Rota `/moeda/<id>` criada (preenchida na Etapa 2).

### Verificação pendente
[29/09/2026] Via curl, com a chave Demo, o `/coins/markets` responde 200 com `access-control-allow-origin: *` (CORS liberado). Sem chave dá 403. Falta só ver no navegador o Mercado completo com a chave embutida (etapa 1.1).

Histórico do teste original:
Testado só com respostas simuladas no formato das documentações. Falta confirmar **no navegador real** se a CoinGecko aceita chamadas direto do arquivo (CORS). Como checar: abrir o Mercado; se a tabela vier com logos e minigráficos, está ok; se aparecer "Modo simplificado", a CoinGecko recusou (ver o motivo no console, F12). Se for bloqueio de origem, testar servindo por servidor local (`python -m http.server`) antes de decidir outro caminho.

---

### Etapa 4 · Portfólio (entregue)
- **Menu:** "Lançamentos" virou submenu de "Portfólio" (grupo `Portfólio` em `NAV`, com os itens Portfólio e Lançamentos). O botão do grupo acende nas duas rotas. Na tela do Portfólio há o botão "Lançamentos" (e "Novo lançamento") no cabeçalho.
- **Resumo:** saldo grande (Unbounded) na moeda de exibição, variação das últimas 24h (R$ e %), custo total, lucro não realizado (e % sobre o custo), lucro realizado, resultado total (não realizado mais realizado). Saldo desliza até o valor novo a cada atualização.
- **Evolução real do patrimônio:** `reconstruirEvolucao` (função pura, 11 testes em Node) reconstrói dia a dia do 1º lançamento até hoje: quantidade que havia em cada dia x fechamento daquele dia. Segunda linha tracejada com o custo. Preços: klines diárias da Binance (par USDT x USDTBRL do mesmo dia), uma chamada por moeda que a carteira já teve. Dia sem preço repete o último. **Moeda sem histórico na Binance entra pelo custo** e a tela avisa quais. Períodos 1M, 3M, 6M, 1A, Tudo. O último ponto (hoje) acompanha o saldo ao vivo. Segue a moeda de exibição.
- **Alocação (rosca):** SVG próprio, animado (as fatias deslizam quando os pesos mudam). As 5 maiores moedas têm cor própria e o resto vai para "Outras" (cinza). **A cor segue a moeda** (ordem de entrada na carteira), não o tamanho. Paleta categórica validada com o validador da skill `dataviz` no fundo escuro (`#131A29`), inclusive fechando o anel: azul, laranja, violeta, latão, magenta. **Ficam de fora verde e vermelho** (reservados para alta e queda). Fatias com 2px de respiro, legenda com % e valor.
- **Tabela de ativos:** moeda, preço ao vivo (pisca), 24h, quantidade (com "X sem custo"), preço médio de compra, custo, saldo, lucro (R$ e %) e % da carteira. **Rentabilidade pelo valor** (saldo menos custo, sobre o custo). Posição de custo zero mostra "custo zero" no lugar da %.
- **Ao vivo:** REST `ticker/24hr` na abertura e WebSocket (`abrirCanalAoVivo`, reconexão crescente) com o amortecedor de 5s. Verificado: uma mudança do saldo a cada 5s.
- **Moeda sem cotação ao vivo** (sem par na Binance ou fora do pacote diário): usa o preço do pacote e, sem preço, entra no saldo pelo custo (aviso abaixo da tabela).
- `sairDoPortfolio()` roda em todo `desenhar()` e limpa socket, timers e gráfico.

### Etapa 3 · Motor e lançamentos (entregue)
Portado do `dash-finance.html` (só a parte cripto: `[CRIPTO v2]`, `[CRIPTO v2.1]`, `[MOTOR v2]`), sem usuário e sem bolsa.
- **Motor puro** (bloco `[MOTOR:início]`/`[MOTOR:fim]` no HTML): `pernasDaTransacao`, `ordenarTransacoes` (data, prioridade no dia, `criadoEm`, id), `processarCarteira` (custo, `qtdComCusto`, preço médio de compra, resíduo de ponto flutuante), `primeiroFuroDeSaldo`, `verificarCronologia` (salvar, editar e excluir). Recebe listas e devolve resultado, sem ler nem gravar nada.
- **Lucro realizado (novo):** `processarCarteira` devolve `realizado[idLancamento]` = (qtd x preço, menos taxas) menos o custo baixado, só para vendas. **É calculado na hora, não guardado no lançamento** (diferente do que o plano original dizia): editar ou excluir um lançamento antigo muda o custo das vendas seguintes, e um valor gravado ficaria velho.
- **Moeda identificada pelo id da CoinGecko** (`moedaId`), com cadastro em `BANCO.moedas` (nome, símbolo, logo) para a tela não depender do pacote diário.
- **Banco local** (`armazem`, chave `KOIN_BANCO`): `{ moedas, transacoes, proximoId }`. Valores unitários e taxas em reais. Tipos: COMPRA, VENDA, ENTRADA, SAIDA, CONVERSAO.
- **Gaveta de lançamento** (`#gaveta`, sem `<form>`): operação primeiro (botões), moeda em lista (só as com saldo nas baixas) ou campo com sugestões (compra, entrada, destino), quantidade, preço, taxas, data. Sugestões com `data-auto` (saldo inteiro nas baixas, preço atual da moeda) que a pessoa pode sobrescrever. Campos aceitam `1.234,56` e `1234.56`.
- **Página Lançamentos** (`/lancamentos`): lista do mais recente para o mais antigo, com editar e excluir, e o lucro realizado total.
- **Página da moeda:** "Sua posição" (quantidade, quantidade sem custo, preço médio de compra, custo, valor atual e lucro não realizado ao vivo, lucro realizado) e "Seus lançamentos" da moeda. Isso adianta parte da Etapa 4.
- Só as 100 moedas do pacote diário podem ser escolhidas em lançamento novo. Moeda já lançada continua aparecendo mesmo se sair do top 100.
- Testes do motor (23 casos, rodados em Node contra o trecho do HTML): entrada gratuita não derruba o preço médio, venda baixa custo proporcional e calcula lucro realizado, conversão leva o custo e a fração com custo, saída sem lucro realizado, ordem no mesmo dia, furo de saldo, excluir/editar barrados, cadeia conversão e venda, resíduo de ponto flutuante.
- Etiquetas de operação: latão para o que entra, cinza para o que sai, azul para conversão. Verde e vermelho seguem só para alta e queda (inclusive o lucro realizado).
- Backup (exportar e importar JSON) continua na Etapa 5. O `BANCO` já está em uma chave só, o que facilita.

### Etapa 2 · Página da moeda (entregue)
- Rota `/moeda/<id>`: cabeçalho (logo, nome, posição, favorita, preço ao vivo e 24h), gráfico, estatísticas, conversor e espaços de "Sua posição" e "Seus lançamentos" (Etapas 3/4).
- Gráfico: **Lightweight Charts 4.2.3** (unpkg, com SRI), carregado só ao abrir uma moeda. Linha e velas; períodos 1D, 7D, 1M, 3M, 1A; cursor com data e valores; segue a moeda de exibição (R$/US$/₿). Klines da Binance em USDT convertidas pelas klines do USDTBRL no mesmo instante. A última vela acompanha o preço ao vivo.
- Moeda **sem par na Binance**: sem gráfico (mensagem). Não buscamos o histórico na CoinGecko por causa da regra de 1 chamada por dia. Decidir depois se vale uma exceção com cache longo.
- Estatísticas: máxima, mínima e volume de 24h vêm da Binance (`ticker/24hr`, a cada 60s). Valor de mercado, ofertas e máxima histórica vêm do **mesmo pacote diário** da CoinGecko (campos novos, `CG_PACOTE_VERSAO = 2`), sem chamada extra. Só as 100 do pacote têm página.
- Conversor quantidade ↔ valor na moeda de exibição, pelo preço atual.
- **REGRA DOS 5s:** o preço na tela (tabela do Mercado e página da moeda) muda no máximo a cada 5s (`PRECO_INTERVALO_MS`). O WebSocket segue mandando ~1 tick/s; `criarAmortecedor` guarda o último de cada moeda e aplica em lote (1º lote 800ms após o 1º tick). O pulso do BTC no topo continua a cada 30s. Verificado: 1 mudança a cada 5s. Toda tela nova com preço ao vivo deve usar `criarAmortecedor`.
- Casamento Binance × CoinGecko (`parBinanceDe`): com o pacote de até 24h, a tolerância de divergência sobe de 10% para 40% quando o pacote tem mais de 1h. Símbolo repetido de verdade difere por ordens de grandeza.
- `sairDaMoeda()` roda em todo `desenhar()` e limpa socket, timers e gráfico.

## Próximas etapas

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

## Para a Etapa 7 (PWA): tela de identificação (ideia registrada em 29/09/2026)

O autor pretende, no PWA, mostrar uma **tela inicial de identificação antes do app**, para saber **quem está usando**. Por enquanto é só referência, sem decisão. Pontos levantados ao olhar o login do Dash Finance:

- **O que o login do Dash Finance é:** usuários e senha guardados no navegador (`db.users`), sessão em `SESSION_KEY`, hash caseiro da senha (`hashSenha`, o próprio código avisa que não é segurança), tela dividida (painel da marca à esquerda, formulário à direita), "Olá, fulano" no topo e guarda de rota (sem sessão vai para `/login`). Serve para separar contas no mesmo aparelho, **não** para saber quem usa o app: nada sai do aparelho.
- **Conflito com uma decisão de produto:** o Koin é "sem login, dados só no aparelho" (e o rodapé diz isso). Para **ter visão de quem usa**, a identificação precisa ir para um servidor (backend próprio, Firebase/Supabase, login com Google etc.). Isso muda a promessa de privacidade, pede aviso de consentimento e política de privacidade (LGPD) e coletar o mínimo (nome e e-mail, por exemplo).
- **Versões possíveis:** (a) só um nome local para a saudação "Olá, fulano", sem visibilidade; (b) identificação real com servidor, com visibilidade de uso; (c) identificação opcional, com o app funcionando sem ela.
- **Não reaproveitar** o hash do Dash Finance. Identificação de verdade usa um provedor de autenticação.
- Aproveitar do Dash Finance: o layout de tela dividida com o painel da marca, a saudação e o padrão de guarda de rota (`renderCurrentRoute`).
- Decidir também o que acontece com os dados locais (carteira) de quem se identifica: continuam só no aparelho ou passam a sincronizar. Sincronizar resolveria a troca de aparelho, hoje coberta só por backup em arquivo (Etapa 5).

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

