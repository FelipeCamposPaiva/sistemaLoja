import { useState, useEffect } from "react";

export default function ModalCliente({
  aberto,
  fechar,
  salvar,
  clienteEditando
}) {

  const formInicial = {
    tipo: "FISICA",
    nome: "",
    cpfCnpj: "",
    telefone: "",
    email: "",
    cidade: "",
    estado: "",
    cep: "",
    limiteCredito: 0,
    observacoes: "",
    ativo: true
  };

  const [form, setForm] = useState(formInicial);

  useEffect(() => {

    if (clienteEditando) {

      setForm({
        ...clienteEditando
      });

    } else {

      setForm(formInicial);

    }

  }, [clienteEditando, aberto]);

  function handleChange(e) {

    const { name, value } = e.target;

    setForm((prev) => ({
      ...prev,
      [name]: value
    }));

  }

  function handleSubmit(e) {

    e.preventDefault();

    const dados = { ...form };

    // Se for novo cadastro remove qualquer ID
    if (!clienteEditando) {
      delete dados.id;
    }

    console.log("SALVANDO:", dados);

    salvar(dados);

  }

  if (!aberto) return null;

  return (

    <div className="modal-overlay">

      <div className="modal-cliente">

        <h2>
          {clienteEditando
            ? "Editar Cliente"
            : "Novo Cliente"}
        </h2>

        <form onSubmit={handleSubmit}>

          <div className="grid-2">

            <select
              name="tipo"
              value={form.tipo || "FISICA"}
              onChange={handleChange}
            >
              <option value="FISICA">
                Pessoa Física
              </option>

              <option value="JURIDICA">
                Pessoa Jurídica
              </option>
            </select>

            <input
              type="text"
              name="nome"
              placeholder="Nome"
              value={form.nome || ""}
              onChange={handleChange}
              required
            />

            <input
              type="text"
              name="cpfCnpj"
              placeholder="CPF/CNPJ"
              value={form.cpfCnpj || ""}
              onChange={handleChange}
            />

            <input
              type="text"
              name="telefone"
              placeholder="Telefone"
              value={form.telefone || ""}
              onChange={handleChange}
            />

            <input
              type="email"
              name="email"
              placeholder="E-mail"
              value={form.email || ""}
              onChange={handleChange}
            />

            <input
              type="text"
              name="cidade"
              placeholder="Cidade"
              value={form.cidade || ""}
              onChange={handleChange}
            />

            <input
              type="text"
              name="estado"
              placeholder="Estado"
              value={form.estado || ""}
              onChange={handleChange}
            />

            <input
              type="text"
              name="cep"
              placeholder="CEP"
              value={form.cep || ""}
              onChange={handleChange}
            />

            <input
              type="number"
              step="0.01"
              name="limiteCredito"
              placeholder="Limite de Crédito"
              value={form.limiteCredito || 0}
              onChange={handleChange}
            />

          </div>

          <textarea
            name="observacoes"
            placeholder="Observações"
            value={form.observacoes || ""}
            onChange={handleChange}
            rows="5"
          />

          <div className="acoes-modal">

            <button
              type="button"
              className="btn-outline"
              onClick={() => {
                setForm(formInicial);
                fechar();
              }}
            >
              Cancelar
            </button>

            <button
              type="submit"
              className="btn-primary"
            >
              {clienteEditando
                ? "Atualizar"
                : "Salvar"}
            </button>

          </div>

        </form>

      </div>

    </div>

  );
}