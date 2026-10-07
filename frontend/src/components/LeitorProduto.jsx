import { useEffect, useRef, useState } from "react";
import { Camera, ImagePlus, ScanLine, X } from "lucide-react";

import { lerCodigoNaImagem, ranquearPorFoto } from "../services/reconhecerProduto";

const FORMATOS = ["ean_13", "ean_8", "code_128", "code_39", "upc_a", "upc_e", "qr_code", "itf", "codabar"];

function quadroDoVideo(video) {
    const canvas = document.createElement("canvas");
    const w = video.videoWidth || 640;
    const h = video.videoHeight || 480;
    canvas.width = w;
    canvas.height = h;
    canvas.getContext("2d").drawImage(video, 0, 0, w, h);
    return canvas;
}

async function canvasDeArquivo(arquivo) {
    const url = URL.createObjectURL(arquivo);
    try {
        const img = await new Promise((resolve, reject) => {
            const el = new Image();
            el.onload = () => resolve(el);
            el.onerror = () => reject(new Error("arquivo"));
            el.src = url;
        });
        return quadroDoVideo(img);
    } finally {
        URL.revokeObjectURL(url);
    }
}

export default function LeitorProduto({ modoInicial = "codigo", produtos, urlFoto, onFechar, onCodigo, onFoto }) {
    const videoRef = useRef(null);
    const onCodigoRef = useRef(onCodigo);
    const arquivoRef = useRef(null);
    const cameraArquivoRef = useRef(null);
    const ultimoRef = useRef({ texto: "", quando: 0 });
    const [modo, setModo] = useState(modoInicial);
    const [mensagem, setMensagem] = useState("");
    const [ocupado, setOcupado] = useState(false);
    const [cameraOk, setCameraOk] = useState(false);

    onCodigoRef.current = onCodigo;

    useEffect(() => {
        let stop = false;
        let stream;
        let controls;
        const video = videoRef.current;
        setCameraOk(false);
        setMensagem(modo === "codigo"
            ? "Aponte a câmera para o código de barras do produto."
            : "Enquadre o produto e capture a foto, ou escolha uma imagem da galeria.");

        (async () => {
            try {
                if (modo === "codigo" && !("BarcodeDetector" in window)) {
                    const { BrowserMultiFormatReader } = await import("@zxing/browser");
                    if (stop || !video) {
                        return;
                    }
                    const reader = new BrowserMultiFormatReader();
                    controls = await reader.decodeFromVideoDevice(undefined, video, (result) => {
                        const texto = String(result?.getText?.() || "").trim();
                        if (!texto) {
                            return;
                        }
                        const agora = Date.now();
                        if (texto === ultimoRef.current.texto && agora - ultimoRef.current.quando < 1600) {
                            return;
                        }
                        ultimoRef.current = { texto, quando: agora };
                        onCodigoRef.current(texto);
                    });
                    if (stop) {
                        controls?.stop();
                        return;
                    }
                    setCameraOk(true);
                    return;
                }

                stream = await navigator.mediaDevices.getUserMedia({
                    audio: false,
                    video: { facingMode: { ideal: "environment" }, width: { ideal: 1280 }, height: { ideal: 720 } }
                });
                if (stop || !video) {
                    stream.getTracks().forEach((track) => track.stop());
                    return;
                }
                video.srcObject = stream;
                await video.play();
                setCameraOk(true);
                if (modo !== "codigo" || !("BarcodeDetector" in window)) {
                    return;
                }
                const detector = new window.BarcodeDetector({ formats: FORMATOS });
                const tick = async () => {
                    if (stop) {
                        return;
                    }
                    try {
                        const codes = await detector.detect(video);
                        const texto = String(codes[0]?.rawValue || "").trim();
                        if (texto) {
                            const agora = Date.now();
                            if (!(texto === ultimoRef.current.texto && agora - ultimoRef.current.quando < 1600)) {
                                ultimoRef.current = { texto, quando: agora };
                                onCodigoRef.current(texto);
                                return;
                            }
                        }
                    } catch {
                        /* quadro sem código */
                    }
                    if (!stop) {
                        requestAnimationFrame(tick);
                    }
                };
                tick();
            } catch {
                if (!stop) {
                    setMensagem("A câmera não abriu. Permita o acesso no navegador ou envie uma foto da galeria.");
                }
            }
        })();

        return () => {
            stop = true;
            controls?.stop?.();
            stream?.getTracks?.().forEach((track) => track.stop());
            if (video) {
                video.srcObject = null;
            }
        };
    }, [modo]);

    async function reconhecer(canvas) {
        setOcupado(true);
        setMensagem("Procurando código de barras na foto...");
        try {
            const codigo = await lerCodigoNaImagem(canvas);
            if (codigo) {
                onCodigo(codigo);
                return;
            }
            setMensagem("Comparando com as fotos cadastradas...");
            const resultado = await ranquearPorFoto(produtos, canvas, urlFoto, (feitos, total) => {
                setMensagem(total
                    ? `Comparando com as fotos do cadastro (${feitos} de ${total})...`
                    : "Nenhuma foto cadastrada para comparar.");
            });
            onFoto({ ...resultado, codigo: "" });
        } catch {
            setMensagem("Não foi possível ler essa imagem. Tente outra foto, mais próxima e com luz.");
            setOcupado(false);
        }
    }

    async function capturar() {
        const video = videoRef.current;
        if (!video || !video.videoWidth) {
            setMensagem("A câmera ainda não está pronta.");
            return;
        }
        await reconhecer(quadroDoVideo(video));
    }

    async function usarArquivo(arquivo) {
        if (!arquivo) {
            return;
        }
        try {
            await reconhecer(await canvasDeArquivo(arquivo));
        } catch {
            setMensagem("Não foi possível abrir esse arquivo de imagem.");
            setOcupado(false);
        }
    }

    return (
        <div className="prd-leitor-overlay" role="dialog" aria-modal="true" aria-label="Ler produto">
            <div className="prd-leitor">
                <header>
                    <div>
                        <strong>{modo === "codigo" ? "Ler código de barras" : "Reconhecer pela foto"}</strong>
                        <p>Use a câmera do celular ou uma foto já salva.</p>
                    </div>
                    <button type="button" onClick={onFechar} aria-label="Fechar leitor">
                        <X size={18} />
                    </button>
                </header>
                <div className="prd-leitor-modos">
                    <button type="button" className={modo === "codigo" ? "is-on" : ""} onClick={() => setModo("codigo")} disabled={ocupado}>
                        <ScanLine size={15} /> Código
                    </button>
                    <button type="button" className={modo === "foto" ? "is-on" : ""} onClick={() => setModo("foto")} disabled={ocupado}>
                        <Camera size={15} /> Foto
                    </button>
                </div>
                <video ref={videoRef} className="prd-leitor-video" playsInline muted autoPlay />
                <p className="prd-leitor-msg">{mensagem}</p>
                <div className="prd-leitor-acoes">
                    {modo === "foto" ? (
                        <button type="button" className="prd-btn prd-btn-primary" onClick={capturar} disabled={ocupado || !cameraOk}>
                            <Camera size={16} />
                            {ocupado ? "Analisando..." : "Capturar foto"}
                        </button>
                    ) : null}
                    <button type="button" className="prd-btn" onClick={() => cameraArquivoRef.current?.click()} disabled={ocupado}>
                        <Camera size={16} /> Tirar foto
                    </button>
                    <button type="button" className="prd-btn" onClick={() => arquivoRef.current?.click()} disabled={ocupado}>
                        <ImagePlus size={16} /> Galeria
                    </button>
                </div>
                <input
                    ref={cameraArquivoRef}
                    type="file"
                    accept="image/*"
                    capture="environment"
                    hidden
                    onChange={(e) => {
                        usarArquivo(e.target.files?.[0]);
                        e.target.value = "";
                    }}
                />
                <input
                    ref={arquivoRef}
                    type="file"
                    accept="image/*"
                    hidden
                    onChange={(e) => {
                        usarArquivo(e.target.files?.[0]);
                        e.target.value = "";
                    }}
                />
            </div>
        </div>
    );
}
