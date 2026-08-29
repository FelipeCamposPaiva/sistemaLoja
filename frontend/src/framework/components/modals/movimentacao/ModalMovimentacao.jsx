import { useState } from "react";

export default function ModalMovimentacao({
  aberto,
  fechar,
  salvar,
  produtos = [],
  locais = []
}) {

  const [form, setForm] = useState({
    produtoId: "",
    tipo: "ENTRADA",
    quantidade: "",
    localOrigem: "",
    localDestino: "",
    observacao: ""
  });

  function handleChange(e) {

    const { name, value } = e.target;

    setForm({
      ...form,
      [name]: value
    });
  }

  function handleSubmit(e) {

    e.preventDefault();

    salvar(form);

    setForm({
      produtoId: "",
      tipo: "ENTRADA",
      quantidade: "",
      localOrigem: "",
      localDestino: "",
      observacao: ""
    });
  }

  if (!aberto) return null;

  return (

    <div className="modal-overlay">

      <div className="modal-cliente">

        <h2>Movimentação de Estoque</h2>

        <form onSubmit={handleSubmit}>

          <div className="grid-2">

            <select
              name="produtoId"
              value={form.produtoId}
              onChange={handleChange}
              required
            >
              <option value="">
                Selecione o Produto
              </option>

              {produtos.map((p) => (
                <option
                  key={p.id}
                  value={p.id}
                >
                  {p.nome}
                </option>
              ))}
            </select>

            <select
              name="tipo"
              value={form.tipo}
              onChange={handleChange}
            >
              <option value="ENTRADA">
                Entrada
              </option>

              <option value="SAIDA">
                Saída
              </option>

              <option value="TRANSFERENCIA">
                Transferência
              </option>
            </select>

            <input
              type="number"
              step="0.01"
              name="quantidade"
              placeholder="Quantidade"
              value={form.quantidade}
              onChange={handleChange}
              required
            />

            <select
              name="localOrigem"
              value={form.localOrigem}
              onChange={handleChange}
            >
              <option value="">
                Local Origem
              </option>

              {locais.map((l) => (
                <option
                  key={l.id}
                  value={l.id}
                >
                  {l.nome}
                </option>
              ))}
            </select>

            <select
              name="localDestino"
              value={form.localDestino}
              onChange={handleChange}
            >
              <option value="">
                Local Destino
              </option>

              {locais.map((l) => (
                <option
                  key={l.id}
                  value={l.id}
                >
                  {l.nome}
                </option>
              ))}
            </select>

          </div>

          <textarea
            name="observacao"
            placeholder="Observação"
            value={form.observacao}
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