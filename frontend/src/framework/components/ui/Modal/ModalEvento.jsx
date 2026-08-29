import { useEffect } from "react";

export default function ModalEvento({

    aberto,

    titulo = "Modal",

    children,

    onClose,

    largura = 700,

    fecharEsc = true,

    fecharOverlay = true,

    footer

}) {

    useEffect(() => {

        if (!aberto || !fecharEsc) return;

        function handleKeyDown(e) {

            if (e.key === "Escape") {

                onClose?.();

            }

        }

        window.addEventListener(

            "keydown",

            handleKeyDown

        );

        return () =>

            window.removeEventListener(

                "keydown",

                handleKeyDown

            );

    }, [

        aberto,

        fecharEsc,

        onClose

    ]);

    if (!aberto) return null;

    function fechar() {

        if (fecharOverlay) {

            onClose?.();

        }

    }

    return (

        <div

            onClick={fechar}

            style={{

                position:"fixed",

                inset:0,

                background:"rgba(0,0,0,.45)",

                display:"flex",

                alignItems:"center",

                justifyContent:"center",

                zIndex:9999,

                padding:20

            }}

        >

            <div

                onClick={(e)=>e.stopPropagation()}

                style={{

                    background:"#fff",

                    width:"100%",

                    maxWidth:largura,

                    borderRadius:12,

                    overflow:"hidden",

                    boxShadow:"0 15px 40px rgba(0,0,0,.25)",

                    display:"flex",

                    flexDirection:"column"

                }}

            >

                <div

                    style={{

                        display:"flex",

                        justifyContent:"space-between",

                        alignItems:"center",

                        padding:"18px 24px",

                        borderBottom:"1px solid #e5e7eb"

                    }}

                >

                    <h2

                        style={{

                            margin:0,

                            fontSize:22

                        }}

                    >

                        {titulo}

                    </h2>

                    <button

                        onClick={onClose}

                        style={{

                            border:"none",

                            background:"transparent",

                            cursor:"pointer",

                            fontSize:22

                        }}

                    >

                        ✕

                    </button>

                </div>

                <div

                    style={{

                        padding:24,

                        maxHeight:"70vh",

                        overflowY:"auto"

                    }}

                >

                    {children}

                </div>

                {

                    footer &&

                    <div

                        style={{

                            padding:20,

                            borderTop:"1px solid #e5e7eb",

                            display:"flex",

                            justifyContent:"flex-end",

                            gap:10

                        }}

                    >

                        {footer}

                    </div>

                }

            </div>

        </div>

    );

}