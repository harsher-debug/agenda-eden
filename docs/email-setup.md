# Login por e-mail e notificações

O código já contém login por código de seis dígitos e confirmações de reservas para cliente e responsável. A ativação depende das configurações abaixo. Não existe envio simulado em produção. Se os serviços não estiverem configurados, a interface informa essa condição e mantém o acesso anterior para as agendas existentes.

## Supabase

1. Abra um projeto no Supabase. Em Authentication > Sign In / Providers, habilite Email.
2. Em Authentication > Email Templates > Magic Link, use um modelo com `{{ .Token }}` para enviar o código de seis dígitos, em vez de um link.
3. Configure a validade do código (recomendado: 10 minutos). Mantenha os limites de tentativas do provedor e ative a proteção contra abuso conforme o volume.
4. Em URL Configuration, informe `https://agenda.edendemonolatry.com` como Site URL.
5. Em Project Settings > API, copie a URL e a chave publishable/anon. O aplicativo não precisa de `service_role` nem acesso administrativo ao banco Supabase.
6. Configure SMTP próprio para os códigos chegarem a usuários externos. O SMTP padrão do Supabase tem restrições e não atende ao uso público em produção. Pode ser usado o SMTP do Resend.

Modelo do código:

```html
<h2>Seu código de acesso à Agenda Éden</h2>
<p>Digite este código na agenda: <strong>{{ .Token }}</strong></p>
<p>Se você não solicitou o acesso, ignore esta mensagem.</p>
```

## Resend e Cloudflare

1. Crie uma conta no Resend e adicione um domínio de envio, preferencialmente um subdomínio exclusivo, como `avisos.edendemonolatry.com`.
2. Adicione na Cloudflare exatamente os registros DNS exibidos pelo Resend. Preserve o DNS do site, da agenda e de qualquer serviço de e-mail existente.
3. Aguarde o domínio ficar verificado e crie uma API key com permissão de envio.
4. Defina o remetente, por exemplo `Agenda Éden <agendamentos@avisos.edendemonolatry.com>`.
5. Para o SMTP do Supabase, use os parâmetros fornecidos pelo Resend, com a API key como senha. Esta configuração é feita no painel Supabase, não no código.

## Configuração do aplicativo

Copie `.env.example` para `.env` e preencha as quatro variáveis. `.env` é ignorado pelo Git. Nunca salve chaves no código, no README ou em commits. Reinicie o localhost após configurar.

Na publicação, configure as mesmas variáveis no ambiente da hospedagem Sites. Marque `RESEND_API_KEY` como segredo e publique uma nova versão para aplicar o ambiente.

## Preservar agendas existentes

Antes do primeiro login por e-mail, o responsável deve entrar uma vez pela opção **Já tenho uma agenda criada anteriormente > Vincular agenda existente**. A API vincula a agenda ao e-mail autenticado pelo acesso antigo. Depois, o Supabase deve verificar o mesmo e-mail para abrir essa agenda, mantendo ID, link e reservas. Um e-mail diferente cria uma agenda separada. Não atribua uma agenda existente a um e-mail informado sem verificação.

## Funcionamento e limites

- Clientes continuam reservando sem criar conta.
- O Supabase verifica o código. O navegador recebe apenas um cookie de sessão HttpOnly, com SameSite=Lax e Secure em HTTPS. A sessão vale sete dias; o banco guarda somente o hash do token. Tokens Supabase não são enviados ao navegador nem salvos.
- Agendas são acessadas pelo usuário autenticado ou pelo e-mail previamente verificado e vinculado. Sessões e códigos têm validação no servidor, proteção de origem e limites de tentativas.
- Reserva, bloqueio dos intervalos e registros de e-mail são gravados na mesma transação. Falha de envio não desfaz a reserva.
- Resend recebe uma confirmação para o cliente e um aviso para o e-mail verificado do responsável. O aplicativo informa se o envio foi aceito pelo provedor; isso não garante entrega na caixa de entrada.
- Mensagens pendentes podem ser reenviadas em Disponibilidade > Notificações por e-mail, dentro de 23 horas. A chave de idempotência protege novas tentativas nesse período. Mensagens antigas exigem contato manual.
- Cancelar uma reserva remove os avisos que ainda não foram enviados. Não há aviso automático de cancelamento, reagendamento nem lembrete agendado nesta versão.

## Validação antes da ativação

Teste um código real, código inválido, encerramento da sessão, preservação da agenda antiga e isolamento entre dois usuários. Faça uma reserva com um e-mail de teste e confirme as mensagens do cliente e do responsável no Resend. Não considere o envio ativo antes da validação do domínio e de um teste real.

Referências: https://supabase.com/docs/guides/auth/auth-email-passwordless, https://supabase.com/docs/guides/auth/auth-smtp, https://resend.com/docs/dashboard/domains/introduction.
