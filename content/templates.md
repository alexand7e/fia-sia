## Modelo C.R.E.A.R. (para prompts educacionais)

- **C — Contexto**: turma, disciplina, tempo, recursos, realidade local
- **R — Responsabilidade**: papel da IA (professor, designer instrucional, avaliador)
- **E — Especificações**: formato, extensão, linguagem, elementos obrigatórios
- **A — Alinhamento**: BNCC (código + enunciado), objetivos e critérios
- **R — Restrições**: inclusão, conectividade, proibições, limites de texto

## Etapa 1 — Contexto Educacional (meta-prompt)

```xml
<contexto_educacional>
Você é um especialista em [DISCIPLINA] com experiência no Ensino Médio da rede pública do Piauí.

<publico_alvo>
- Ano/série: [1º/2º/3º]
- Faixa etária: [14–18]
- Perfil: [heterogênea / defasagem / alto engajamento / etc.]
- Recursos: [quadro, celular, cartolina, laboratório?]
- Conectividade: [baixa / média / alta]
</publico_alvo>

<objetivo_aprendizagem>
Ao final, o estudante será capaz de: [VERBO (Bloom) + CONTEÚDO + CONDIÇÃO]
</objetivo_aprendizagem>

<alinhamento_bncc>
- Habilidade: [CÓDIGO] — [enunciado curto]
</alinhamento_bncc>
</contexto_educacional>
```

## Etapa 2 — Especificações do Conteúdo

```xml
<especificacoes_conteudo>
Tema: [TEMA]
Formato: [plano de aula / texto didático / lista de questões / rubrica]
Tempo/duração: [50 min / 2 aulas / etc.]

Linguagem:
- nível: [básico/intermediário]
- termos técnicos: [3–5] com definição

Obrigatório:
1. exemplo do Piauí/Nordeste quando aplicável
2. atividade viável sem internet
3. avaliação formativa (perguntas ou rubrica simples)

Evite:
- infantilização
- exemplos desconectados da realidade da turma
- afirmações factuais sem base/sem qualificador
</especificacoes_conteudo>
```

## Etapa 3 — Estrutura Pedagógica (para qualquer formato)

```xml
<estrutura_pedagogica>
1. Ativação (5–10 min): pergunta provocativa + conexão com vivência local
2. Conteúdo novo (15–20 min): explicação progressiva + exemplos
3. Prática/produção (15–20 min): aplicação em grupos/duplas + mediação
4. Fechamento e avaliação (5–10 min): síntese + checagem rápida de aprendizagem
</estrutura_pedagogica>
```

## Bloom (atalho de verbos)

- **Lembrar**: listar, identificar
- **Compreender**: explicar, resumir
- **Aplicar**: resolver, usar
- **Analisar**: comparar, relacionar
- **Avaliar**: justificar, criticar
- **Criar**: produzir, propor
