import { useState } from "react";

import PageHeader from "../../components/common/PageHeader";

import { salvarOS } from "../../services/os.service";

import "../../styles/pages/nova-os.css";

export default function NovaOS() {

    const [cliente, setCliente] = useState("");

    const [descricao, setDescricao] = useState("");

    const [valor, setValor] = useState("");

    const [dataEntrega, setDataEntrega] = useState("");

    const [observacao, setObservacao] = useState("");

    async function salvar() {

        if (!cliente || !descricao) {

            alert("Preencha os campos obrigatórios.");

            return;

        }

        try {

            await salvarOS({

                cliente,

                descricao,

                valor: Number(valor || 0),

                dataEntrega,

                observacao,

                status: "ORCAMENTO"

            });

            limparFormulario();

        } catch (erro) {

            console.error(erro);

        }

    }

    function limparFormulario() {

        setCliente("");

        setDescricao("");

        setValor("");

        setDataEntrega("");

        setObservacao("");

    }

    return (

        <div className="nova-os-page">

            <PageHeader
                modulo="Serviços"
                titulo="Nova Ordem de Serviço"
                subtitulo="Cadastre uma nova Ordem de Serviço."
                botao="Salvar OS"
                onClick={salvar}
            />

            <div className="nova-os-form">

                <div className="nova-os-grid">

                    <div>

                        <label>

                            Cliente *

                        </label>

                        <input
                            type="text"
                            placeholder="Nome do cliente"
                            value={cliente}
                            onChange={(e) =>
                                setCliente(e.target.value)
                            }
                        />

                    </div>

                    <div>

                        <label>

                            Data de Entrega

                        </label>

                        <input
                            type="date"
                            value={dataEntrega}
                            onChange={(e) =>
                                setDataEntrega(e.target.value)
                            }
                        />

                    </div>

                    <div>

                        <label>

                            Descrição *

                        </label>

                        <input
                            type="text"
                            placeholder="Descrição do serviço"
                            value={descricao}
                            onChange={(e) =>
                                setDescricao(e.target.value)
                            }
                        />

                    </div>

                    <div>

                        <label>

                            Valor

                        </label>

                        <input
                            type="number"
                            step="0.01"
                            placeholder="0,00"
                            value={valor}
                            onChange={(e) =>
                                setValor(e.target.value)
                            }
                        />

                    </div>

                    <div>

                        <label>

                            Status

                        </label>

                        <input
                            value="ORÇAMENTO"
                            disabled
                        />

                    </div>

                    <div>

                        <label>

                            Prioridade

                        </label>

                        <select defaultValue="NORMAL">

                            <option value="BAIXA">

                                Baixa

                            </option>

                            <option value="NORMAL">

                                Normal

                            </option>

                            <option value="ALTA">

                                Alta

                            </option>

                            <option value="URGENTE">

                                Urgente

                            </option>

                        </select>

                    </div>

                </div>

                <div
                    style={{
                        marginTop: 20
                    }}
                >

                    <label>

                        Observações

                    </label>

                    <textarea
                        rows={6}
                        placeholder="Informações adicionais..."
                        value={observacao}
                        onChange={(e) =>
                            setObservacao(e.target.value)
                        }
                    />

                </div>

                <div className="nova-os-acoes">

                    <button
                        className="btn-outline"
                        onClick={limparFormulario}
                    >

                        Limpar

                    </button>

                    <button
                        className="btn-primary"
                        onClick={salvar}
                    >

                        Salvar Ordem de Serviço

                    </button>

                </div>

            </div>

        </div>

    );

}