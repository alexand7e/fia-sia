## 1. Simulação do processo (Chat Interativo)

Acompanhe como uma conversa com a IA evolui de um pedido genérico para um material pedagógico de alta qualidade, seguindo os princípios do nosso framework.

<div class="examples-simulator" id="examples-simulator">
  <div class="chat-controls">
    <button class="chat-btn active" data-scenario="linguagens" type="button">Linguagens</button>
    <button class="chat-btn" data-scenario="ciencias" type="button">Ciências</button>
    <button class="chat-btn" data-scenario="matematica" type="button">Matemática</button>
  </div>
  <div class="chat-window" aria-live="polite">
    <div class="chat-stream"></div>
  </div>
  <p class="chat-caption">Clique nos botões para ver a sequência de interações até o resultado final.</p>
</div>

---

## 2. Iterar — O Segredo do Material de Qualidade

A primeira resposta da IA raramente é perfeita. A **Iteração** é o processo de fornecer feedback para ajustar o nível, o tom ou o contexto. Em vez de "jogar fora" o que a IA fez, você a ajuda a refinar o resultado.

### Checklist de Iteração Pedagógica

Antes de usar o material, pergunte-se:
1. **Calibragem**: A linguagem está adequada para a série (ex: 1º ano vs 3º ano)?
2. **Contextualização**: Há alguma conexão com a realidade do **Piauí** ou do cotidiano do aluno?
3. **Viabilidade**: Dá para aplicar isso em 50 minutos com os recursos que eu tenho hoje?
4. **Precisão**: A IA inventou algum fato ou data (alucinação)?

### Prompts Rápidos para Ajuste
*Utilize os campos abaixo para personalizar e copiar comandos de ajuste direto para a sua IA.*

```markdown
Mantenha o mesmo plano, mas reduza o texto em [PERCENTUAL]% e preserve apenas: [ELEMENTOS_ESSENCIAIS].
```

```markdown
Reescreva a explicação com frases curtas e inclua 2 exemplos do cotidiano do Piauí relacionados a: [TEMA_LOCAL].
```

```markdown
Adapte o plano para uma aula de 50 minutos sem internet, usando apenas: [RECURSOS_DISPONIVEIS].
```

---

## 3. Exemplos Reais Detalhados

### Exemplo A — Matemática (PBL / 1º Ano)
**Habilidade BNCC**: (EM13MAT301) - Problematizar situações reais com funções.  
**Contexto**: Economia Doméstica e Preços de Energia.

1. **Pedido Inicial**: "Crie uma aula sobre funções afins." (Resposta vira algo genérico).
2. **Refinamento (Framework)**: "Use o modelo PBL. O problema central é o aumento da conta de luz em Teresina. Os alunos devem calcular a economia ao trocar lâmpadas incandescentes por LED."
3. **Ajuste Final**: "Crie 5 exercícios, sendo 2 de nível médio e 1 desafio que envolva interpretar o gráfico da fatura de energia da Equatorial Piauí."

### Exemplo B — Linguagens (Sala Invertida / 2º Ano)
**Habilidade BNCC**: (EM13LGG603) - Expressar-se e atuar em processos criativos.  
**Contexto**: Literatura Piauiense e Cordel.

1. **Material Pré-Aula**: "Gere um resumo de 300 palavras sobre as características do Cordel e um link para um vídeo curto de declamação."
2. **Atividade em Sala**: "Crie um roteiro de oficina onde os alunos criem suas próprias estrofes sobre a cultura de sua cidade (ex: Canto do Buriti, Parnaíba, etc.)."
3. **Avaliação**: "Crie uma rubrica que avalie: rima, métrica básica e uso de elementos culturais locais."
