# Amigo Secreto

Site em português para organizar vários sorteios privados. O organizador cria um rascunho com nome, participantes e emails, publica e compartilha um link. Cada participante confirma o email com um link de uso único e sorteia uma pessoa distinta, sem tirar a si mesmo.

## Rodar localmente

1. Instale Node.js 20.9 ou superior e rode `npm install`.
2. Crie um cluster MongoDB Atlas e uma chave de API Resend. Verifique o domínio do remetente no Resend.
3. Copie `.env.example` para `.env.local` e configure os valores. Gere `SESSION_SECRET` com pelo menos 32 caracteres aleatórios. Use seu próprio email em `ADMIN_EMAIL`. O nome da coleção de sorteios é definido por `MONGODB_DRAWS_COLLECTION` (por padrão, `inimigo_secreto` no exemplo); os tokens de login usam as coleções auxiliares `loginTokens` e `loginAttempts`.
4. Rode `npm run dev` e abra `http://localhost:3000/admin`.
5. Entre pelo link recebido no email, crie um sorteio, revise a lista e publique. Compartilhe o link copiado no painel.

## Deploy na Vercel

Importe este repositório na Vercel e configure estas variáveis em **Project Settings → Environment Variables**, no ambiente **Production**:

| Variável | Valor para este projeto |
| --- | --- |
| `MONGODB_URI` | String de conexão do usuário de banco do Atlas; copie do `.env.local` sem publicar a senha. |
| `MONGODB_DB` | `inimigo_secreto` |
| `MONGODB_DRAWS_COLLECTION` | `inimigo_secreto` |
| `ADMIN_EMAIL` | `vitor93gs@gmail.com` |
| `SESSION_SECRET` | Segredo aleatório com pelo menos 32 caracteres; pode ser diferente do local. |
| `RESEND_API_KEY` | Chave de API do Resend. |
| `EMAIL_FROM` | Remetente no domínio verificado no Resend, por exemplo `Amigo Secreto <acesso@seu-dominio.com>`. Insira em uma única linha, sem aspas nem quebras de linha. |
| `APP_URL` | `https://inimigosecreto.vercel.app` |

Depois de salvar as variáveis, faça um **Redeploy** da implantação de produção; alterações nas variáveis não atualizam implantações anteriores. O endereço de `EMAIL_FROM` precisa pertencer ao domínio verificado no Resend. Libere acesso do ambiente Vercel ao MongoDB Atlas conforme a configuração de rede do cluster. Não publique `.env.local`.

## Regras e segurança

- `ADMIN_EMAIL` é o único email que pode criar, editar ou publicar sorteios.
- A lista de um sorteio publicado é fixa. Rascunhos podem ser editados.
- O mesmo email pode aparecer em sorteios diferentes, mas apenas uma vez em cada sorteio.
- Links de entrada expiram em 15 minutos e são consumidos uma vez. A sessão dura 30 dias; ela pode ser encerrada pelo organizador no painel.
- Um link compartilhado identifica o sorteio, mas não dá acesso a resultados. Cada pessoa vê apenas o próprio resultado após confirmar seu email.
- O sorteio verifica se cada escolha ainda permite uma atribuição completa. A gravação usa a versão do documento MongoDB para evitar conflitos simultâneos.
- Tokens e tentativas de entrada têm índices de expiração automáticos no MongoDB.

## Verificar

Rode `npm test`, `npm run lint`, `npx tsc --noEmit` e `npm run build`.
