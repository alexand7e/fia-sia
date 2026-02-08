import { elFromHtml, mustGet } from './ui.js';
import { extractJson } from './parser.js';
import { validateContexto } from './validator.js';

/**
 * @param {{storage:{read:()=>any, write:(next:any)=>void}, ai:{execute:(params:{prompt:string, model:string, responseFormat:'json'|'text'})=>Promise<any>}}} ctx
 * @returns {{render:(container:HTMLElement)=>void}}
 */
export function SubabaContexto(ctx) {
  return {
    render(container) {
      const root = elFromHtml(`
        <div class="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-surface-dark p-6 space-y-4">
          <div>
            <h2 class="text-lg font-bold text-slate-900 dark:text-white">Contexto do professor</h2>
            <p class="text-sm text-slate-500">Defina o básico para orientar as sugestões da IA.</p>
          </div>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label class="block text-sm font-semibold mb-1">Matéria(s)</label>
              <input data-field="materias" class="w-full rounded-lg border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-800/50" placeholder="Ex: Matemática" />
            </div>
            <div>
              <label class="block text-sm font-semibold mb-1">Série/Ano</label>
              <input data-field="serie" class="w-full rounded-lg border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-800/50" placeholder="Ex: 1º EM" />
            </div>
            <div>
              <label class="block text-sm font-semibold mb-1">Carga horária semanal (aulas)</label>
              <input data-field="cargaSemanal" type="number" min="1" class="w-full rounded-lg border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-800/50" placeholder="Ex: 2" />
            </div>
            <div>
              <label class="block text-sm font-semibold mb-1">Prioridades</label>
              <input data-field="prioridades" class="w-full rounded-lg border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-800/50" placeholder="BNCC, reforço, projeto..." />
            </div>
          </div>
          <div class="flex items-center gap-3">
            <button data-action="save" class="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90">Salvar</button>
            <button data-action="ai" class="px-4 py-2 bg-secondary text-white rounded-lg hover:bg-secondary/90">Gerar com IA</button>
            <span data-role="status" class="text-sm text-slate-500"></span>
          </div>
          <div>
            <label class="block text-sm font-semibold mb-1">Resultado (JSON)</label>
            <textarea data-field="output" class="w-full h-44 rounded-lg border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-800/50" placeholder="Resposta estruturada da IA (editável)"></textarea>
          </div>
        </div>
      `);

      const state = ctx.storage.read();
      const materiasEl = mustGet(root, '[data-field="materias"]');
      const serieEl = mustGet(root, '[data-field="serie"]');
      const cargaEl = mustGet(root, '[data-field="cargaSemanal"]');
      const prioridadesEl = mustGet(root, '[data-field="prioridades"]');
      const outputEl = mustGet(root, '[data-field="output"]');
      const statusEl = mustGet(root, '[data-role="status"]');
      const saveBtn = mustGet(root, '[data-action="save"]');
      const aiBtn = mustGet(root, '[data-action="ai"]');

      materiasEl.value = state.ctx?.materias || '';
      serieEl.value = state.ctx?.serie || '';
      cargaEl.value = state.ctx?.cargaSemanal ?? '';
      prioridadesEl.value = state.ctx?.prioridades || '';
      outputEl.value = state.ctx?.rawJson || '';

      saveBtn.addEventListener('click', () => {
        const next = ctx.storage.read();
        const ctxData = {
          materias: materiasEl.value || '',
          serie: serieEl.value || '',
          cargaSemanal: Number(cargaEl.value || 0) || undefined,
          prioridades: prioridadesEl.value || '',
          rawJson: outputEl.value || ''
        };
        ctx.storage.write({ ...next, ctx: ctxData });
        statusEl.textContent = 'Alterações salvas';
        setTimeout(() => { statusEl.textContent = ''; }, 1200);
      });

      aiBtn.addEventListener('click', async () => {
        try {
          aiBtn.disabled = true;
          statusEl.textContent = 'Gerando...';

          const prompt = `Retorne APENAS um JSON válido.
Schema esperado:
{
  "materias": "string",
  "serie": "string",
  "cargaSemanal": number,
  "prioridades": "string",
  "observacoes": ["string"]
}
Contexto atual:
materias=${materiasEl.value}
serie=${serieEl.value}
cargaSemanal=${cargaEl.value}
prioridades=${prioridadesEl.value}
Preencha campos faltantes e inclua observacoes objetivas para orientar o planejamento.`;

          const res = await ctx.ai.execute({ prompt, model: 'base', responseFormat: 'json' });
          const json = res?.data?.json ?? null;
          const text = res?.data?.text ?? res?.data?.text ?? '';

          let parsed = json;
          if (!parsed) {
            const extracted = extractJson(typeof text === 'string' ? text : '');
            if (!extracted.success) throw extracted.error;
            parsed = extracted.data;
          }

          const validated = validateContexto(parsed);
          if (!validated.ok) throw new Error(validated.errors.join('; '));

          const v = validated.value;
          if (typeof v.materias === 'string') materiasEl.value = v.materias;
          if (typeof v.serie === 'string') serieEl.value = v.serie;
          if (typeof v.cargaSemanal === 'number') cargaEl.value = String(v.cargaSemanal);
          if (typeof v.prioridades === 'string') prioridadesEl.value = v.prioridades;

          outputEl.value = JSON.stringify(v, null, 2);
          ctx.storage.write({ ...ctx.storage.read(), ctx: { ...v, rawJson: outputEl.value } });
          statusEl.textContent = 'Gerado';
        } catch (e) {
          statusEl.textContent = e instanceof Error ? e.message : 'Erro ao gerar';
        } finally {
          aiBtn.disabled = false;
          setTimeout(() => { statusEl.textContent = ''; }, 2200);
        }
      });

      container.appendChild(root);
    }
  };
}

export default SubabaContexto;
