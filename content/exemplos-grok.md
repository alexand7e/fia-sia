GROK 4.1

Aqui estão prompts documentados e prontos para uso por professores da rede pública do Piauí, otimizados para gerar planos de aula com metodologias ativas alinhadas à BNCC e ao currículo estadual. Eles seguem o fluxo de camadas do framework anterior (contexto, perfil, objetivo, tarefa, validação) para garantir usabilidade e consistência. Para anexos/textos longos, envie o prompt primeiro (gera a estrutura), depois o conteúdo na sequência; para curtos, inclua tudo junto para evitar perda de contexto. [novaescola.org](https://novaescola.org.br/conteudo/19773/10-planos-de-aula-que-utilizam-metodologias-ativas)

## 1. Prompt para Sala de Aula Invertida

Use este template para inverter o aprendizado: conteúdo em casa, prática em sala.

```
<prompt_template>
Você é professor de [disciplina] da [série] série do Ensino Médio em escola pública do Piauí.
Crie um plano de aula de 50 minutos sobre "[tema]", usando Sala de Aula Invertida (material pré-aula para casa, discussão/prática em sala).

Estrutura:
1. Objetivo (alinhado à BNCC [competência/habilidade]).
2. Material pré-aula (texto/vídeo curto, 1-2 perguntas, viável por WhatsApp/celular).
3. Atividades em sala (grupos, resolução de dúvidas, aplicação prática).
4. Avaliação formativa (observação/discussão).
5. Adaptações para baixa conectividade.

Linguagem simples para 14-18 anos, exemplos do Piauí. Autoavalie alinhamento BNCC em 3 pontos.
</prompt_template>
```

**Output esperado**: Plano numerado com seções claras, material pré-aula <300 palavras. [periodicos.ifbaiano.edu](https://periodicos.ifbaiano.edu.br/index.php/trilhas/article/download/808/113/2816)
**Análise**: Funciona por delimitar pré/pós-aula, reduzindo carga em sala; itere adicionando "inclua gamificação simples" para engajar mais. [educacao.imaginie.com](https://educacao.imaginie.com.br/plano-de-aula-com-metodologia-ativa/)

Deseja um exemplo preenchido para Matemática?

## 2. Prompt para Aprendizagem Baseada em Projetos (ABP)

Ideal para projetos locais, promovendo competências gerais da BNCC como projeto de vida.

```
<prompt_template>
Você é professor de [disciplina] da [série] série EM público Piauí.
Gere plano de aula/projeto de 2-3 aulas sobre "[tema]", com ABP (problema real → pesquisa → produto final).

Estrutura:
1. Problema inicial (contexto Piauí/Semiárido).
2. Etapas (pesquisa em grupo, coleta dados locais, criação produto: pôster/cartaz simples).
3. Cronograma (50 min/aula), recursos baixos.
4. Critérios avaliação (rubrica simples).
5. Conexão BNCC [habilidade].

Adapte para turmas heterogêneas. Valide em 3 pontos.
Se texto base: [cole aqui texto curto].
</prompt_template>
```

**Output esperado**: Etapas sequenciais, rubrica em tabela Markdown. [internationalschool](https://internationalschool.global/metodologias-ativas-de-aprendizagem-o-que-sao-principais-tipos-e-exemplos/)
**Análise**: Especifica produto viável (sem tech avançada); para anexos longos, use follow-up: "Refine o plano acima com este texto: [colar]". [treinamentosaf.com](https://treinamentosaf.com.br/7-prompts-de-ia-para-educacao-que-transformam-a-sala-de-aula/)

Deseja variação para 3º ano (ENEM prep)?

## 3. Prompt para Aprendizagem Baseada em Problemas (PBL)

Para resolução de problemas reais, como seca ou economia local.

```
<prompt_template>
Atue como professor [disciplina] [série] EM rede PI.
Plano de aula PBL 50 min: "[problema, ex: seca no Piauí afeta agricultura]".

1. Apresentação problema (aberto, real).
2. Hipóteses em duplas (10 min).
3. Pesquisa rápida (fontes simples/local).
4. Soluções/propostas (grupos).
5. Apresentação/discussão, ligação BNCC.

Recursos: quadro/celular. Linguagem acessível. Autoavaliação BNCC.
</prompt_template>
```

**Output esperado**: Fluxo temporal, perguntas guias por etapa. [pedagogiaparaconcurso.com](https://pedagogiaparaconcurso.com.br/artigo/como-aplicar-metodologias-ativas-na-sala-de-aula/)
**Análise**: Chain-of-thought implícito (hipóteses→soluções) evita superficialidade; envie problema como anexo se complexo, prompt primeiro. [eadsimples.com](https://www.eadsimples.com.br/tecnologia/prompts-de-ia-para-professores-saiba-como-criar-conteudos-com-a-inteligencia-artificial-4-exemplos-uteis/)

## 4. Prompt para Estudo de Caso

Para análise crítica em Humanas/Ciências.

```
<prompt_template>
Professor [disciplina] [série] EM Piauí público.
Plano estudo de caso: "[caso, ex: impacto enchentes Teresina]".

1. Caso descrito (curto, <200 palavras).
2. Perguntas análise (causas, impactos, soluções).
3. Grupos discutem (20 min), compartilham.
4. Síntese coletiva, BNCC [habilidade].
5. Reflexão individual.

Adapte inclusão. Valide.
[Cole caso aqui se curto].
</prompt_template>
```

**Output esperado**: Caso + 5-7 perguntas graduadas (Bloom). [letrus](https://letrus.com/posts/bncc-metodologias-ativas-para-engajar-seus-alunos)
**Análise**: Few-shot via estrutura BNCC; juntos se caso curto, separado para longos. [treinamentosaf.com](https://treinamentosaf.com.br/7-prompts-de-ia-para-educacao-que-transformam-a-sala-de-aula/)

## 5. Dicas de Usabilidade Geral

- **Sequência ideal**: Prompt → output estrutura → follow-up com anexo ("Use [texto] no plano anterior, refine seções X/Y").
- **Checklist rápido**: Copie output, revise 5 min (alinhamento, viabilidade PI), teste com 1 aluno.
- **Iteração**: "Melhore este plano para [metodologia extra: gamificação], mantendo BNCC." [canaleducacao](https://www.canaleducacao.tv/plano-de-aula?ensino=m%C3%A9dio)

Deseja mais prompts (gamificação/ensino híbrido) ou exemplos completos com outputs simulados?
