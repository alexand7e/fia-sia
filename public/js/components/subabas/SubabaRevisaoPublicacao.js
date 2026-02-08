import { elFromHtml, mustGet } from './ui.js';
import { extractJson } from './parser.js';
import { validateGeneric } from './validator.js';

/**
 * @param {{storage:{read:()=>any, write:(next:any)=>void}, ai:{execute:(params:{prompt:string, model:string, responseFormat:'json'|'text'})=>Promise<any>}}} ctx
 * @returns {{render:(container:HTMLElement)=>void}}
 */
export function SubabaRevisaoPublicacao(ctx) {
  return {
    render(container) {
      const root = elFromHtml(`
        <div class="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-surface-dark p-6 space-y-4">
          <div>
            <h2 class="text-lg font-bold text-slate-900 dark:text-white">Revisão e publicação</h2>
            <p class="text-sm text-slate-500">Gere um resumo final e publique a versão.</p>
          </div>
          <div>
            <label class="block text-sm font-semibold mb-1">Resumo do plano</label>
            <textarea data-field="resumo" class="w-full h-28 rounded-lg border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-800/50" placeholder="Resumo geral (editável)"></textarea>
          </div>
          <div class="flex items-center gap-3">
            <button data-action="save" class="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90">Salvar</button>
            <button data-action="ai" class="px-4 py-2 bg-secondary text-white rounded-lg hover:bg-secondary/90">Gerar com IA</button>
            <button data-action="publish" class="px-4 py-2 bg-primary-dark text-white rounded-lg hover:bg-primary">Publicar</button>
            <span data-role="status" class="text-sm text-slate-500"></span>
          </div>
          <div>
            <label class="block text-sm font-semibold mb-1">Resultado (JSON)</label>
            <textarea data-field="output" class="w-full h-40 rounded-lg border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-800/50" placeholder="Resumo estruturado (editável)"></textarea>
          </div>
        </div>
      `);

      const state = ctx.storage.read();
      const resumoEl = mustGet(root, '[data-field="resumo"]');
      const outputEl = mustGet(root, '[data-field="output"]');
      const statusEl = mustGet(root, '[data-role="status"]');
      const saveBtn = mustGet(root, '[data-action="save"]');
      const aiBtn = mustGet(root, '[data-action="ai"]');
      const publishBtn = mustGet(root, '[data-action="publish"]');

      resumoEl.value = state.rev?.resumo || '';
      outputEl.value = state.rev?.rawJson || '';

      saveBtn.addEventListener('click', () => {
        ctx.storage.write({ ...ctx.storage.read(), rev: { resumo: resumoEl.value || '', rawJson: outputEl.value || '' } });
        statusEl.textContent = 'Alterações salvas';
        setTimeout(() => { statusEl.textContent = ''; }, 1200);
      });

      aiBtn.addEventListener('click', async () => {
        try {
          aiBtn.disabled = true;
          statusEl.textContent = 'Gerando...';
          const fullState = ctx.storage.read();
          const prompt = `Retorne APENAS um JSON válido.
Gere um resumo final do planejamento com base nestes dados (JSON):
${JSON.stringify(fullState, null, 2)}
Schema sugerido:
{"resumo":"string","riscos":["string"],"proximosPassos":["string"]}`
          ;
          const res = await ctx.ai.execute({ prompt, model: 'base', responseFormat: 'json' });
          const json = res?.data?.json ?? null;
          const text = res?.data?.text ?? '';
          const extracted = json ? { success: true, data: json } : extractJson(String(text));
          if (!extracted.success) throw extracted.error;
          const validated = validateGeneric(extracted.data);
          if (!validated.ok) throw new Error(validated.errors.join('; '));
          outputEl.value = JSON.stringify(validated.value, null, 2);
          if (typeof validated.value?.resumo === 'string') {
            resumoEl.value = validated.value.resumo;
          }
          ctx.storage.write({ ...ctx.storage.read(), rev: { resumo: resumoEl.value || '', rawJson: outputEl.value } });
          statusEl.textContent = 'Gerado';
        } catch (e) {
          statusEl.textContent = e instanceof Error ? e.message : 'Erro ao gerar';
        } finally {
          aiBtn.disabled = false;
          setTimeout(() => { statusEl.textContent = ''; }, 2200);
        }
      });

      publishBtn.addEventListener('click', () => {
        ctx.storage.write({ ...ctx.storage.read(), publishedAt: new Date().toISOString() });
        statusEl.textContent = 'Plano publicado';
        setTimeout(() => { statusEl.textContent = ''; }, 2200);
      });

      container.appendChild(root);
    }
  };
}

export default SubabaRevisaoPublicacao;
