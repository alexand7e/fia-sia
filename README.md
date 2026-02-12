# Guia de Design Instrucional com IA (SIA Piauí)

Este projeto é uma ferramenta interativa projetada para auxiliar professores do Ensino Médio Público do Piauí na utilização de Inteligência Artificial (LLMs) para o design instrucional. Ele oferece uma metodologia estruturada, templates de prompts e exemplos práticos adaptados à realidade regional.

## 🚀 Estrutura do Projeto

A aplicação é construída com HTML5, CSS3 e JavaScript puro, consumindo dados dinamicamente de arquivos JSON e Markdown. O conteúdo é servido por um servidor Node.js mínimo (Express).

- `/public/content`: Arquivos Markdown contendo o conteúdo pedagógico detalhado.
- `/public/data`: Arquivos JSON que definem a estrutura da metodologia e o banco de prompts.
- `/public/js`: Lógica da aplicação (`app.js`), responsável pelo carregamento dinâmico e interatividade.
- `/public/css`: Estilos visuais, incluindo suporte a temas e componentes UI.
- `/public/index.html`: Ponto de entrada da aplicação.
- `/server`: Servidor Express responsável por servir os estáticos.

## 📖 Como Funciona

O framework é dividido em duas áreas principais:

1.  **Metodologia**: Um guia passo a passo (Roadmap) que orienta o professor desde a contextualização até a iteração de conteúdos gerados por IA.
2.  **Banco de Prompts**: Uma coleção de modelos prontos para uso, filtráveis por metodologia (Sala de Aula Invertida, ABP, PBL, etc.), com uma área de trabalho integrada para personalização.

## 🛠️ Tecnologias Utilizadas

- **[Marked.js](https://marked.js.org/)**: Para renderização de Markdown em HTML.
- **[Highlight.js](https://highlightjs.org/)**: Para realce de sintaxe em blocos de código.
- **Google Fonts (Inter & JetBrains Mono)**: Para tipografia moderna e legível.
- **Node.js + Express**: Servir aplicação estática e healthcheck.

## 📝 Documentação para Desenvolvedores

### Requisitos
- Node.js 18+ (recomendado 20+)

### Ambiente local
1. Instale dependências: `npm install`
2. Rode em desenvolvimento: `npm run dev`
3. Acesse: `http://localhost:3003`

### Docker (dev/prod)
- Produção: `docker compose up app`
- Desenvolvimento: `docker compose --profile dev up app-dev`

### Variáveis de ambiente
- `PORT`: Porta do servidor (padrão `3003`)
- `PUBLIC_DIR`: Caminho do diretório de estáticos (padrão `./public`)

### Fluxo de Dados

1.  O arquivo `js/app.js` é carregado.
2.  Ele lê `public/data/methodology.json` para construir a navegação e carregar as seções iniciais.
3.  O conteúdo de cada seção é buscado em `/public/content/*.md` e renderizado em tempo real.
4.  O Banco de Prompts é gerado a partir de `public/data/prompts.json`.

### Adicionando Novo Conteúdo

Para adicionar uma nova seção à metodologia:
1. Crie o arquivo `.md` em `/public/content`.
2. Adicione a entrada correspondente em `public/data/methodology.json` no array `sections`.
3. Se desejar que apareça no roadmap superior, adicione ao array `roadmap`.

Para adicionar um novo prompt:
1. Edite `public/data/prompts.json` e adicione um novo objeto seguindo o esquema existente.

---
Desenvolvido para o **SIA Piauí** - Fortalecendo a educação com inovação.

