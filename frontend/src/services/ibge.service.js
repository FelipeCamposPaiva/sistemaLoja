const IBGE = "https://servicodados.ibge.gov.br/api/v1/localidades";
const cache = new Map();
const emCurso = new Map();

export function municipiosPorUf(uf) {
    const sigla = String(uf || "").trim().toUpperCase();
    if (!/^[A-Z]{2}$/.test(sigla)) {
        return Promise.resolve([]);
    }
    if (cache.has(sigla)) {
        return Promise.resolve(cache.get(sigla));
    }
    if (emCurso.has(sigla)) {
        return emCurso.get(sigla);
    }
    const pedido = fetch(`${IBGE}/estados/${sigla}/municipios?orderBy=nome`)
        .then((resposta) => {
            if (!resposta.ok) {
                throw new Error("Não foi possível consultar os municípios no IBGE.");
            }
            return resposta.json();
        })
        .then((lista) => {
            const nomes = (Array.isArray(lista) ? lista : [])
                .map((item) => String(item?.nome || "").trim())
                .filter(Boolean);
            cache.set(sigla, nomes);
            return nomes;
        })
        .finally(() => {
            emCurso.delete(sigla);
        });
    emCurso.set(sigla, pedido);
    return pedido;
}
