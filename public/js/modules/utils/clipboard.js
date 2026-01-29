export function copyPlainText(btn, text) {
    return navigator.clipboard.writeText(text || '').then(() => {
        if (!btn) return;
        const originalText = btn.textContent;
        btn.textContent = 'Copiado!';
        setTimeout(() => {
            btn.textContent = originalText;
        }, 2000);
    });
}

export function copyWithFeedback(btn, text) {
    return navigator.clipboard.writeText(text || '').then(() => {
        if (!btn) return;
        const originalText = btn.textContent;
        btn.textContent = 'Copiado!';
        btn.style.background = 'rgba(27, 154, 89, 0.92)';
        setTimeout(() => {
            btn.textContent = originalText;
            btn.style.background = '';
        }, 2000);
    });
}
