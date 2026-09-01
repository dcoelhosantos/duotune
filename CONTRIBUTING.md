# Guia de Contribuição - DuoTune

## 1. Idioma
* **Código em Inglês:** Tudo o que for relacionado à estrutura do código, como nomes de variáveis, funções, classes e arquivos.
* **Interface em Português:** Toda string, texto ou interface visual que o usuário final for visualizar nas telas.

---

## 2. Padrão de Commits
Adotaremos o padrão Conventional Commits com mensagens em Português e verbo no imperativo.

**Estrutura:** `<tipo>: <verbo no imperativo> <descrição curta>`.

* `feat`: Nova funcionalidade (ex: `feat: adiciona pareamento de contas`).
* `fix`: Correção de bug (ex: `fix: resolve erro na sala sincronizada`).
* `chore`: Configurações ou tarefas repetitivas (ex: `chore: atualiza dependencias do front-end`).
* `refactor`: Modificação no código que não altera o comportamento final (ex: `refactor: limpa imports`).
* `docs`: Mudanças apenas na documentação (ex: `docs: cria o guia de contribuicao do projeto`).

---

## 3. Fluxo de Trabalho (Git)
Nenhuma alteração deve ser feita diretamente na branch principal (`main`).

1. Crie sua branch.
2. Desenvolva sua task nessa nova branch.
3. Abra um **Pull Request (PR)** apontando para a branch `main`.
4. Pelo menos **1 membro** do time precisa revisar e aprovar o seu PR antes do merge.

---

## 4. Padrão de Código (JS e Java)
* **Variáveis e Funções:** Use `camelCase` (ex: `playMusic`, `userId`).
* **Componentes React e Classes Java:** Use `PascalCase` (ex: `ReactiveChat.jsx`, `MusicController.java`).
