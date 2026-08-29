import { useState } from "react";

export default function CameraScanner({

    onCapture

}) {

    const [ativo, setAtivo] = useState(false);

    function iniciar() {

        setAtivo(true);

    }

    function parar() {

        setAtivo(false);

    }

    function capturar() {

        const imagem = "imagem-capturada";

        onCapture?.(imagem);

    }

    return (

        <div>

            {

                !ativo ? (

                    <button

                        onClick={iniciar}

                    >

                        Ativar Câmera

                    </button>

                ) : (

                    <>

                        <div

                            style={{

                                width: 400,

                                height: 250,

                                background: "#ddd",

                                display: "flex",

                                alignItems: "center",

                                justifyContent: "center",

                                borderRadius: 8,

                                marginBottom: 15

                            }}

                        >

                            Visualização da câmera

                        </div>

                        <button onClick={capturar}>

                            Capturar

                        </button>

                        <button

                            onClick={parar}

                            style={{

                                marginLeft: 10

                            }}

                        >

                            Fechar

                        </button>

                    </>

                )

            }

        </div>

    );

}