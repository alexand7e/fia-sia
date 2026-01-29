export async function fetchText(path) {
    const response = await fetch(path);
    if (!response.ok) {
        throw new Error(`Falha ao carregar: ${path}`);
    }
    return await response.text();
}
