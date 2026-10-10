# KoinFin · gestor de portfólio cripto

Projeto da BitCoderSoft. Nome do app: **KoinFin** (definido em `APP.nome` e no `<title>`).

App web de gestão de portfólio só de criptomoedas, publicado como PWA instalável. Inspiração visual e de produto: CoinMarketCap, CoinGecko e as telas de mercado da Binance.

Este documento resume o que foi construído até aqui e o que falta para v1.0.


## Situação atual

| Item | Estado |
|---|---|
| Arquivo principal | `index.html` (single-file: HTML + CSS + JS, sem build) |
| Versão | `v0.3.0-beta` |
| Etapas concluídas | 0, 0.1, 1, 1.1, 1.2, 2, 2.1, 3, 4, 4.1, 5, 5.1, 6, 6.1, 6.2, 6.3, 7, 7.1, 7.2, 7.3, 7.4, 8 (busca fora do top 100), 9 (Supabase auth), 9.1–9.5 (banco assíncrono, offline, Cloudflare Worker, refinamentos), 10 (Balanceamento), 10.1 (targets no Supabase), 11 (Objetivos), 12 (Pendências v1.0: modal nativo, perfil, LW Charts offline, registro em USD), 13 (Simulador de Aporte) |
| PWA | Entregue no v0.2.0-beta: `manifest.json`, `sw.js`, ícones, registro do SW, botão de instalação, banner de atualização (sem número de etapa próprio) |
| Tema claro | Entregue no v0.2.0-beta: toggle em Ajustes, `aplicarTema()`, tokens completos em `:root[data-tema="claro"]` |
| Hospedagem | App publicado e no ar. Cloudflare Worker (`teste-koin.correiaerisvaldo.workers.dev`) como proxy da CoinGecko |
| O que falta para v1.0 | Ver seção "Antes de publicar / Pendências para v1.0" |

---

## Origem

O KoinFin nasceu da parte cripto do **Dash Finance**, painel pessoal de investimentos (ações, FIIs, BDRs e cripto) do mesmo autor, também single-file. Boa parte da lógica foi testada lá com dados reais. O Dash Finance é de uso pessoal e fica congelado em ~70%; o KoinFin é o produto publicável.

O `dash-finance.html` foi anexado no chat na Etapa 3 e o motor cripto já foi portado. **O arquivo original contém tokens reais (brapi e bolsai) no código: nunca colocar ele no repositório.** Se precisar dele de novo, colocar uma cópia limpa (sem tokens) em `referencia/`.

---

## Decisões de produto

- **Só cripto.** Nada de bolsa.
- **Identificação:** perfil + PIN local na Etapa 6; migrada para **Supabase Auth** na Etapa 9 (e-mail e senha, sessão persistente entre aberturas). Dados no Supabase desde a Etapa 9.2.
- **Moeda de exibição:** Real (padrão), Dólar ou Bitcoin. Tudo é guardado e calculado em **reais**; a conversão acontece só na hora de mostrar.
- **Tema escuro por padrão; tema claro disponível** em Ajustes (entregue no v0.2.0-beta).
- **Primeiro a web larga**, depois o responsivo (Etapa 5), identificação (Etapa 6), os extras (Etapa 7) e o PWA (v0.2.0-beta).

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
11. **Páginas** (Portfólio, Ajustes, placeholders)
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

- **Numeração das etapas:** quando o autor pede pra adiantar uma etapa, ela **ocupa o lugar na ordem** e as demais descem (as etapas nunca pulam número). O número novo vale no commit, no CLAUDE.md e nas tags `[ETAPA N]` do código. Ajuste `N.x` continua sendo ajuste de uma etapa.
- **Tags nos comentários:** toda mudança leva `[ETAPA N]` (ou `[ETAPA N.x]` para ajuste). Herdado do Dash Finance leva `[HERANÇA]`.
- **Links internos sem `href`:** use `<a role="link" tabindex="0" data-rota="/rota">`. Navegar por código: `navegar('/rota')`.
- **Formulários sem submit nativo:** botões `type="button"` com `data-*` e tratamento no `click`; Enter tratado no `keydown`.
- **Armazenamento só por `armazem`**, nunca `localStorage` direto. Chaves com prefixo `KOIN_` (automático).
- **Notação brasileira:** vírgula nos decimais, ponto nos milhares. Sempre pelos formatadores.
- **Formatação humana do código:** uma propriedade CSS por linha, blocos separados, comentários explicando o porquê. Nada de CSS compactado em uma linha.
- **Textos da interface:** português simples, frase em caixa normal, sem travessão separando ideias, sem frases de efeito. Botão diz o que faz ("Salvar chave", não "Enviar").
- ~~**Página "Sistema visual"**~~ removida na Etapa 7.2.

---

## Fontes de dados

### Binance (pública, sem chave)
- REST base: `https://data-api.binance.vision`.
- `/api/v3/ticker/price?symbols=["USDTBRL","BTCBRL"]` → taxas de conversão (cache 5 min).
- `/api/v3/ticker/24hr?symbol=BTCBRL` → pulso do topo (a cada 30s).
- `/api/v3/ticker/price` (todos) → descobrir quais moedas têm par USDT (cache 1h).
- `/api/v3/ticker/24hr?symbols=[...]` → modo simplificado do mercado.
- **WebSocket:** `wss://data-stream.binance.vision/stream?streams=btcusdt@miniTicker/...` Um socket só, com as moedas da tabela + `usdtbrl@miniTicker`. Reconexão com espera crescente (2s, 4s, 8s... até 60s).
- Limites são por IP. Se vier 429/418, parar e esperar (insistir gera banimento de 2 min a 3 dias).

### CoinGecko (via Cloudflare Worker)
- **Ponto de acesso do app:** `https://teste-koin.correiaerisvaldo.workers.dev` (variável `COINGECKO` no código). A chave Demo vive como variável de ambiente no Worker, **nunca no `index.html`**.
- O Worker entrega o `/coins/markets` já em cache para o restante do dia, cobrindo a regra de 1 chamada por dia.
- **REGRA: no máximo 1 chamada por dia.** O KoinFin vive dos dados da Binance. A CoinGecko só entra pro que a Binance não entrega (ranking, logo, valor de mercado, variação 1h/7d, minigráfico), e **só na primeira abertura do dia** (dia local, `diaDeHoje()`). Falhou = espera 30 min (`CG_ESPERA_FALHA`) e usa o cache antigo. Sem cache, cai para o modo simplificado.
- O `sparkline_in_7d` vem em dólar mesmo com `vs_currency=brl`. Serve pro formato do minigráfico, não pra valores.
- Antes de publicar em produção com URL definitiva: gerar chave nova no painel da CoinGecko e atualizar no Worker (a atual apareceu em commits anteriores antes do Worker existir).

### Casamento CoinGecko × Binance
Pelo símbolo (`btc` → `BTCUSDT`). O "ao vivo" só liga se o preço da Binance estiver **a até 10%** do preço da CoinGecko (`DIVERGENCIA_MAX`). Com o pacote de até 24h, a tolerância sobe para 40% quando o pacote tem mais de 1h.

---

## O que cada etapa entregou

### Etapa 0 · Fundação
Design system, casca, roteador, estado central, armazenamento com fallback, moeda de exibição R$/US$/₿, pulso do BTC ao vivo no topo, avisos rápidos, página Ajustes (moeda, tema, modo de armazenamento), página Sistema visual (andaime, removida na Etapa 7.2).

### Etapa 0.1 · Navegação no topo
Barra lateral removida. Topo com links, grupo "Análise" (Balanceamento, Objetivos) e menu da engrenagem. Rodapé com versão, aviso de privacidade e autoria.

### Etapa 1 · Mercado
- Destaques: 3 maiores altas e 3 maiores quedas em 24h; cartão com valor de mercado e volume somados das 100 maiores e peso do bitcoin.
- Tabela das 100 maiores: estrela de favorita, posição, logo, nome, preço, 1h, 24h, 7d, volume, valor de mercado, minigráfico de 7 dias.
- Abas: Todas, Favoritas, Em alta, Em queda. Ordenação clicando no cabeçalho.
- Busca do topo: filtra enquanto digita; Enter em outra página leva ao Mercado filtrado; Esc limpa.
- Preço e 24h ao vivo pelo WebSocket, com pisca e deslize. Indicador "Preços ao vivo" na página.
- Modo simplificado automático (30 principais, só Binance) quando a CoinGecko não responde.

### Etapa 1.1 · CoinGecko com chave e 1 chamada por dia
Chave Demo embutida (depois migrada para o Worker na Etapa 9.4), cache por dia local, espera de 30 min após falha.

### Etapa 1.2 · Tabela do Mercado mais larga
Largura máxima 1240 para 1400px, colunas com largura fixa (minigráfico cabe sem rolagem).

### Etapa 2 · Página da moeda
- Rota `/moeda/<id>`: cabeçalho (logo, nome, posição, favorita, preço ao vivo e 24h), gráfico, estatísticas, conversor.
- Gráfico: **Lightweight Charts 4.2.3** (unpkg, com SRI), carregado só ao abrir uma moeda. Linha e velas; períodos 1D, 7D, 1M, 3M, 1A; segue a moeda de exibição. Klines da Binance em USDT convertidas pelas klines do USDTBRL.
- Moeda sem par na Binance: sem gráfico (mensagem).
- **REGRA DOS 5s:** preço muda no máximo a cada 5s (`PRECO_INTERVALO_MS`). `criarAmortecedor` guarda o último de cada moeda e aplica em lote.
- `sairDaMoeda()` roda em todo `desenhar()` e limpa socket, timers e gráfico.

### Etapa 2.1 · Sem chave do usuário
Removido de Ajustes o campo para o usuário colar a chave da CoinGecko.

### Etapa 3 · Motor e lançamentos
- **Motor puro:** `pernasDaTransacao`, `ordenarTransacoes`, `processarCarteira`, `primeiroFuroDeSaldo`, `verificarCronologia`. Recebe listas e devolve resultado, sem ler nem gravar nada.
- **Lucro realizado:** calculado na hora, não guardado no lançamento (editar/excluir recalcula automaticamente).
- **Banco local** (`armazem`, chave `KOIN_BANCO`): `{ moedas, transacoes, proximoId }`. Tipos: COMPRA, VENDA, ENTRADA, SAIDA, CONVERSAO.
- **Gaveta de lançamento** (`#gaveta`): operação, moeda, quantidade, preço, taxas, data.
- **Página Lançamentos** (`/lancamentos`): lista do mais recente para o mais antigo.
- Testes do motor: 23 casos, rodados em Node.

### Etapa 4 · Portfólio
- Resumo: saldo grande (Unbounded), variação 24h, custo, lucro não realizado, lucro realizado, resultado total.
- **Evolução real do patrimônio:** `reconstruirEvolucao` — klines diárias da Binance, dia a dia do 1º lançamento até hoje. Períodos 1M, 3M, 6M, 1A, Tudo.
- **Alocação (rosca):** SVG próprio, animado. Paleta categórica validada com `dataviz` skill: azul, laranja, violeta, latão, magenta. Verde e vermelho não entram.
- **Tabela de ativos:** moeda, preço ao vivo, 24h, quantidade, preço médio, custo, saldo, lucro, % da carteira.
- `sairDoPortfolio()` limpa socket, timers e gráfico.

### Etapas 4.1 e 5.1 · Ajustes do relatório de testes
Origem: relatório de testes de 29/09/2026 (Android, Chrome).
- Topo fixo (`position: fixed`). Bolinhas nos cartões de destaque (celular). Escala do gráfico do portfólio. Sinal negativo antes do símbolo. Etiquetas de operação (cinza/contorno/azul, não verde/vermelho). Logo do TradingView no rodapé.

### Etapa 5 · Responsivo no celular
Vale abaixo de **768px**. Bloco `CELULAR` no fim do `<style>`.
- **Menu sanduíche** (sem barra inferior). Topo: marca, chip de moeda, busca, sanduíche.
- **Mercado enxuto**: linha de ~58px (referência CoinMarketCap mobile).
- **Portfólio**: cartões em 2 colunas, gráfico menor, tabela vira lista.
- **Lançamentos**: cada um vira cartão. Gaveta em tela cheia com rodapé fixo.
- Campos com 16px (evita zoom do iPhone), `safe-area`.

### Etapa 6 · Identificação local
PIN + perfil local. Múltiplos perfis por dispositivo. AES-GCM via `SubtleCrypto`, sessão por aba em `sessionStorage`. (Substituído pelo Supabase Auth na Etapa 9.)

### Etapa 6.1 · Painel de login OTP
PIN fixo em 6 dígitos. Caixas OTP-style com navegação automática. Layout duas colunas (painel da marca + formulário).

### Etapa 6.2 · Portfólio e menu mobile
Painel superior do portfólio em desktop (saldo à esquerda, gráfico à direita). Chip de moeda no celular (cicla R$ → US$ → ₿). Avatar no topo mobile abre o menu sanduíche. "Sair" no rodapé do menu.

### Etapa 6.3 · Fix do header e lançamentos mobile
Cabeçalho do celular sem sobreposição. "Seus lançamentos" na página da moeda: valor quebra para segunda linha (`com-valor`).

### Etapa 7 · Backup
Exportar portfólio como JSON (`v1` versionado). Importar com prévia. Snapshot antes de importar (`KOIN_BACKUP_SNAPSHOT_<userId>`), botão "Desfazer". Formato preparado para v2 multi-portfólio.

### Etapa 7.1 · Ajuste nos lançamentos mobile
CSS fino no quebra de linha de "Seus lançamentos". Meta tags de compatibilidade PWA na `<head>`.

### Etapa 7.2 · Rendimento e detalhe de lançamentos
- **Novo tipo RENDIMENTO:** staking, DeFi, mining e cashback. Badge verde-água suave.
- **Remoção da página "Sistema Visual".**
- **Tooltip `?`** ao lado de "Operação" na gaveta.
- **Campo "Nota (opcional)"** na gaveta.
- **Gaveta mais larga** no desktop (600px).
- **Seletor de operação no celular** (`<select>`).
- **Gaveta de detalhe** (somente leitura): clicar na linha abre com botões Editar e Excluir.
- Tabela de lançamentos: 6 colunas (taxas e lucro realizado vão para a gaveta de detalhe).

### Etapa 7.3 · Ajustes no plano MD
Atualização do CLAUDE.md. Remoção do bloco de comentário HTML `<!-- GUIA DE MANUTENÇÃO -->` do `index.html`.

### Etapa 7.4 · Filtro por tipo na página de lançamentos
Botões segmentados no desktop, `<select>` no celular. Filtros: Todas, Compra, Venda, Entrada, Saída, Conversão, Rendimento. Atualização parcial do DOM (`atualizarFiltroLanc`).

### Etapa 8 · Busca de moeda fora do top 100
- Campo de busca na gaveta de lançamento que aceita moedas além das 100 do pacote diário.
- Moeda já cadastrada no `BANCO.moedas` sempre disponível, mesmo que saia do top 100.
- Busca pelo símbolo/nome com sugestões; confirma existência do par Binance antes de aceitar.

### Etapa 9 · Supabase Camada 1 — autenticação
- **Login e cadastro** via Supabase Auth (e-mail + senha). PIN local substituído.
- **Sessão persistente** entre aberturas: JWT guardado pelo supabase-js.
- **Nome do perfil** em `user_metadata` (campo `nome`).
- **supabase-js** carregado via CDN (UMD), `SUPABASE_URL` e `SUPABASE_ANON_KEY` embutidos. Anon key público por design: segurança via RLS.
- Tela de entrada: painel da marca à esquerda, formulário à direita.

### Etapa 9.1 · Tabelas SQL no Supabase
- **`transacoes`:** `id`, `user_id` (FK → `auth.users`, cascade delete), `tipo`, `moeda_id`, `quantidade`, `preco_unitario`, `taxas`, `data`, `descricao`, `moeda_destino_id`, `quantidade_destino`. Índice em `(user_id)`.
- **`moedas_conhecidas`:** PK composta `(id, user_id)`. Cache permanente de `simbolo`, `nome`, `logo`.
- **RLS ativada em ambas:** `using (auth.uid() = user_id)`.

### Etapa 9.2 · Banco assíncrono — lançamentos no Supabase
- `carregarBanco()` busca `transacoes` e `moedas_conhecidas` do Supabase.
- `salvarLancamento`, `editarLancamento`, `excluirLancamento` operam diretamente no Supabase.
- Motor de cálculo não alterado — opera sobre lista recebida como dado puro.
- `verificarMigracao` detecta dados no localStorage e oferece migração via `window.confirm` (**limitação:** pode não aparecer no standalone — ver pendências).

### Etapa 9.3 · Modo offline + abertura instantânea
- `carregarBanco()` lê localStorage primeiro (síncrono) e exibe dados imediatamente.
- Confirma com Supabase em segundo plano; se diferir, atualiza e redesenha.
- Erros de rede silenciosos — app funciona offline com os dados do último acesso.

### Etapa 9.4 · Cloudflare Worker para CoinGecko
- `COINGECKO` aponta para `https://teste-koin.correiaerisvaldo.workers.dev`.
- Chave Demo da CoinGecko vive como variável de ambiente no Worker, nunca no `index.html`.
- Mesma regra de 1 chamada por dia; o Worker entrega resposta em cache para o restante do dia.

### Etapa 9.5 · Refinamento de storage
Ajustes finos no ciclo de leitura e gravação do banco local/Supabase.

### Etapa 10 · Balanceamento
- Página `/balanceamento`: alocação atual (%) vs. target (%), desvio, simulador de aporte.
- Dois modos: **%** (soma 100%) ou **nota** (0–10 por moeda, normalizado).
- Targets em `portfolio_targets` do Supabase, cacheados localmente em `TARGETS_<userId>`.
- `carregarTargets()` lê cache local primeiro, confirma com Supabase em segundo plano.
- Backup exporta `targets` junto com lançamentos.
- `/objetivos` continua como placeholder "em breve".

### Etapa 10.1 · Targets reais via Supabase
Tabela `portfolio_targets`: `user_id`, `moeda_id`, `peso_alvo`, `modo`. RLS ativa. Toast quando lançamento novo é feito em moeda sem target.

### Etapa 11 · Objetivos
- Página `/objetivos`: metas de patrimônio com progresso em % e previsão de conclusão.
- Cada objetivo tem nome (opcional), valor alvo e aporte mensal estimado.
- Gaveta `#gaveta-objetivos` para criar e editar; confirmação nativa para excluir.
- Dados em `objetivos` no Supabase: `user_id`, `nome`, `valor_alvo`, `aporte_mensal`. RLS ativa.
- `_objCalcularPatrimonio()` soma saldos ao vivo via Binance para calcular progresso.

### Etapa 12 · Pendências v1.0
- **Modal nativo** (`abrirConfirmacao`): substitui todos os `window.confirm`; funciona em modo standalone.
- **Página de perfil** em Ajustes: campos para alterar nome de exibição e senha via `supabase.auth.updateUser`.
- **Lightweight Charts offline**: bundle baixado para `assets/lightweight-charts.standalone.production.js`; referenciado localmente; adicionado ao `ASSETS_ESTATICOS` do SW.
- **Registro de lançamento em USD**: campo de preço com toggle R$/US$; taxa de câmbio capturada no momento do lançamento; recalcule automático ao editar; detalhe exibe preço original em US$.

### Etapa 13 · Simulador de Aporte
- Página `/simulador` no grupo Análise do menu.
- Botão "Simular aporte" abre gaveta `#gaveta-sim` com dois campos: valor do aporte (na moeda de exibição atual) e filtro de upside (%, padrão 12%, editável — não salvo no banco).
- Algoritmo `calcularSimulador(aporte, filtroUpside, linhas, targets, modo)` puro:
  1. Calcula `novoTotal = saldoTotal + aporte`.
  2. Para cada ativo com target: `delta = novoTotal × (targetPct / 100) − saldoAtual`.
  3. Filtra por PM: exclui ativos onde `precoAtual > PM × (1 + filtroUpside / 100)`. Ativos com PM=0 (custo zero) são sempre elegíveis.
  4. Ordena elegíveis por `delta` desc, limita a 4.
  5. Distribui o aporte proporcionalmente aos deltas dos top 4.
- Resultado renderizado na página com PM, preço atual, upside e alocação atual → target.
- Ativos bloqueados exibidos com motivo (upside acima do filtro).
- Disclaimer fixo: "não é recomendação de investimento".
- Sem banco de dados — parâmetros são efêmeros (resetam a cada sessão da gaveta).

---

## Entregues no v0.2.0-beta (sem número de etapa próprio)

### PWA
- `manifest.json` + `sw.js` + ícones 72–512px (maskable em 192 e 512).
- Service worker cache-first para assets estáticos; APIs externas (Supabase, Binance, Cloudflare, CDNs) vão direto à rede.
- `navigator.serviceWorker.register('./sw.js')` no fim do script (fora do IIFE).
- `skipWaiting()` + `clients.claim()` para ativação imediata.
- `theme-color`, `apple-mobile-web-app-capable`, modo standalone.

### Tema claro
- Tokens completos em `:root[data-tema="claro"]`. Toggle em Ajustes. `aplicarTema()` aplica no `<html>`.
- Persiste em `armazem` (`KOIN_PREFS`).

---

## Entregues no v0.3.0-beta

### Botão de instalação do PWA
- `_promptInstalacao` captura `beforeinstallprompt` (fora do IIFE, antes de tudo).
- `instalarPWA()` ativa o prompt nativo; sem prompt, exibe instrução manual via `avisar`.
- Botão "Instalar KoinFin" em Ajustes usa `data-pwa-instalar`.

### Banner de atualização do SW
- `reg.addEventListener('updatefound')` detecta novo SW instalado.
- Quando o novo SW ativa (`statechange === 'activated'`), `#banner-atualizacao` aparece.
- Botão "Atualizar" faz `location.reload()`; botão "✕" descarta o banner.
- Para disparar: subir nova versão com `CACHE` diferente no `sw.js`.

### Ordenação por lucro no portfólio
- Coluna "Lucro" da tabela de ativos ganhou seta de ordenação.
- Estado padrão: ⇅ cinza (ordena por saldo). Clique: ▼ latão (maior → menor lucro). Clique novamente: ▲ latão (menor → maior lucro). Terceiro clique: volta ao padrão.
- DOM-based: `data-lucro-sort` e `data-saldo-sort` em cada `<tr>`. `atualizarOrdemPortfolio()` reordena o tbody sem redesenhar a página.
- `atualizarPortfolioTela` mantém `data-lucro-sort` fresco a cada tick do WebSocket.
- `lucroSortVal(x)`: moeda sem saldo vai para o fim; custo zero ordena pelo saldo.

---

## Pendências para v1.0

~~Todas as pendências originais foram resolvidas nas Etapas 11–13.~~

Pendências restantes antes do lançamento público:

---

## Próximas etapas (pós-v1.0)

- **Seletor de portfólio:** múltiplos portfólios por conta. Seletor no cabeçalho da página Portfólio.
- **Alertas de preço:** no app (toast) e Push Notifications quando instalado.
- **Exportação para IR:** CSV com ganhos realizados por ano.
- **Importação automática:** leitura de extrato de corretoras (Binance, Foxbit).

---

## Antes de publicar com URL definitiva

1. ~~**Chave da CoinGecko no código:**~~ resolvido na Etapa 9.4 — chave no Worker.
2. ~~**Lightweight Charts offline:**~~ resolvido na Etapa 12 — bundle local em `assets/`.
3. ~~**Testar pelo endereço publicado:**~~ resolvido — app já está no ar.
4. ~~**Página "Sistema visual" no menu:**~~ resolvido na Etapa 7.2.
5. ~~**Rodapé "dados só no aparelho":**~~ resolvido — rodapé simplificado, Ajustes informa nuvem.
6. ~~**`window.confirm`:**~~ resolvido na Etapa 12 — `abrirConfirmacao` nativa.
7. **Chave CoinGecko nova:** a chave atual apareceu em commits anteriores antes do Worker existir. Gerar nova no painel da CoinGecko e atualizar no Worker antes do lançamento público.

---

## Identificação e sincronização

Decisão tomada em 29/09/2026 e implementada na Etapa 9: **Supabase Auth (e-mail + senha)**.

- O PIN local da Etapa 6 foi substituído pela senha do Supabase.
- O layout de tela dividida (painel da marca + formulário) foi aproveitado.
- Dados migrados para o Postgres do Supabase na Etapa 9.2. Cache local persiste para abertura instantânea e modo offline.
- **Hospedagem:** app publicado e no ar. Cloudflare Worker já em uso.

---

## Estrutura do repositório

```
koin/
  index.html            (single-file: HTML + CSS + JS)
  manifest.json         (PWA manifest)
  sw.js                 (service worker)
  assets/               (ícones PNG: 16, 32, 48, 72, 96, 128, 144, 152, 180, 192, 384, 512)
  CLAUDE.md             (este arquivo)
```

Um commit por etapa (ou por ajuste `N.x`), com a tag no título: `ETAPA 2: página da moeda com gráfico interativo`.
