import { useEffect } from "react";
import { Link } from "react-router-dom";

import { mostrarAlerta, mostrarErro } from "../../components/avisoErro";
import ROTAS from "../../constants/rotas";

import "../../styles/layout/app-shell.css";
import "../../styles/pages/indice.css";

export default function TelaErro({ codigo, titulo, texto, aviso = "erro", children }) {
    useEffect(() => {
        const mensagem = codigo ? `${codigo}. ${titulo}` : titulo;
        if (aviso === "alerta") {
            mostrarAlerta(mensagem);
            return;
        }
        mostrarErro(mensagem);
    }, [aviso, codigo, titulo]);

    return (
        <div className="err-page">
            {codigo ? <p className="dash-crumb">erro {codigo}</p> : null}
            <h2>{titulo}</h2>
            <p>{texto}</p>
            {children || <Link to={ROTAS.INDICE} className="idx-pill">voltar ao índice</Link>}
        </div>
    );
}
