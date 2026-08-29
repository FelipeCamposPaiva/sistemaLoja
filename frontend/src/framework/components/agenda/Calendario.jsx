import { useMemo, useState } from "react";

export default function Calendario({

    eventos = [],

    onSelecionarDia,

    onSelecionarEvento

}) {

    const hoje = new Date();

    const [dataAtual, setDataAtual] = useState(

        new Date()

    );

    const meses = [

        "Janeiro",
        "Fevereiro",
        "Março",
        "Abril",
        "Maio",
        "Junho",
        "Julho",
        "Agosto",
        "Setembro",
        "Outubro",
        "Novembro",
        "Dezembro"

    ];

    const diasSemana = [

        "Dom",
        "Seg",
        "Ter",
        "Qua",
        "Qui",
        "Sex",
        "Sab"

    ];

    const ano = dataAtual.getFullYear();

    const mes = dataAtual.getMonth();

    const primeiroDia =

        new Date(

            ano,

            mes,

            1

        ).getDay();

    const ultimoDia =

        new Date(

            ano,

            mes + 1,

            0

        ).getDate();

    const dias = useMemo(() => {

        const lista = [];

        for (

            let i = 0;

            i < primeiroDia;

            i++

        ) {

            lista.push(null);

        }

        for (

            let i = 1;

            i <= ultimoDia;

            i++

        ) {

            lista.push(i);

        }

        return lista;

    }, [

        primeiroDia,

        ultimoDia

    ]);

    function mesAnterior() {

        setDataAtual(

            new Date(

                ano,

                mes - 1,

                1

            )

        );

    }

    function proximoMes() {

        setDataAtual(

            new Date(

                ano,

                mes + 1,

                1

            )

        );

    }

    function hojeCalendario() {

        setDataAtual(

            new Date()

        );

    }

    return (

        <div className="calendario">

            <div className="calendario-topo">

                <button

                    onClick={mesAnterior}

                >

                    ◀

                </button>

                <h2>

                    {meses[mes]}

                    {" "}

                    {ano}

                </h2>

                <button

                    onClick={proximoMes}

                >

                    ▶

                </button>

            </div>

            <button

                className="btn-primary"

                onClick={hojeCalendario}

            >

                Hoje

            </button>

            <div className="calendario-grid">

                {

                    diasSemana.map(

                        dia => (

                            <div

                                key={dia}

                                className="cabecalho"

                            >

                                {dia}

                            </div>

                        )

                    )

                }

                {

                    dias.map(

                        (dia, index) => {

                            if (

                                dia === null

                            ) {

                                return (

                                    <div

                                        key={index}

                                        className="dia vazio"

                                    />

                                );

                            }

                            const eventosDia =

                                eventos.filter(

                                    evento => {

                                        const data =

                                            new Date(

                                                evento.data

                                            );

                                        return (

                                            data.getDate() === dia &&

                                            data.getMonth() === mes &&

                                            data.getFullYear() === ano

                                        );

                                    }

                                );

                            const ehHoje =

                                dia === hoje.getDate() &&

                                mes === hoje.getMonth() &&

                                ano === hoje.getFullYear();

                            return (

                                <div

                                    key={dia}

                                    className={

                                        ehHoje

                                            ? "dia hoje"

                                            : "dia"

                                    }

                                    onClick={() =>

                                        onSelecionarDia?.(

                                            dia

                                        )

                                    }

                                >

                                    <div className="numero">

                                        {dia}

                                    </div>

                                    {

                                        eventosDia.map(

                                            evento => (

                                                <div

                                                    key={evento.id}

                                                    className="evento"

                                                    onClick={(e)=>{

                                                        e.stopPropagation();

                                                        onSelecionarEvento?.(

                                                            evento

                                                        );

                                                    }}

                                                >

                                                    {

                                                        evento.titulo

                                                    }

                                                </div>

                                            )

                                        )

                                    }

                                </div>

                            );

                        }

                    )

                }

            </div>

        </div>

    );

}