# Agenda Éden

Agenda individual com painel protegido por login e uma página pública de agendamento para cada usuário.

## Funcionalidades

- Calendário semanal e diário, navegação de datas e calendário mensal.
- Expediente configurável por dia da semana, duração de 15 a 120 minutos e pausa de reservas online.
- Reservas públicas e manuais, bloqueios de horário e cancelamento pelo responsável.
- Link exclusivo para clientes. O cliente não precisa de conta.
- Confirmação na tela e arquivo ICS para adicionar à agenda pessoal.
- Login por código enviado ao e-mail, após configuração do Supabase.
- Confirmações por e-mail para cliente e responsável, após configuração do Resend.
- Persistência em D1 e reservas concorrentes protegidas por transação e índice único a cada 15 minutos.
- Horário de Brasília, datas futuras até 90 dias.

## Uso

1. Abra o site e entre pelo código enviado ao e-mail. Durante a configuração dos serviços, use a opção de vincular agenda existente para continuar com o acesso anterior.
2. Em Disponibilidade, informe o nome do atendimento, a duração, o local e os horários.
3. Use Compartilhar link para copiar o endereço que será enviado aos clientes.
4. Acompanhe as reservas na Minha agenda. Clique em uma reserva para consultar os contatos ou cancelá-la.

Configure o login e os envios seguindo [docs/email-setup.md](docs/email-setup.md). O envio de e-mail depende de remetente verificado e serviços configurados. Não há sincronização com Google Calendar ou WhatsApp. O cancelamento deve ser comunicado ao cliente pelo responsável.

## Desenvolvimento local (Node 22.13 ou superior)

```powershell
npm ci --prefer-offline --no-audit --no-fund
npm run build
node --import ./scripts/sites-env.mjs ./node_modules/wrangler/bin/wrangler.js d1 execute DB --local --config dist/server/wrangler.json --persist-to .wrangler/state --file drizzle/0000_cool_mojo.sql
node --import ./scripts/sites-env.mjs ./node_modules/wrangler/bin/wrangler.js d1 execute DB --local --config dist/server/wrangler.json --persist-to .wrangler/state --file drizzle/0001_reflective_peter_parker.sql
npm run dev
```

Aplique a migração apenas uma vez por banco local novo. A URL local é exibida no terminal. O login local simulado usa `seedy@sites.test`; a simulação não entra na publicação.

## Verificação

```powershell
npx tsc --noEmit
node scripts/smoke-test.mjs
node scripts/email-test.mjs
npm run build
```

O teste funcional requer o servidor local e um banco local vazio de agendamentos. Cria e remove seus próprios registros locais; não atua na produção. Valida concorrência, rollback de conflitos, autenticação, privacidade, bloqueios, cancelamento, datas inválidas, pausa e configurações persistentes.

As rotas HTTP e o build foram verificados. Não houve navegador conectado disponível para validação visual ou execução do WebMCP neste ambiente. O WebMCP opcional apenas navega para uma data e é ignorado por navegadores sem suporte.

## Arquitetura

Vinext / React / TypeScript, Cloudflare Worker, D1 e migrations Drizzle. As consultas usam parâmetros vinculados. Cada usuário autenticado acessa apenas sua agenda; as APIs públicas retornam somente informações do serviço e horários livres. As reservas e os bloqueios inserem todos os intervalos em um batch transacional para evitar sobreposições, mesmo com requisições simultâneas.

`.openai/hosting.json` identifica o Site e declara o banco DB. Credenciais não fazem parte do código. Sites administra os recursos e aplica as migrações na publicação.
