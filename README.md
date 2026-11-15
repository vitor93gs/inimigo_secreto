# Inimigo Secreto

Site em português para organizar vários sorteios privados. O organizador cria um rascunho, compartilha um link de inscrição e aprova ou recusa os pedidos recebidos. Também pode adicionar participantes manualmente. Depois de publicar, compartilha o link de participação. Cada pessoa confirma o email com um link de uso único e sorteia uma pessoa distinta, sem tirar a si mesma.

## Rodar localmente

1. Instale Node.js 20.9 ou superior e rode `npm install`.
2. Crie um cluster MongoDB Atlas. Para enviar links pelo Gmail, ative a verificação em duas etapas na sua Conta Google e gere uma **senha de app**. Não use a senha normal da conta.
3. Copie `.env.example` para `.env.local` e configure os valores. Gere `SESSION_SECRET` com pelo menos 32 caracteres aleatórios. Use seu próprio email em `ADMIN_EMAIL`. O nome da coleção de sorteios é definido por `MONGODB_DRAWS_COLLECTION` (por padrão, `inimigo_secreto` no exemplo); os tokens de login usam as coleções auxiliares `loginTokens` e `loginAttempts`.
4. Rode `npm run dev` e abra `http://localhost:3000/admin`.
5. Entre pelo link recebido no email e crie um rascunho com apenas um nome, se quiser. Copie o link de inscrição no painel. Revise os pedidos, aprove pelo menos duas pessoas, recuse os demais e publique. Compartilhe então o link de participação.

## Deploy na Vercel

Importe este repositório na Vercel e configure estas variáveis em **Project Settings → Environment Variables**, no ambiente **Production**:

| Variável | Valor para este projeto |
| --- | --- |
| `MONGODB_URI` | String de conexão do usuário de banco do Atlas; copie do `.env.local` sem publicar a senha. |
| `MONGODB_DB` | `inimigo_secreto` |
| `MONGODB_DRAWS_COLLECTION` | `inimigo_secreto` |
| `ADMIN_EMAIL` | `vitor93gs@gmail.com` |
| `SESSION_SECRET` | Segredo aleatório com pelo menos 32 caracteres; pode ser diferente do local. |
| `EMAIL_PROVIDER` | `gmail` para usar Gmail SMTP sem domínio próprio. O padrão, se omitido, é `resend`. |
| `GMAIL_USER` | Endereço Gmail que enviará os links, por exemplo `vitor93gs@gmail.com`. |
| `GMAIL_APP_PASSWORD` | Senha de app gerada na Conta Google, sem espaços. **Não** use sua senha normal. |
| `APP_URL` | `https://inimigosecreto.vercel.app` |

Se optar pelo Resend em vez de Gmail, use `EMAIL_PROVIDER=resend` e configure `RESEND_API_KEY` e `EMAIL_FROM` com um remetente em domínio verificado. `GMAIL_USER` e `GMAIL_APP_PASSWORD` não são usados nesse modo.

Depois de salvar as variáveis, faça um **Redeploy** da implantação de produção; alterações nas variáveis não atualizam implantações anteriores. Libere acesso do ambiente Vercel ao MongoDB Atlas conforme a configuração de rede do cluster. Não publique `.env.local`.

## Regras e segurança

- `ADMIN_EMAIL` é o único email que pode criar, editar ou publicar sorteios.
- A lista de um sorteio publicado é fixa. Rascunhos podem ser editados.
- O link de inscrição funciona enquanto o sorteio é um rascunho. Pedidos de entrada mostram nome e email apenas ao organizador. A inscrição não confirma a propriedade do email; o link de acesso por email é exigido para participar depois da publicação.
- O organizador precisa resolver todos os pedidos pendentes e ter ao menos duas pessoas na lista antes de publicar. A publicação encerra as inscrições.
- O mesmo email pode aparecer em sorteios diferentes, mas apenas uma vez em cada sorteio.
- Links de entrada expiram em 15 minutos e são consumidos uma vez. A sessão dura 30 dias; ela pode ser encerrada pelo organizador no painel.
- Um link compartilhado identifica o sorteio, mas não dá acesso a resultados. Cada pessoa vê apenas o próprio resultado após confirmar seu email.
- O sorteio verifica se cada escolha ainda permite uma atribuição completa. A gravação usa a versão do documento MongoDB para evitar conflitos simultâneos.
- Tokens e tentativas de entrada têm índices de expiração automáticos no MongoDB.

## Verificar

Rode `npm test`, `npm run lint`, `npx tsc --noEmit` e `npm run build`.
