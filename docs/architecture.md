# Arquitetura

## Visão geral
O projeto é uma aplicação estática servida por um servidor Node.js mínimo. O frontend fica em `public/` e o backend apenas expõe os arquivos estáticos e um endpoint de healthcheck.

```
fia-sia/
  public/           # HTML, CSS, JS, dados e conteúdo
  server/           # Express (static + /health)
  docs/             # Documentação de engenharia
```

## Componentes principais
- `public/index.html`: ponto de entrada da UI.
- `public/js/app.js`: lógica do app, carregamento de JSON/Markdown, interações.
- `public/data/*.json`: estrutura de metodologia e prompts.
- `public/content/*.md`: conteúdo pedagógico renderizado na UI.
- `server/src/app.js`: servidor Express com static + `/health`.
- `server/src/index.js`: bootstrap do servidor (porta + public dir).

## Fluxo de dados
1. O navegador carrega `public/index.html`.
2. `public/js/app.js` busca `public/data/methodology.json`.
3. Cada seção aponta para arquivos em `public/content/*.md`, renderizados com Marked.js.
4. O banco de prompts é carregado de `public/data/prompts.json`.

## Healthcheck
`GET /health` retorna `{ "status": "ok" }`.
