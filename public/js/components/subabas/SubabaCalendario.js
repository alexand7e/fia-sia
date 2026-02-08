import { elFromHtml, mustGet } from './ui.js';
import { extractJson } from './parser.js';
import { validateCalendario } from './validator.js';

/**
 * @param {{storage:{read:()=>any, write:(next:any)=>void}, ai:{execute:(params:{prompt:string, model:string, responseFormat:'json'|'text'})=>Promise<any>}}} ctx
 * @returns {{render:(container:HTMLElement)=>void}}
 */
export function SubabaCalendario(ctx) {
  return {
    render(container) {
      const root = elFromHtml(`
        <div class="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-surface-dark p-6 space-y-4">
          <div>
            <h2 class="text-lg font-bold text-slate-900 dark:text-white">Calendário do ano letivo</h2>
            <p class="text-sm text-slate-500">Defina datas-chave para distribuir o ano em semanas úteis.</p>
          </div>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label class="block text-sm font-semibold mb-1">Início</label>
              <input data-field="inicio" type="date" class="w-full rounded-lg border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-800/50" />
            </div>
            <div>
              <label class="block text-sm font-semibold mb-1">Fim</label>
              <input data-field="fim" type="date" class="w-full rounded-lg border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-800/50" />
            </div>
            <div class="md:col-span-2">
              <label class="block text-sm font-semibold mb-1">Eventos/Feriados</label>
              <textarea data-field="eventos" class="w-full h-24 rounded-lg border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-800/50" placeholder="Liste datas importantes (uma por linha)"></textarea>
            </div>
          </div>
          <div class="flex items-center gap-3">
            <button data-action="save" class="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90">Salvar</button>
            <button data-action="ai" class="px-4 py-2 bg-secondary text-white rounded-lg hover:bg-secondary/90">Gerar com IA</button>
            <span data-role="status" class="text-sm text-slate-500"></span>
          </div>
          <div>
            <label class="block text-sm font-semibold mb-1">Resultado (JSON)</label>
            <textarea data-field="output" class="w-full h-48 rounded-lg border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-800/50" placeholder="Resposta estruturada da IA (editável)"></textarea>
          </div>
        </div>
      `);

      const state = ctx.storage.read();
      const inicioEl = mustGet(root, '[data-field="inicio"]');
      const fimEl = mustGet(root, '[data-field="fim"]');
      const eventosEl = mustGet(root, '[data-field="eventos"]');
      const outputEl = mustGet(root, '[data-field="output"]');
      const statusEl = mustGet(root, '[data-role="status"]');
      const saveBtn = mustGet(root, '[data-action="save"]');
      const aiBtn = mustGet(root, '[data-action="ai"]');

      inicioEl.value = state.cal?.inicio || '';
      fimEl.value = state.cal?.fim || '';
      eventosEl.value = (state.cal?.eventos || []).join('\n');
      outputEl.value = state.cal?.rawJson || '';

      saveBtn.addEventListener('click', () => {
        const next = ctx.storage.read();
        const cal = {
          inicio: inicioEl.value || '',
          fim: fimEl.value || '',
          eventos: String(eventosEl.value || '').split('\n').map(s => s.trim()).filter(Boolean),
          rawJson: outputEl.value || ''
        };
        ctx.storage.write({ ...next, cal });
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
  "inicio": "YYYY-MM-DD",
  "fim": "YYYY-MM-DD",
  "eventos": ["string"],
  "distribuicao": [{"bimestre": 1, "semanasUteis": 0, "marcos": ["string"]}]
}
Dados:
inicio=${inicioEl.value}
fim=${fimEl.value}
eventos=${eventosEl.value}
Sugira distribuicao por bimestre e marcos de avaliação.`;

          const res = await ctx.ai.execute({ prompt, model: 'base', responseFormat: 'json' });
          const json = res?.data?.json ?? null;
          const text = res?.data?.text ?? '';

          let parsed = json;
          if (!parsed) {
            const extracted = extractJson(typeof text === 'string' ? text : '');
            if (!extracted.success) throw extracted.error;
            parsed = extracted.data;
          }

          const validated = validateCalendario(parsed);
          if (!validated.ok) throw new Error(validated.errors.join('; '));

          const v = validated.value;
          if (typeof v.inicio === 'string') inicioEl.value = v.inicio;
          if (typeof v.fim === 'string') fimEl.value = v.fim;
          if (Array.isArray(v.eventos)) eventosEl.value = v.eventos.join('\n');

          outputEl.value = JSON.stringify(v, null, 2);
          ctx.storage.write({ ...ctx.storage.read(), cal: { ...v, rawJson: outputEl.value } });
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

export default SubabaCalendario;
