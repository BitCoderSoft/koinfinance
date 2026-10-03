# KoinFin

Gestor de portfólio de criptomoedas desenvolvido pela **BitCoderSoft**.

Acompanhe suas posições, registre compras, vendas, entradas e conversões, e visualize a evolução do seu patrimônio em tempo real.

---

## Versão atual: v0.1.0-beta

Esta é a primeira versão pública do KoinFin, liberada para validação. O app está funcional para uso real, com dados persistidos na nuvem e acessíveis de qualquer dispositivo.

---

## Infraestrutura

**Autenticação e banco de dados**
Login por e-mail e PIN, com sessão persistente entre dispositivos. Todos os lançamentos ficam armazenados no Postgres via Supabase, com isolamento por conta e políticas de segurança em nível de linha (RLS).

**Segurança de APIs**
As chamadas à API da CoinGecko passam por um Worker do Cloudflare, que mantém as credenciais em variáveis de ambiente seguras, fora do código do cliente.

**Modo offline**
Uma cópia local dos dados garante acesso ao portfólio mesmo sem conexão. A sincronização com a nuvem acontece em segundo plano quando a conexão volta.

---

## Próximas atualizações (antes da v1.0.0)

- Análise e balanceamento da carteira, com alocação ideal e simulador de aporte
- Publicação como PWA, com suporte a instalação em dispositivos móveis

---

© 2026 BitCoderSoft
