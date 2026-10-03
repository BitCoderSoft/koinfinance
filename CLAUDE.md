# Koin · gestor de portfólio cripto

Projeto da BitCoderSoft. Nome provisório: **Koin** (pode mudar; trocar em `APP.nome` e no `<title>`).

App web de gestão de portfólio só de criptomoedas, pensado para virar PWA instalável. Inspiração visual e de produto: CoinMarketCap, CoinGecko e as telas de mercado da Binance. Destino: publicação no portfólio da BitCoderSoft.

Este documento resume o que foi construído até aqui (etapas 0–9.1, iniciadas no claude.ai e continuadas no VS Code) e o plano das próximas etapas.


## Situação atual

| Item | Estado |
|---|---|
| Arquivo principal | `koin.html` (single-file: HTML + CSS + JS, sem build) |
| Versão | `0.1.0` (vira `1.0.0` ao fechar a Etapa 8) |
| Etapas concluídas | 0 (fundação), 0.1 (navegação no topo), 1 (mercado), 1.1 (CoinGecko com chave), 1.2 (tabela larga), 2 (página da moeda), 2.1 (sem chave do usuário), 3 (motor e lançamentos), 4 (portfólio), 4.1 e 5.1 (ajustes do relatório de testes), 5 (responsivo no celular), 6 (identificação local), 6.1 (painel de login OTP), 6.2 (portfólio e menu mobile), 6.3 (header e lançamentos mobile), 7 (backup), 7.1 (lançamentos mobile), 7.2 (rendimento e detalhe de lançamentos), 7.3 (ajustes do plano MD), 7.4 (filtro de lançamentos), 9 (Supabase Camada 1 — auth), 9.1 (Supabase Camada 2a — tabelas SQL) |
| Próxima etapa | 9.2 (Supabase Camada 2 — migrar lançamentos para Postgres, async), depois seletor de portfólio, demais extras (balanceamento, objetivos, alertas) e Etapa 8 (PWA) |
| Pendência aberta | — |

---

## Origem

O Koin nasceu da parte cripto do **Dash Finance**, painel pessoal de investimentos (ações, FIIs, BDRs e cripto) do mesmo autor, também single-file. Boa parte da lógica foi testada lá com dados reais. O Dash Finance é de uso pessoal e fica congelado em ~70%; o Koin é o produto publicável.

O `dash-finance.html` foi anexado no chat na Etapa 3 e o motor cripto já foi portado. **O arquivo original contém tokens reais (brapi e bolsai) no código: nunca colocar ele no repositório.** Se precisar dele de novo (Balanceamento e Objetivos, Etapa 7, e Backup, `[BACKUP v1]`), colocar uma cópia limpa (sem tokens) em `referencia/`.

---

## Decisões de produto

- **Só cripto.** Nada de bolsa.
- **Identificação:** perfil + PIN local na Etapa 6; migrada para **Supabase Auth** na Etapa 9 (e-mail e senha, sessão persistente entre aberturas). Sincronização de dados entre dispositivos chega com a Etapa 9.2.
- **Moeda de exibição:** Real (padrão), Dólar ou Bitcoin. Tudo é guardado e calculado em **reais**; a conversão acontece só na hora de mostrar.
- **Tema escuro primeiro.** Os tokens do tema claro já estão escritos (comentados em `:root[data-tema="claro"]`), para ligar numa etapa futura.
- **Primeiro a web larga**, depois o responsivo (Etapa 5), identificação (Etapa 6), os extras (Etapa 7) e o PWA (Etapa 8).

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

- **Numeração das etapas:** quando o autor pede pra adiantar uma etapa, ela **ocupa o lugar na ordem** e as demais descem (as etapas nunca pulam número). O número novo vale no commit, no CLAUDE.md e nas tags `[ETAPA N]` do código. A ordem pode mudar de novo: o que está adiante pode ficar pra depois ou ganhar outras prioridades. Ajuste `N.x` continua sendo ajuste de uma etapa.
- **Tags nos comentários:** toda mudança leva `[ETAPA N]` (ou `[ETAPA N.x]` para ajuste). Herdado do Dash Finance leva `[HERANÇA]`. O guia no topo do HTML lista o histórico.
- **Links internos sem `href`:** use `<a role="link" tabindex="0" data-rota="/rota">`. O preview do claude.ai trata qualquer `href` como link externo. Navegar por código: `navegar('/rota')`.
- **Formulários sem submit nativo:** o preview bloqueia `<form>` antes do evento `submit`. Botões `type="button"` com `data-*` e tratamento no `click`; Enter tratado no `keydown`. (Na Etapa 3 a gaveta de lançamento seguiu isso: `data-lanc-salvar` no clique e Enter no `keydown`.)
- **Armazenamento só por `armazem`**, nunca `localStorage` direto. Chaves com prefixo `KOIN_` (automático).
- **Notação brasileira:** vírgula nos decimais, ponto nos milhares. Sempre pelos formatadores.
- **Formatação humana do código:** uma propriedade CSS por linha, blocos separados, comentários explicando o porquê. Nada de CSS compactado em uma linha (o código é inspecionável num site publicado).
- **Textos da interface:** português simples, frase em caixa normal, sem travessão separando ideias, sem frases de efeito. Botão diz o que faz ("Salvar chave", não "Enviar").
- ~~**Página "Sistema visual"**~~ removida na Etapa 7.2 (andaime de desenvolvimento, não faz sentido exposta ao usuário).

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
[29/09/2026] Via curl, com a chave Demo, o `/coins/markets` responde 200 com `access-control-allow-origin: *` (CORS liberado). Sem chave dá 403. **Confirmado no navegador real** (relatório de 29/09/2026, Android): a CoinGecko responde direto do arquivo, com logos e minigráficos, e o WebSocket da Binance atualiza o preço ao vivo. O risco que sobra é só o de **cota** (ver "Antes de publicar"), não o de acesso.

Histórico do teste original:
Testado só com respostas simuladas no formato das documentações. Falta confirmar **no navegador real** se a CoinGecko aceita chamadas direto do arquivo (CORS). Como checar: abrir o Mercado; se a tabela vier com logos e minigráficos, está ok; se aparecer "Modo simplificado", a CoinGecko recusou (ver o motivo no console, F12). Se for bloqueio de origem, testar servindo por servidor local (`python -m http.server`) antes de decidir outro caminho.

---

### Etapas 4.1 e 5.1 · Ajustes do relatório de testes (entregues)
Origem: relatório de testes de 29/09/2026 (prints do Junior num Android, Chrome, e análise do arquivo). Nenhum erro de JavaScript nos testes. Ajustes de portfólio levam `[ETAPA 4.1]` e os de celular e visual `[ETAPA 5.1]`. O relatório usava a numeração antiga (6.1 e 4.1); vale a numeração deste documento.
- **Topo fixo** em todas as telas e tamanhos: `position: fixed` com `--topo-total` (altura, borda e notch) como `padding-top` da casca. Sticky foi abandonado porque para de funcionar quando um ancestral tem `overflow`. Menu sanduíche e gaveta seguem por cima (z-index maior).
- **Bolinhas nos cartões de destaque** (celular): uma por cartão, a do cartão à vista acende em latão (`IntersectionObserver`), toque leva ao cartão. Rolagem com encaixe (`scroll-snap`, `scroll-padding`). Somem no computador.
- **Gráficos no celular:** fonte dos eixos 10px (12px no computador) e escala compacta (`formatarEixo`: sem centavos acima de 1.000, "447,5 mil" acima de 100 mil). O valor exato segue na leitura do cursor.
- **Escala do gráfico do portfólio** (`autoscalePortfolio`): enquadra as duas linhas (patrimônio e custo) e impõe faixa mínima de 2% do valor. Corrige a linha de custo que sumia e a queda "dramática" de centavos em carteira pequena.
- **Seletor de moeda em Ajustes** sempre sincronizado (`atualizarSeletoresMoeda()` no fim de `desenhar`).
- **Destaques do Mercado:** símbolo com reticências e preço sem quebra (nada se sobrepõe), valores do cartão "As 100 maiores" em uma linha só (`nowrap`).
- **Rosca com uma moeda:** anel inteiro, sem fenda (`respiroRosca`).
- **Portfólio vazio:** sem indicador "Conectando…" (também some quando tudo foi vendido) e só o botão "Novo lançamento" do cartão vazio.
- **Sinal negativo antes do símbolo:** "-R$ 0,09" (`formatarMoeda`, R$, US$ e ₿; valor que arredonda para zero não leva sinal).
- **Textos:** "#1 no ranking" no lugar de "Posição #1"; seletor de ordem com rótulo "Ordenar por" e opção "Ranking"; botão do Portfólio vira "Lançar" no celular; "sem vendas ainda" como legenda pequena.
- **Etiquetas de operação:** compra e entrada em cinza cheio, venda e saída só com contorno, conversão azul. O latão fica só para marca e ação principal. **Decisão:** o relatório sugeria verde e vermelho (como no Dash Finance), mas isso contraria a regra do Koin (verde e vermelho só para alta e queda).
- **Página da moeda no celular:** períodos e tipo do gráfico na mesma linha (Linha e Velas viram ícones).
- **Logo do TradingView** removido de cima dos gráficos (`layout.attributionLogo: false`, existe na 4.2.3) e a **atribuição** foi para o rodapé ("Gráficos: TradingView Lightweight Charts", com link), como a licença pede.
- **Não feito, de propósito:** o relatório pediu trocar o azul do gráfico e da rosca (item 3.6). O azul é o slot 1 da paleta categórica **validada** com o validador da skill `dataviz` no fundo escuro (não é acidente). Reavaliar só se o autor quiser: patrimônio em latão ou texto exigiria revalidar a rosca.

### Etapa 5 · Responsivo no celular (entregue, adiantada)
Pedido do autor: testar o app no navegador do celular antes dos extras. Ainda **não é PWA**. Vale abaixo de **768px** (mesmo ponto do Dash Finance, `[MOBILE v1]`); o computador não mudou. Bloco `CELULAR` no fim do `<style>` (precisa vir depois das regras do computador).
- **Como testar no celular:** servir a pasta pela rede (`python3 -m http.server 8000 --bind 0.0.0.0`) e abrir `http://<IP do Mac>:8000/koin.html` no celular, na mesma Wi-Fi. Os dados ficam por endereço (não misturam com o `file://`).
- **Navegação por menu sanduíche** (sem barra inferior, por enquanto; decisão do autor): abre por cima da tela e fecha no X, no Esc ou ao escolher uma página. É montado das mesmas listas `NAV` e `NAV_CONTA` (`menuMobileHTML`), com a página atual acesa. Topo: marca, moeda de exibição (R$, US$, ₿), ícone de busca (abre uma 2ª linha) e sanduíche. Pulso do BTC e engrenagem somem (Ajustes e Sistema visual vão para o menu).
- **Mercado enxuto** (referência: CoinMarketCap mobile): cada moeda é uma linha de ~58px com estrela, posição, logo, nome com o símbolo embaixo e, à direita, preço com a variação 24h logo abaixo. Colunas 1h, 7d, volume, valor de mercado e minigráfico ficam só na página da moeda. Toque na linha inteira abre a moeda (a estrela tem ação própria). Abas rolam na horizontal e a ordem vem de um seletor (`ORDENS_MOBILE`), porque o cabeçalho da tabela some. Destaques viram uma faixa que rola na horizontal.
- **Portfólio:** cartões em 2 colunas, gráfico mais baixo, legenda da rosca embaixo, tabela vira lista (moeda à esquerda, saldo e lucro à direita; toque abre a moeda).
- **Lançamentos:** cada um vira um cartão (operação e data, moedas, quantidade e valor, lucro realizado, editar e excluir). **Gaveta de lançamento em tela cheia** com rodapé fixo.
- **Moeda:** cabeçalho empilhado, gráfico de 280px, estatísticas em 2 colunas, conversor em coluna.
- Campos com 16px (evita o zoom do iPhone), respiro de `safe-area`, sem rolagem horizontal da página (verificado a 390px).
- Fora do escopo por enquanto: botão flutuante "+", barra inferior, Ajustes e Sistema visual refinados, gestos, tela de instalação (Etapa 8).
- Ideia registrada: o cabeçalho da tabela do Mercado voltaria a ser ordenável por toque se o seletor incomodar.

### Etapa 6 · Identificação (entregue)
Múltiplos perfis por dispositivo. Cada perfil tem nome de usuário (sem espaços), e-mail e PIN (4 ou 6 dígitos numéricos). Dados de carteira e preferências ficam em chaves separadas por perfil (`KOIN_BANCO_<id>`, `KOIN_PREFS_<id>`).
- **PIN criptografado localmente:** AES-GCM via `SubtleCrypto`, chave derivada do e-mail com PBKDF2 (100 mil iterações, SHA-256). O PIN é o texto cifrado; recuperação = decifrar com o mesmo e-mail e mostrar o PIN para quem conhece o endereço.
- **Sessão por aba:** `sessionStorage` (`KOIN_SESSAO`). Dura enquanto a aba estiver aberta; fechar o navegador pede PIN novamente. Reiniciar a página dentro da mesma aba mantém a sessão.
- **Fluxo:** ao abrir, `carregarArmazenamento()` verifica se há sessão válida. Se sim, entra direto no app (`iniciarApp()`). Se não, exibe a tela de entrada sobre o `#app`.
- **Tela de entrada:** lista de perfis em cartões com avatar colorido; ao clicar num perfil aparece o campo de PIN. Botão "Novo perfil" leva ao cadastro. "Esqueci meu PIN" pede o e-mail e mostra o PIN decifrado.
- **Avatar:** círculo colorido com a inicial do nome; cor derivada do nome por hash simples (paleta de 5 cores de `AVATAR_CORES`).
- **Info do usuário na casca:** avatar + botão "Sair" no topo (computador, `.usuario-topo`); nome do perfil no cabeçalho do menu sanduíche (celular).
- **`sair()`:** encerra sessão, limpa sockets/timers, redesenha a tela de entrada.
- **Mensagem de PIN esquecido:** aviso visível na tela de cadastro pedindo para guardar bem o PIN.

### Etapa 6.1 · Ajustes no painel de login (entregue)
Origem: relatório de testes de 29/09/2026.
- **PIN fixo em 6 dígitos** para todos os perfis (removida a escolha de 4 ou 6 dígitos pelo usuário; `PIN_DIGITOS = 6`).
- **Caixas OTP-style** para entrada do PIN: 6 campos individuais com navegação automática, paste e limpeza (`_otpHTML`, `ligarOTP`). Substituiu o campo de texto único.
- **Layout em duas colunas:** painel da marca à esquerda (fundo, anel decorativo, logotipo) e formulário à direita. No celular o painel da marca colapsa e só o formulário aparece.

### Etapa 6.2 · Ajustes no portfólio e menu mobile (entregue)
- **Painel superior do portfólio em desktop:** saldo e cards à esquerda (2×2), gráfico de evolução à direita.
- **Chip de moeda no celular:** botão único (~38px) no topo que cicla pela próxima moeda disponível (R$ → US$ → ₿ → R$). Substituiu o seletor de 3 botões, que era uma das causas do ícone de sanduíche ficar oculto em telas estreitas (`atualizarChipMoeda`, `proximaMoeda`).
- **Avatar no topo mobile:** toque no avatar abre o menu sanduíche (segunda forma de abrir, pedido do relatório de testes).
- **"Sair" no rodapé do menu mobile:** saiu do topo e foi para o rodapé do menu sanduíche junto com o nome do perfil.

### Etapa 6.3 · Fix do header e lançamentos mobile (entregue)
- Ajustes finos no cabeçalho do celular para acomodar marca, chip de moeda, ícone de busca e sanduíche sem sobreposição.
- **"Seus lançamentos" na página da moeda (celular):** linhas de compra/venda com preço recebem classe `com-valor` e no celular o valor quebra para uma segunda linha, evitando que "R$" fique de um lado e o número do outro.

### Etapa 7 · Backup — exportação e importação (entregue)
- **Exportar portfólio como JSON** (botão em Ajustes): formato `v1` versionado (`{ versao, app, exportadoEm, usuario, banco, prefs }`).
- **Importar JSON** com prévia antes de confirmar: mostra número de transações, moedas cadastradas e período coberto. A confirmação é uma segunda ação explícita.
- **Snapshot antes de importar** (`KOIN_BACKUP_SNAPSHOT_<userId>`): guarda o estado anterior. Botão "Desfazer última importação" fica visível enquanto o snapshot existir.
- Formato já preparado para v2 (multi-portfólio): ao importar um v1 num sistema futuro com portfólios, será tratado como portfólio único "Principal". Ver memória `project_backup-versioning-plan`.

### Etapa 7.1 · Ajuste nos lançamentos mobile (entregue)
- Continuação da Etapa 6.3 (commit separado): "Seus lançamentos" na página da moeda no celular — ajuste fino de CSS para o quebra de linha funcionar em todos os contextos sem interferência.
- Pequenos ajustes de compatibilidade PWA (meta tags) na `<head>`.

### Etapa 7.2 · Rendimento e detalhe de lançamentos (entregue)
- **Novo tipo RENDIMENTO:** staking, DeFi, mining e cashback. Custo zero, idêntico à ENTRADA no motor (`pernasDaTransacao`, `processarCarteira`, `PRIORIDADE_NO_DIA`). Badge verde-água suave (`--alta` com opacidade baixa).
- **Remoção da página "Sistema Visual"** (andaime de desenvolvimento, não faz sentido exposta ao usuário).
- **Tooltip `?` ao lado de "Operação"** na gaveta de lançamento: painel com descrição dos 6 tipos, abre e fecha por botão.
- **Campo "Nota (opcional)"** na gaveta: texto livre guardado em `registro.descricao`, exibido na gaveta de detalhe.
- **Gaveta mais larga no desktop** (500 → 600px) para os 6 badges de operação caberem em uma linha.
- **Seletor de operação no celular** (`<select>`): substituiu os botões segmentados que não cabiam em larguras pequenas.
- **Gaveta de detalhe (somente leitura):** clicar numa linha da tabela de lançamentos abre a gaveta com todos os campos, botões "Editar" (reabre em modo edição) e "Excluir" (`gavetaDetalheHTML`, `abrirDetalhe`).
- **Tabela de lançamentos simplificada:** colunas Taxas e Lucro realizado removidas da linha (ficam na gaveta de detalhe). Passa de 8 para 6 colunas.

### Etapa 7.3 · Ajustes no plano MD (entregue)
Atualização do CLAUDE.md com o histórico completo das etapas 6.1 a 7.2. Remoção do bloco de comentário HTML `<!-- GUIA DE MANUTENÇÃO ... -->` do `koin.html` (o conteúdo vive agora só no CLAUDE.md, que é o documento canônico do projeto).

### Etapa 7.4 · Filtro por tipo na página de lançamentos (entregue)
- Barra de filtro acima da tabela de lançamentos: botões segmentados no desktop, seletor `<select>` no celular.
- Filtros disponíveis: Todas (padrão), Compra, Venda, Entrada, Saída, Conversão, Rendimento.
- Atualização parcial do DOM ao trocar o filtro: só o `<tbody id="lanc-corpo">` e o contador se redesenham (`atualizarFiltroLanc`), sem rerenderizar a página inteira.
- Estado em memória (`filtroLanc`), persiste enquanto a sessão estiver aberta (o mesmo padrão da aba do Mercado).
- No celular, `ROTAS['/lancamentos'].montar` liga o listener no `<select>` depois do render.

### Etapa 9 · Supabase Camada 1 — autenticação (entregue)
Primeira integração com o Supabase. Lançamentos ainda 100% no localStorage; só a autenticação vai para a nuvem nesta etapa.
- **Login e cadastro** via Supabase Auth (e-mail + senha). O PIN local da Etapa 6 foi substituído por senha gerenciada pelo provedor.
- **Sessão persistente** entre aberturas do navegador: o JWT é guardado pelo supabase-js, sem `sessionStorage` manual.
- **Nome do perfil** em `user_metadata` (campo `nome`). O script de tabela `profiles` + trigger SQL foi descartado — `user_metadata` cobre o caso sem complexidade extra.
- **supabase-js** carregado via CDN (UMD), inicializado com `SUPABASE_URL` e `SUPABASE_ANON_KEY` embutidos no HTML. O anon key é público por design: o que ele acessa é controlado por RLS, não pelo sigilo da chave.
- Tela de entrada com painel da marca à esquerda e formulário à direita (layout herdado do plano para a Etapa 8). No celular o painel colapsa.

### Etapa 9.1 · Supabase Camada 2a — tabelas SQL (entregue)
Infraestrutura de banco de dados criada no Supabase SQL Editor. Nenhum código do app foi alterado ainda; esta etapa é só a estrutura.
- **`transacoes`:** `id` (bigint identity, PK), `user_id` (FK → `auth.users`, cascade delete), `tipo`, `moeda_id`, `quantidade`, `preco_unitario`, `taxas`, `data`, `descricao`, `moeda_destino_id`, `quantidade_destino`. Índice em `(user_id)`.
- **`moedas_conhecidas`:** chave primária composta `(id, user_id)`. Armazena `simbolo`, `nome` e `logo` de toda moeda já lançada — cache permanente, independe do top 100 da CoinGecko.
- **RLS ativada em ambas:** policy `for all using (auth.uid() = user_id) with check (auth.uid() = user_id)`. Cada usuário só lê e escreve os próprios registros.
- Próximo passo: Etapa 9.2 — tornar `lerBanco()` e `gravarBanco()` assíncronas e ajustar todos os callers.

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
- Backup (exportar e importar JSON) continua na Etapa 7. O `BANCO` já está em uma chave só, o que facilita.

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

### Etapa 9.2 · Supabase Camada 2 — código assíncrono
A mudança mais delicada: `lerBanco()` e `gravarBanco()` viram assíncronas e todos os pontos que as chamam precisam ser ajustados.
1. `lerBanco()` → `async lerBanco()`: busca `transacoes` e `moedas_conhecidas` do Supabase.
2. `gravarBanco()` → operações individuais de insert/update/delete na tabela `transacoes`; `moedas_conhecidas` atualizada via upsert.
3. Callers a ajustar: `paginaLancamentos`, `paginaPortfolio`, `lancamentosMoedaHTML`, `salvarLancamento`, `editarLancamento`, `excluirLancamento`, backup.
4. Motor de cálculo não muda: já opera sobre lista de transações recebida como dado puro.
5. Primeira abertura pós-migração: detectar dados no localStorage e oferecer importação para o Supabase.

### Seletor de portfólio (número a definir)
- Seletor no cabeçalho da página Portfólio (não na nav).
- Permite trocar de portfólio/perfil sem sair da tela.
- Portfólios pertencem a um único perfil.

### Demais extras (a numerar)
Backup entregue na Etapa 7. Ainda falta:
- **Balanceamento:** alocação ideal por moeda ou grupo, nota 0 a 10 por moeda, peso ideal, desvio em pontos percentuais, simulador de aporte (só compra, guloso pela maior falta). Vocabulário: "alocação ideal", "nota", "peso ideal", "desvio". A palavra "meta" fica reservada para Objetivos.
- **Objetivos:** patrimônio total, patrimônio numa moeda, com progresso, aporte mensal (informado ou média real) e conclusão estimada. Concluídos guardados com data.
- **Alertas de preço** (no app; notificação de sistema depois do PWA).

### Etapa 8 · PWA
- Separar em `index.html` + `manifest.webmanifest` + `sw.js` + ícones (192, 512, maskable).
- Service worker: cache da casca e das bibliotecas de CDN; dados de mercado com rede primeiro e cache de reserva.
- Tela de instalação, splash, `theme-color`, modo standalone.
- Hospedagem: GitHub Pages (se a chave da CoinGecko for resolvida via Cloudflare Worker) ou Netlify (se preferir Functions serverless para o proxy). Decisão ainda em aberto.
- Versão `1.0.0`.

---

## Antes de publicar (do relatório de testes de 29/09/2026)

Nada disso foi feito ainda. Fazer junto com a Etapa 8 (PWA) ou antes de qualquer publicação:
1. **Chave da CoinGecko no código** (`CG_CHAVE_PADRAO`): publicada, qualquer um copia a chave e todos dividem a cota de 10 mil chamadas por mês do plano Demo (com 1 chamada por dia por aparelho, ~330 usuários diários esgotam o mês). Solução: um intermediário (Cloudflare Worker gratuito) que guarda a chave, busca `/coins/markets` a cada poucos minutos e entrega a resposta em cache; o app chama o Worker, nunca a CoinGecko. **Ao montar o Worker, gerar chave nova e apagar a atual** (ela já apareceu fora do repositório).
2. **Biblioteca de gráficos por CDN** (`LW_URL`, unpkg, já com SRI): para o PWA, incluir o arquivo no cache do service worker (ou servir junto do app), senão o gráfico some offline.
3. **Testar pelo endereço publicado**, não pelo arquivo: abrindo por `content://downloads` cada download novo pode virar outra origem e os lançamentos "somem". Publicar no GitHub Pages (mesmo em rascunho) e testar pela URL. É também pré-requisito do PWA.
4. ~~**Página "Sistema visual":** tirar do menu antes de publicar~~ — **feito na Etapa 7.2** (página removida).
5. **Rodapé "dados só no aparelho":** precisa ser atualizado antes de qualquer publicação pública. Com a Etapa 9.2 os lançamentos passam a ser armazenados no Supabase (nuvem). O texto atual promete privacidade local que não vale mais.

---

## Identificação e sincronização — decisão tomada (registrada em 29/09/2026, implementada na Etapa 9)

A opção escolhida foi a **(b): identificação real com servidor via Supabase Auth.** O rodapé "dados só no aparelho" precisará mudar (ver "Antes de publicar", item 5).

Contexto histórico que levou à decisão:
- **O que o login do Dash Finance era:** usuários e senha no navegador, hash caseiro da senha (não era segurança real), tela dividida (painel da marca à esquerda, formulário à direita). Servia para separar contas no mesmo aparelho; nada saía do aparelho.
- **Decisão de produto original do Koin:** "sem login, dados só no aparelho". Para saber quem usa o app, a identificação precisaria ir para um servidor — o que muda a promessa de privacidade e pede política de privacidade (LGPD).
- **O que foi escolhido:** Supabase Auth (e-mail + senha). Não reaproveitar o hash do Dash Finance. O layout de tela dividida com painel da marca foi aproveitado.
- **O que os dados locais fazem:** continuam no localStorage enquanto a Etapa 9.2 não está pronta; depois migram para o Postgres do Supabase. O backup em arquivo continua como camada extra.
- **Hospedagem:** GitHub Pages ou Netlify, decisão ainda em aberto (ver item 1 de "Antes de publicar").

---

## Sugestão para o repositório

```
koin/
  index.html            (hoje: koin.html; renomear na Etapa 8)
  CLAUDE.md             (este arquivo)
  referencia/
    dash-finance.html   (consulta do motor; sem dados pessoais)
```
Um commit por etapa (ou por ajuste `N.x`), com a tag no título: `ETAPA 2: página da moeda com gráfico interativo`.

