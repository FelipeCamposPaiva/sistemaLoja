import { useState, useEffect } from "react";

export default function ModalProduto({
  aberto,
  fechar,
  salvar,
  produtoEditando
}) {

  const formInicial = {

    sku: "",

    codigoBarras: "",

    nome: "",

    categoria: "",

    unidade: "UN",

    custo: 0,

    custoCompra: 0,

    custoMedio: 0,

    preco: 0,

    precoAtacado: 0,

    estoque: 0,

    estoqueMinimo: 0,

    estoqueMaximo: 0,

    peso: 0,

    localizacao: "",

    fornecedorId: "",

    marcaId: "",

    ncm: "",

    cest: "",

    produtoProducao: false,

    consomeEstoque: true,

    observacoes: "",

    ativo: true

  };

  const [form, setForm] =
    useState(formInicial);

  useEffect(() => {

    if (!aberto) return;

    if (produtoEditando) {

      setForm({
        ...formInicial,
        ...produtoEditando
      });

    } else {

      setForm(formInicial);

    }

  }, [produtoEditando, aberto]);

  function handleChange(e) {

    const { name, value } = e.target;

    setForm(old => ({
      ...old,
      [name]: value
    }));

  }

  function handleSubmit(e) {

    e.preventDefault();

    salvar(form);

  }

  if (!aberto) return null;

  return (

    <div className="modal-overlay">

      <div className="modal-produto">

        <h2>
          {
            produtoEditando
              ? "Editar Produto"
              : "Novo Produto"
          }
        </h2>

        <form onSubmit={handleSubmit}>

          <div className="grid-2">

            <input
              name="sku"
              placeholder="SKU"
              value={form.sku || ""}
              onChange={handleChange}
            />

            <input
              name="codigoBarras"
              placeholder="Código de Barras"
              value={form.codigoBarras || ""}
              onChange={handleChange}
            />

            <input
              name="nome"
              placeholder="Nome do Produto"
              value={form.nome || ""}
              onChange={handleChange}
              required
            />

            <input
              name="categoria"
              placeholder="Categoria"
              value={form.categoria || ""}
              onChange={handleChange}
            />

            <input
              name="unidade"
              placeholder="Unidade"
              value={form.unidade || ""}
              onChange={handleChange}
            />

            <input
              type="number"
              step="0.01"
              name="preco"
              placeholder="Preço Venda"
              value={form.preco || 0}
              onChange={handleChange}
            />

            <input
              type="number"
              step="0.01"
              name="precoAtacado"
              placeholder="Preço Atacado"
              value={form.precoAtacado || 0}
              onChange={handleChange}
            />

            <input
              type="number"
              step="0.01"
              name="custo"
              placeholder="Custo"
              value={form.custo || 0}
              onChange={handleChange}
            />

            <input
              type="number"
              step="0.01"
              name="custoCompra"
              placeholder="Custo Compra"
              value={form.custoCompra || 0}
              onChange={handleChange}
            />

            <input
              type="number"
              step="0.01"
              name="custoMedio"
              placeholder="Custo Médio"
              value={form.custoMedio || 0}
              onChange={handleChange}
            />

            <input
              type="number"
              step="0.001"
              name="estoque"
              placeholder="Estoque Atual"
              value={form.estoque || 0}
              onChange={handleChange}
            />

            <input
              type="number"
              step="0.001"
              name="estoqueMinimo"
              placeholder="Estoque Mínimo"
              value={form.estoqueMinimo || 0}
              onChange={handleChange}
            />

            <input
              type="number"
              step="0.001"
              name="estoqueMaximo"
              placeholder="Estoque Máximo"
              value={form.estoqueMaximo || 0}
              onChange={handleChange}
            />

            <input
              name="localizacao"
              placeholder="Localização"
              value={form.localizacao || ""}
              onChange={handleChange}
            />

            <input
              type="number"
              name="fornecedorId"
              placeholder="Fornecedor ID"
              value={form.fornecedorId || ""}
              onChange={handleChange}
            />

            <input
              type="number"
              name="marcaId"
              placeholder="Marca ID"
              value={form.marcaId || ""}
              onChange={handleChange}
            />

            <input
              type="number"
              step="0.001"
              name="peso"
              placeholder="Peso"
              value={form.peso || 0}
              onChange={handleChange}
            />

            <input
              name="ncm"
              placeholder="NCM"
              value={form.ncm || ""}
              onChange={handleChange}
            />

            <input
              name="cest"
              placeholder="CEST"
              value={form.cest || ""}
              onChange={handleChange}
            />

          </div>

          <div
            style={{
              display: "flex",
              gap: "30px",
              margin: "15px 0"
            }}
          >

            <label>

              <input
                type="checkbox"
                checked={
                  form.produtoProducao || false
                }
                onChange={(e) =>
                  setForm({
                    ...form,
                    produtoProducao:
                      e.target.checked
                  })
                }
              />

              Produto Produção

            </label>

            <label>

              <input
                type="checkbox"
                checked={
                  form.consomeEstoque ?? true
                }
                onChange={(e) =>
                  setForm({
                    ...form,
                    consomeEstoque:
                      e.target.checked
                  })
                }
              />

              Consome Estoque

            </label>

            <label>

              <input
                type="checkbox"
                checked={
                  form.ativo ?? true
                }
                onChange={(e) =>
                  setForm({
                    ...form,
                    ativo:
                      e.target.checked
                  })
                }
              />

              Ativo

            </label>

          </div>

          <textarea
            name="observacoes"
            placeholder="Observações"
            value={form.observacoes || ""}
            onChange={handleChange}
          />

          <div className="acoes-modal">

            <button
              type="button"
              onClick={fechar}
            >
              Cancelar
            </button>

            <button
              type="submit"
              className="btn-primary"
            >
              Salvar
            </button>

          </div>

        </form>

      </div>

    </div>

  );

}
