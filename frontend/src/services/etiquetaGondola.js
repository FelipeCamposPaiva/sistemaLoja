import { emPromocao, moedaPreco, rotuloOff } from "../constants/precoPromocional";

function esc(valor) {
    return String(valor ?? "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;");
}

function codigoBarras(produto) {
    return esc(produto.gtin || produto.codigoBarras || produto.sku || "");
}

function cartao(produto) {
    const promo = emPromocao(produto);
    const preco = Number(produto.preco) || 0;
    const vigente = promo ? Number(produto.precoPromocional) : preco;
    const off = rotuloOff(produto);
    return `
    <article class="etiq">
      <p class="etiq-loja">Tem de Tudo</p>
      <h1>${esc(produto.nome || "Produto")}</h1>
      <p class="etiq-cod">${codigoBarras(produto)}</p>
      ${promo ? `
        <p class="etiq-de">De ${esc(moedaPreco(preco))}</p>
        <p class="etiq-por">${esc(moedaPreco(vigente))}</p>
        <p class="etiq-off">${esc(off)}</p>
      ` : `
        <p class="etiq-por is-normal">${esc(moedaPreco(preco))}</p>
      `}
    </article>`;
}

export function imprimirEtiquetasGondola(produtos) {
    const lista = (produtos || []).filter(Boolean);
    const html = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="utf-8" />
<title>Etiquetas de gôndola</title>
<style>
  @page { margin: 10mm; }
  body { font-family: Arial, Helvetica, sans-serif; color: #111; margin: 0; }
  h2 { font-size: 16px; margin: 0 0 12px; }
  .grade { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 12px; }
  .etiq {
    border: 2px solid #111;
    border-radius: 10px;
    padding: 14px 16px;
    min-height: 160px;
    break-inside: avoid;
  }
  .etiq-loja { margin: 0; font-size: 11px; letter-spacing: .12em; text-transform: uppercase; color: #555; }
  .etiq h1 { font-size: 16px; margin: 6px 0 8px; line-height: 1.2; }
  .etiq-cod { margin: 0 0 10px; font-size: 12px; letter-spacing: .08em; }
  .etiq-de { margin: 0; font-size: 13px; text-decoration: line-through; color: #666; }
  .etiq-por { margin: 4px 0 0; font-size: 28px; font-weight: 800; }
  .etiq-por.is-normal { margin-top: 18px; }
  .etiq-off {
    display: inline-block;
    margin: 10px 0 0;
    padding: 4px 8px;
    background: #b91c1c;
    color: #fff;
    font-size: 12px;
    font-weight: 700;
    border-radius: 4px;
  }
  @media print { h2 { display: none; } }
</style>
</head>
<body>
  <h2>${lista.length} etiqueta(s) de gôndola</h2>
  <div class="grade">
    ${lista.map(cartao).join("") || "<p>Nenhum produto selecionado.</p>"}
  </div>
</body>
</html>`;
    const janela = window.open("", "_blank");
    if (!janela) {
        return false;
    }
    janela.document.write(html);
    janela.document.close();
    janela.focus();
    janela.print();
    return true;
}
