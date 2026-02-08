/**
 * @typedef {Object} IAContexto
 * @property {string=} materias
 * @property {string=} serie
 * @property {number=} cargaSemanal
 * @property {string=} prioridades
 * @property {string[]=} observacoes
 *
 * @typedef {Object} IACalendario
 * @property {string=} inicio
 * @property {string=} fim
 * @property {string[]=} eventos
 * @property {{bimestre:number,semanasUteis:number,marcos:string[]}=} distribuicao
 *
 * @typedef {Object} IABimestres
 * @property {number=} numeroBimestres
 * @property {Record<string, string>=} pesosAvaliacao
 * @property {{bimestre:number,semanas:number,metas:string[]}=} plano
 *
 * @typedef {Object} IAUnidades
 * @property {number=} bimestre
 * @property {{titulo:string,duracaoSemanas:number,objetivos:string[],resultados:string[]}=} unidades
 *
 * @typedef {Object} IASequencia
 * @property {string=} unidade
 * @property {{aula:number,objetivo:string,atividade:string,checagem:string,tarefa:string}=} aulas
 *
 * @typedef {Object} IAAvaliacoes
 * @property {{bimestre:number,itens:{tipo:string,peso:number,criterios:string[]}[]}=} matriz
 *
 * @typedef {Object} IAMateriais
 * @property {{unidade:string,itens:{tipo:string,descricao:string}[]}=} materiais
 *
 * @typedef {Object} IARevisao
 * @property {string=} resumo
 * @property {string[]=} riscos
 * @property {string[]=} proximosPassos
 */

export default {};
