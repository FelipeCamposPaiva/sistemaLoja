const LOC_KEY = "erp-produto-loc-v1";
export const SEM_PRATELEIRA = "SEM-PRATELEIRA";
export const SEM_LOCAL_ROTULO = "Sem localização";

const PREFIXO_GRUPO = [
    ["PAPELARIA", "PT"],
    ["PERSONALIZ", "PE"],
    ["PRESENTE", "PR"],
    ["BRINQUED", "BR"],
    ["UTILIDADE", "UT"],
    ["ARTESANATO", "AR"],
    ["EMBALAG", "EM"],
    ["ELETRON", "EL"],
    ["INFORMAT", "IN"]
];

export function lerLocaisProduto() {
    try {
        const bruto = JSON.parse(localStorage.getItem(LOC_KEY) || "{}");
        return bruto && typeof bruto === "object" ? bruto : {};
    } catch {
        return {};
    }
}

export function gravarLocalProduto(id, valor) {
    const mapa = lerLocaisProduto();
    const chave = String(id || "");
    if (!chave) {
        return mapa;
    }
    if (valor) {
        mapa[chave] = String(valor).trim();
    } else {
        delete mapa[chave];
    }
    localStorage.setItem(LOC_KEY, JSON.stringify(mapa));
    return mapa;
}

export function sugerirLocalizacao(produto) {
    const grupo = String(produto?.grupo || produto?.categoria || "").toUpperCase();
    const base = String(produto?.id || produto?.sku || produto?.nome || "0");
    const hash = [...base].reduce((soma, ch) => soma + ch.charCodeAt(0), 0);
    const prefixo = PREFIXO_GRUPO.find(([nome]) => grupo.includes(nome))?.[1] || "PT";
    const corredor = String((hash % 8) + 1).padStart(2, "0");
    const letra = "ABCD"[hash % 4];
    return `${prefixo}-${corredor}-${letra}`;
}

export function localizacaoDe(produto) {
    const manual = lerLocaisProduto()[String(produto?.id || "")];
    if (manual === SEM_PRATELEIRA) {
        return "";
    }
    if (manual) {
        return manual;
    }
    const cadastrada = String(produto?.localizacao || "").trim();
    if (!cadastrada || cadastrada === SEM_PRATELEIRA) {
        return "";
    }
    return cadastrada;
}

export function situacaoEstoque(produto) {
    const qtd = Number(produto?.estoqueDisponivel ?? produto?.estoque ?? 0);
    const minimo = Number(produto?.estoqueMinimo || 20);
    if (qtd < 0) {
        return { id: "neg", nome: "Estoque negativo" };
    }
    if (qtd <= 0) {
        return { id: "sem", nome: "Sem estoque" };
    }
    if (qtd <= minimo) {
        return { id: "baixo", nome: "Estoque baixo" };
    }
    return { id: "ok", nome: "Em estoque" };
}

export function partesLocalizacao(texto) {
    return String(texto || "")
        .split(/[,;/|]+/)
        .map((parte) => parte.trim())
        .filter(Boolean);
}

export function produtoNaLocalizacao(produto, termo) {
    const q = String(termo || "").trim().toLowerCase();
    if (!q) {
        return true;
    }
    const bruto = localizacaoDe(produto);
    if (q === SEM_LOCAL_ROTULO.toLowerCase() || q === "sem-prateleira" || q === "sem prateleira") {
        return !bruto;
    }
    if (!bruto) {
        return false;
    }
    if (bruto.toLowerCase().includes(q)) {
        return true;
    }
    return partesLocalizacao(bruto).some((parte) => parte.toLowerCase().includes(q));
}

export function quantidadeEstoque(produto) {
    return Number(produto?.estoqueDisponivel ?? produto?.estoque ?? 0);
}

export function temEstoqueDisponivel(produto) {
    return quantidadeEstoque(produto) > 0;
}

export function passaFiltroEstoque(produto, filtro) {
    const qtd = quantidadeEstoque(produto);
    if (filtro === "disponivel" || filtro === true || filtro === "1") {
        return qtd > 0;
    }
    if (filtro === "sem") {
        return qtd === 0;
    }
    if (filtro === "negativo") {
        return qtd < 0;
    }
    return true;
}

export function filtrarPorLocalizacao(produtos, termo, filtroEstoque = "todos") {
    return (produtos || []).filter((p) => {
        if (!passaFiltroEstoque(p, filtroEstoque)) {
            return false;
        }
        return produtoNaLocalizacao(p, termo);
    });
}

export function ocupacaoDos(itens) {
    if (!itens?.length) {
        return 0;
    }
    let soma = 0;
    for (const produto of itens) {
        const est = quantidadeEstoque(produto);
        const max = Number(produto?.estoqueMaximo || 0);
        const min = Number(produto?.estoqueMinimo || 0);
        if (est < 0) {
            soma += 0;
        } else if (max > 0) {
            soma += Math.min(100, (est / max) * 100);
        } else if (min > 0) {
            soma += Math.min(100, (est / (min * 4)) * 100);
        } else {
            soma += est > 0 ? 100 : 0;
        }
    }
    return Math.round(soma / itens.length);
}

export function situacaoDoLocal(itens, ocupacao) {
    const lista = itens || [];
    if (!lista.length) {
        return { id: "sem", nome: "Sem estoque" };
    }
    if (lista.some((p) => quantidadeEstoque(p) < 0)) {
        return { id: "neg", nome: "Estoque negativo" };
    }
    if (lista.every((p) => quantidadeEstoque(p) <= 0)) {
        return { id: "sem", nome: "Sem estoque" };
    }
    const criticos = lista.filter((p) => {
        const qtd = quantidadeEstoque(p);
        const min = Number(p.estoqueMinimo || 0);
        if (qtd <= 0) {
            return true;
        }
        return min > 0 && qtd <= min;
    }).length;
    if (ocupacao < 30 || criticos / lista.length >= 0.5) {
        return { id: "baixo", nome: "Estoque baixo" };
    }
    return { id: "ok", nome: "Com estoque" };
}

export function resumirLocalizacoes(produtos, filtroEstoque = "todos") {
    const mapa = new Map();
    for (const produto of produtos || []) {
        if (!passaFiltroEstoque(produto, filtroEstoque)) {
            continue;
        }
        const bruto = localizacaoDe(produto);
        const partes = bruto ? partesLocalizacao(bruto) : [SEM_LOCAL_ROTULO];
        for (const parte of (partes.length ? partes : [SEM_LOCAL_ROTULO])) {
            const chave = parte.toLowerCase();
            let atual = mapa.get(chave);
            if (!atual) {
                atual = { localizacao: parte, itens: [], qtd: 0, estoque: 0 };
                mapa.set(chave, atual);
            }
            atual.itens.push(produto);
            atual.qtd += 1;
            atual.estoque += quantidadeEstoque(produto);
        }
    }
    return [...mapa.values()].map((grupo) => {
        const ocupacao = ocupacaoDos(grupo.itens);
        return {
            ...grupo,
            ocupacao,
            status: situacaoDoLocal(grupo.itens, ocupacao)
        };
    });
}

export function metricasCatalogo(produtos) {
    let estoque = 0;
    let comPrateleira = 0;
    let sem = 0;
    const locais = new Set();
    const locaisComEstoque = new Set();
    for (const produto of produtos || []) {
        const qtd = quantidadeEstoque(produto);
        estoque += qtd;
        const bruto = localizacaoDe(produto);
        if (!bruto) {
            sem += 1;
            continue;
        }
        comPrateleira += 1;
        for (const parte of partesLocalizacao(bruto)) {
            const chave = parte.toLowerCase();
            locais.add(chave);
            if (qtd > 0) {
                locaisComEstoque.add(chave);
            }
        }
    }
    return {
        total: locais.size,
        comEstoque: locaisComEstoque.size,
        produtos: comPrateleira,
        sem,
        estoque
    };
}

export function setorDaLocalizacao(codigo) {
    if (!codigo || codigo === SEM_LOCAL_ROTULO) {
        return "Sem prateleira";
    }
    const pedaco = String(codigo).split(/[-\s/]/)[0].trim().toUpperCase();
    return pedaco || "Outros";
}

export function catalogoLocalizacoes(produtos) {
    const mapa = new Map();
    for (const produto of produtos || []) {
        for (const parte of partesLocalizacao(localizacaoDe(produto))) {
            const chave = parte.toLowerCase();
            if (!mapa.has(chave)) {
                mapa.set(chave, parte);
            }
        }
    }
    return [...mapa.values()].sort((a, b) => a.localeCompare(b, "pt-BR", { numeric: true }));
}

function esc(valor) {
    return String(valor ?? "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;");
}

function nomeImpressao(produto) {
    const bruto = String(produto?.nome || "").trim();
    return bruto.replace(/^\d+\s*[:.\-]\s*/, "").trim() || bruto || "—";
}

function codigoImpressao(produto) {
    const sku = String(produto?.sku || "").trim();
    const gtin = String(produto?.gtin || produto?.codigoBarras || "").trim();
    const id = String(produto?.id || "");
    if (sku && sku !== id && !/^\d{1,4}$/.test(sku)) {
        return sku;
    }
    return gtin || (sku && sku !== id ? sku : "") || sku || "—";
}

function qtdImpressao(valor) {
    return Number(valor || 0).toLocaleString("pt-BR", { maximumFractionDigits: 3 });
}

function classeEstoque(valor) {
    const n = Number(valor || 0);
    if (n < 0) {
        return "neg";
    }
    if (n === 0) {
        return "zero";
    }
    return "";
}

export function imprimirProdutosLocalizacao(produtos, localizacao) {
    const lista = produtos || [];
    const locs = [...new Set(lista.map((p) => localizacaoDe(p)).filter(Boolean))];
    const locUnica = String(localizacao || "").trim() || (locs.length === 1 ? locs[0] : "");
    const mostrarLoc = !locUnica;
    const colunas = mostrarLoc ? 8 : 7;
    const agora = new Date();
    const quando = agora.toLocaleString("pt-BR", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit"
    });
    const titulo = locUnica
        ? `Contagem · ${locUnica}`
        : "Contagem por localização";
    const linhas = lista.map((p, i) => {
        const estoque = p.estoqueDisponivel ?? p.estoque ?? 0;
        const cls = classeEstoque(estoque);
        return `
        <tr>
            <td class="n">${i + 1}</td>
            <td class="sku">${esc(codigoImpressao(p))}</td>
            <td class="nome">${esc(nomeImpressao(p))}</td>
            ${mostrarLoc ? `<td class="loc">${esc(localizacaoDe(p) || "—")}</td>` : ""}
            <td class="un">${esc(p.unidade || "UN")}</td>
            <td class="qtd ${cls}">${qtdImpressao(estoque)}</td>
            <td class="box"></td>
            <td class="box"></td>
        </tr>`;
    }).join("");

    const html = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="utf-8" />
<title>${esc(titulo)}</title>
<style>
  @page { size: A4 portrait; margin: 10mm 8mm 12mm; }
  * { box-sizing: border-box; }
  body {
    margin: 0;
    color: #1f2937;
    font: 11px/1.35 "Segoe UI", Arial, sans-serif;
  }
  header {
    display: flex;
    justify-content: space-between;
    gap: 16px;
    align-items: flex-end;
    padding-bottom: 10px;
    border-bottom: 3px solid #ff2f92;
    margin-bottom: 10px;
  }
  .marca { font-size: 11px; letter-spacing: .08em; font-weight: 800; color: #ff2f92; text-transform: uppercase; }
  h1 { margin: 2px 0 0; font-size: 20px; line-height: 1.15; }
  .meta { margin: 4px 0 0; color: #6b7280; font-size: 11px; }
  .resumo {
    text-align: right;
    font-size: 12px;
    color: #4b5563;
  }
  .resumo strong { display: block; font-size: 22px; color: #111827; line-height: 1; }
  .dica {
    margin: 0 0 8px;
    padding: 6px 8px;
    background: #fff5f9;
    border: 1px solid #f9c2dc;
    border-radius: 6px;
    color: #9d174d;
    font-size: 10.5px;
  }
  table { width: 100%; border-collapse: collapse; }
  thead { display: table-header-group; }
  tfoot { display: table-row-group; }
  tr { page-break-inside: avoid; }
  th, td {
    border: 1px solid #d1d5db;
    padding: 5px 6px;
    vertical-align: middle;
  }
  th {
    background: #fce7f3;
    color: #831843;
    font-size: 10px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: .03em;
  }
  tbody tr:nth-child(even) td { background: #fafafa; }
  .n { width: 28px; text-align: center; color: #6b7280; }
  .sku { width: 108px; font-family: ui-monospace, Consolas, monospace; font-size: 10.5px; }
  .nome { font-weight: 600; }
  .loc { width: 88px; white-space: nowrap; }
  .un { width: 36px; text-align: center; color: #6b7280; }
  .qtd, .box { width: 72px; text-align: right; }
  .qtd { font-variant-numeric: tabular-nums; font-weight: 700; }
  .qtd.zero { color: #9ca3af; }
  .qtd.neg { color: #b91c1c; }
  .box { height: 22px; background: #fff; }
  tfoot td { border: 0; padding-top: 18px; }
  .assin {
    display: grid;
    grid-template-columns: 1.2fr 1fr 1.2fr;
    gap: 18px;
    font-size: 11px;
  }
  .assin p { margin: 0 0 28px; color: #6b7280; }
  .assin b { display: block; border-top: 1px solid #9ca3af; padding-top: 4px; font-weight: 600; color: #374151; }
  .obs { margin-top: 14px; color: #6b7280; }
  .obs span { display: inline-block; min-width: 70%; border-bottom: 1px solid #9ca3af; height: 16px; }
  @media print {
    .dica { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    th, tbody tr:nth-child(even) td { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
  }
</style>
</head>
<body>
  <header>
    <div>
      <div class="marca">Tem de Tudo · lista / contagem</div>
      <h1>${esc(locUnica ? `Prateleira ${locUnica}` : "Produtos por localização")}</h1>
      <p class="meta">Impresso em ${esc(quando)} · conferir o físico e anotar na coluna Contado</p>
    </div>
    <div class="resumo">
      <strong>${lista.length}</strong>
      produto${lista.length === 1 ? "" : "s"}
    </div>
  </header>
  <p class="dica">Preencha <b>Contado</b> na prateleira. Use <b>Dif.</b> só se o físico for diferente do estoque do sistema. Estoque negativo aparece em vermelho.</p>
  <table>
    <thead>
      <tr>
        <th>#</th>
        <th>Código</th>
        <th>Produto</th>
        ${mostrarLoc ? "<th>Local</th>" : ""}
        <th>Un</th>
        <th>Estoque</th>
        <th>Contado</th>
        <th>Dif.</th>
      </tr>
    </thead>
    <tbody>${linhas || `<tr><td colspan="${colunas}">Nenhum produto nesta localização.</td></tr>`}</tbody>
    <tfoot>
      <tr>
        <td colspan="${colunas}">
          <div class="assin">
            <div><p> </p><b>Conferido por</b></div>
            <div><p> </p><b>Data</b></div>
            <div><p> </p><b>Assinatura</b></div>
          </div>
          <div class="obs">Observações <span></span></div>
        </td>
      </tr>
    </tfoot>
  </table>
</body>
</html>`;
    const janela = window.open("", "_blank");
    if (!janela) {
        return false;
    }
    janela.document.open();
    janela.document.write(html);
    janela.document.close();
    janela.focus();
    setTimeout(() => {
        try {
            janela.print();
        } catch {
            /* popup bloqueado após escrever */
        }
    }, 250);
    return true;
}
