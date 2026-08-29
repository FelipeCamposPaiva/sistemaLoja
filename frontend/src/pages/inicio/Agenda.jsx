import { useState } from "react";

import PageHeader from "../../components/common/PageHeader";
import CardResumo from "../../components/cards/CardResumo";

import "../../styles/pages/agenda.css";

export default function Agenda() {

    const [mes] = useState("Junho 2026");

    const diasSemana = [
        "Dom",
        "Seg",
        "Ter",
        "Qua",
        "Qui",
        "Sex",
        "Sab"
    ];

    const dias = Array.from(
        { length: 35 },
        (_, i) => i + 1
    );

    return (

        <div className="agenda-page">

            <PageHeader
                modulo="Início"
                titulo="Agenda"
                subtitulo="Gerencie seus compromissos, entregas e tarefas."
                botao="+ Novo Compromisso"
                onClick={() => {}}
            />

            <div className="produtos-resumo">

                <CardResumo
                    titulo="Compromissos Hoje"
                    valor={0}
                />

                <CardResumo
                    titulo="Esta Semana"
                    valor={0}
                />

                <CardResumo
                    titulo="Entregas"
                    valor={0}
                />

                <CardResumo
                    titulo="OS Agendadas"
                    valor={0}
                />

            </div>

            <div className="agenda-toolbar">

                <div className="navegacao">

                    <button>{"<"}</button>

                    <button>{">"}</button>

                    <button>Hoje</button>

                </div>

                <h2>

                    {mes}

                </h2>

                <div className="visualizacao">

                    <button className="ativo">

                        Mensal

                    </button>

                    <button>

                        Semanal

                    </button>

                    <button>

                        Diário

                    </button>

                </div>

            </div>

            <div className="agenda-grid">

                {

                    diasSemana.map((dia) => (

                        <div
                            key={dia}
                            className="cabecalho-dia"
                        >

                            {dia}

                        </div>

                    ))

                }

                {

                    dias.map((dia) => (

                        <div
                            key={dia}
                            className="dia"
                        >

                            <span className="numero-dia">

                                {dia}

                            </span>

                        </div>

                    ))

                }

            </div>

        </div>

    );

}