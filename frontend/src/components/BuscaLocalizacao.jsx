import { Search, X } from "lucide-react";

const FILTROS_ESTOQUE = [
    { id: "todos", nome: "Todos" },
    { id: "disponivel", nome: "Com estoque disponível" },
    { id: "sem", nome: "Sem estoque disponível" },
    { id: "negativo", nome: "Estoque negativo" }
];

function filtroAtual(filtroEstoque, soEstoque) {
    if (filtroEstoque) {
        return filtroEstoque;
    }
    return soEstoque ? "disponivel" : "todos";
}

export default function BuscaLocalizacao({
    localizacao,
    onLocalizacao,
    soEstoque,
    onSoEstoque,
    filtroEstoque,
    onFiltroEstoque,
    placeholder = "Ex.: PT-150, caixa, corredor ou setor"
}) {
    const filtro = filtroAtual(filtroEstoque, soEstoque);
    const mostrarFiltro = Boolean(onFiltroEstoque || onSoEstoque);

    function aplicarFiltro(id) {
        onFiltroEstoque?.(id);
        onSoEstoque?.(id === "disponivel");
    }

    return (
        <div className="loc-busca fer-filtros">
            <label className="fer-search loc-search-borda">
                <Search size={15} />
                <input
                    value={localizacao}
                    onChange={(e) => onLocalizacao(e.target.value)}
                    placeholder={placeholder}
                    autoComplete="off"
                    aria-label="Localização"
                />
                {localizacao ? (
                    <button type="button" className="prd-limpar" onClick={() => onLocalizacao("")} aria-label="Limpar busca">
                        <X size={14} />
                    </button>
                ) : null}
            </label>
            {mostrarFiltro ? (
                <div className="loc-estoque-pills" role="group" aria-label="Situação do estoque">
                    {FILTROS_ESTOQUE.map((item) => (
                        <button
                            type="button"
                            key={item.id}
                            className={filtro === item.id ? "is-on" : ""}
                            onClick={() => aplicarFiltro(item.id)}
                        >
                            {item.nome}
                        </button>
                    ))}
                </div>
            ) : null}
        </div>
    );
}
