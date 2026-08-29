import { useEffect, useState } from "react";

import useAuth from "../../hooks/useAuth";

import "../../styles/layout/footer.css";

export default function Footer() {

    const { usuario } = useAuth();

    const [dataHora, setDataHora] = useState(new Date());

    useEffect(() => {

        const timer = setInterval(() => {

            setDataHora(new Date());

        }, 1000);

        return () => clearInterval(timer);

    }, []);

    return (

        <footer className="erp-footer">

            {/*=============================*/}
            {/* ESQUERDA */}
            {/*=============================*/}

            <div className="footer-left">

                <strong>

                    ERP Tem de Tudo

                </strong>

                <span>

                    Versão 2.0.0

                </span>

            </div>

            {/*=============================*/}
            {/* CENTRO */}
            {/*=============================*/}

            <div className="footer-center">

                <span>

                    © {new Date().getFullYear()} Tem de Tudo Papelaria,
                    Presentes, Personalizados e Gráfica LTDA.

                </span>

            </div>

            {/*=============================*/}
            {/* DIREITA */}
            {/*=============================*/}

            <div className="footer-right">

                <span className="footer-status online">

                    ● Sistema Online

                </span>

                {

                    usuario && (

                        <span>

                            Usuário:

                            <strong>

                                {" "}

                                {usuario.nome}

                            </strong>

                        </span>

                    )

                }

                <span>

                    {

                        dataHora.toLocaleDateString("pt-BR")

                    }

                </span>

                <span>

                    {

                        dataHora.toLocaleTimeString("pt-BR")

                    }

                </span>

            </div>

        </footer>

    );

}