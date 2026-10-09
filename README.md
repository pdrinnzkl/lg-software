# Interclasse LGF

Site do Interclasse da E.E. Prof. Luiz Gonzaga Fleury. O projeto usa React, TypeScript e Vite/Vinext; por isso, não existe um `index.html` editável como em um site estático. A página inicial está em `app/page.tsx` e o layout geral em `app/layout.tsx`.

## Rodar localmente

Requer Node.js 22.13 ou mais recente.

```bash
npm ci
npm run dev
```

Abra o endereço local informado pelo Vite. O banco SQLite de desenvolvimento é criado automaticamente em `data/interclasse.db`. O arquivo `.env.local` guarda os códigos de acesso para este computador; não o compartilhe.

## Acessibilidade visual

O botão **Acessibilidade**, no canto inferior da página, permite alternar entre modo escuro, modo claro, alto contraste e conforto visual, além de aumentar o texto. A preferência fica salva no navegador daquele dispositivo. As opções complementam recursos do próprio navegador/sistema, como zoom e leitor de tela.

## Contas e permissões

- **Aluno:** cria conta pública e acompanha agenda, modalidades, classificação e perfil.
- **Árbitro:** cria partidas atribuídas automaticamente a si e controla o placar, cronômetro e eventos em tempo real das próprias partidas.
- **Professor(a) / gestão:** corresponde ao perfil `ADMIN`; agenda partidas, escolhe árbitros, administra usuários e controla partidas.

As chaves de uso único estão em `CHAVES_DE_ACESSO.txt`. Cada pessoa pode usar uma chave de seu perfil uma única vez, escolhendo “Professor(a) / gestão” ou “Árbitro”. Nunca salve as chaves no Git ou em um site público. Ao usar outro computador, duplique `.env.example` para `.env.local` e informe as listas separadas por vírgula em `ADMIN_SETUP_CODES` e `REFEREE_SETUP_CODES`; o arquivo `.env.local` não faz parte do pacote de entrega.

## Banco de dados e publicação

Para manter contas e placares em produção, crie uma base Turso/libSQL e configure as variáveis privadas `TURSO_DATABASE_URL` e `TURSO_AUTH_TOKEN`. Configure também `ADMIN_SETUP_CODES` e `REFEREE_SETUP_CODES` com as chaves correspondentes do arquivo privado antes dos cadastros.

```bash
npm run build
npm start
```

O projeto precisa de hospedagem que execute as rotas de servidor e a API. Uma hospedagem exclusivamente estática não oferece login ou banco de dados. Não é necessário usar Cloudflare.

## Estrutura

```text
app/          páginas e rotas da API
components/   componentes visuais compartilhados
features/     autenticação, página inicial, árbitros e portais
db/           conexão, esquema e inicialização do banco
drizzle/      migrações do banco
lib/          autenticação, tipos e regras do campeonato
public/       logo, imagens e modelos 3D servidos pelo site
tests/        testes de renderização, imagens, contas e permissões
```

Rode `npm test` para compilar o site e validar as páginas, os arquivos de imagem/modelos, o cadastro, as permissões e o placar.
