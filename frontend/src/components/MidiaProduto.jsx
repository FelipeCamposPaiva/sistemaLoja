import { useState } from "react";
import { Film, ImagePlus, Link2, Trash2 } from "lucide-react";

import { urlMidia } from "../services/produtoMidia.service";

const CANAIS = [
    { id: "mercado-livre", nome: "Mercado Livre" },
    { id: "shopee", nome: "Shopee" }
];

export default function MidiaProduto({
    fotos = [],
    videos = [],
    anuncios = [],
    pendentesFoto = [],
    pendentesVideo = [],
    canais = [],
    onFotos,
    onVideos,
    onCanais,
    onRemoverSalvo,
    urlVideo,
    onUrlVideo
}) {
    const [erro, setErro] = useState("");

    function escolherFotos(lista) {
        const arquivos = [...lista].filter((f) => f.type.startsWith("image/"));
        if (!arquivos.length) {
            setErro("Selecione imagens JPG, PNG ou WEBP.");
            return;
        }
        setErro("");
        onFotos?.([...pendentesFoto, ...arquivos]);
    }

    function escolherVideos(lista) {
        const arquivos = [...lista].filter((f) => f.type.startsWith("video/") || /\.(mp4|webm|mov)$/i.test(f.name));
        if (!arquivos.length) {
            setErro("Selecione um vídeo MP4, WEBM ou MOV (até 50 MB).");
            return;
        }
        setErro("");
        onVideos?.([...pendentesVideo, ...arquivos]);
    }

    return (
        <div className="prd-midia">
            <strong>Fotos e vídeos do anúncio</strong>
            <p>
                Cadastre as fotos e o vídeo no produto. Ao salvar, o ERP envia automaticamente para Mercado Livre e Shopee — sem upload separado no marketplace.
            </p>
            {erro ? <p className="prd-midia-erro">{erro}</p> : null}
            <div className="prd-midia-grid">
                <label className="prd-midia-drop">
                    <ImagePlus size={18} />
                    <span>Fotos</span>
                    <small>JPG, PNG, WEBP · até 12</small>
                    <input
                        type="file"
                        accept="image/jpeg,image/png,image/webp,image/gif"
                        multiple
                        hidden
                        onChange={(e) => {
                            escolherFotos(e.target.files || []);
                            e.target.value = "";
                        }}
                    />
                </label>
                <label className="prd-midia-drop">
                    <Film size={18} />
                    <span>Vídeo</span>
                    <small>MP4 / WEBM / MOV · até 50 MB</small>
                    <input
                        type="file"
                        accept="video/mp4,video/webm,video/quicktime,.mp4,.webm,.mov"
                        hidden
                        onChange={(e) => {
                            escolherVideos(e.target.files || []);
                            e.target.value = "";
                        }}
                    />
                </label>
            </div>
            <label className="prd-midia-url">
                <Link2 size={14} />
                URL do vídeo (YouTube ou arquivo público)
                <input
                    value={urlVideo || ""}
                    onChange={(e) => onUrlVideo?.(e.target.value)}
                    placeholder="https://..."
                />
            </label>
            <ul className="prd-midia-lista">
                {fotos.map((item) => (
                    <li key={`f-${item.id}`}>
                        <img src={urlMidia(item.url)} alt={item.nome || "foto"} />
                        <button type="button" onClick={() => onRemoverSalvo?.(item)} aria-label="Remover foto">
                            <Trash2 size={14} />
                        </button>
                    </li>
                ))}
                {pendentesFoto.map((arquivo, i) => (
                    <li key={`pf-${arquivo.name}-${i}`}>
                        <img src={URL.createObjectURL(arquivo)} alt={arquivo.name} />
                        <button type="button" onClick={() => onFotos?.(pendentesFoto.filter((_, n) => n !== i))} aria-label="Remover foto">
                            <Trash2 size={14} />
                        </button>
                    </li>
                ))}
                {videos.map((item) => (
                    <li key={`v-${item.id}`} className="is-video">
                        {item.urlExterna || /^https?:/i.test(item.url || "") ? (
                            <a href={item.url} target="_blank" rel="noreferrer">{item.nome || "Vídeo"}</a>
                        ) : (
                            <video src={urlMidia(item.url)} muted />
                        )}
                        <button type="button" onClick={() => onRemoverSalvo?.(item)} aria-label="Remover vídeo">
                            <Trash2 size={14} />
                        </button>
                    </li>
                ))}
                {pendentesVideo.map((arquivo, i) => (
                    <li key={`pv-${arquivo.name}-${i}`} className="is-video">
                        <video src={URL.createObjectURL(arquivo)} muted />
                        <button type="button" onClick={() => onVideos?.(pendentesVideo.filter((_, n) => n !== i))} aria-label="Remover vídeo">
                            <Trash2 size={14} />
                        </button>
                    </li>
                ))}
            </ul>
            <fieldset className="prd-midia-canais">
                <legend>Publicar em</legend>
                {CANAIS.map((canal) => (
                    <label key={canal.id}>
                        <input
                            type="checkbox"
                            checked={canais.includes(canal.id)}
                            onChange={(e) => {
                                if (e.target.checked) {
                                    onCanais?.([...new Set([...canais, canal.id])]);
                                } else {
                                    onCanais?.(canais.filter((c) => c !== canal.id));
                                }
                            }}
                        />
                        {canal.nome}
                    </label>
                ))}
            </fieldset>
            {anuncios.length ? (
                <ul className="prd-midia-anuncios">
                    {anuncios.map((a) => (
                        <li key={a.id || a.codigo}>
                            <strong>{a.canal === "shopee" ? "Shopee" : "Mercado Livre"}</strong>
                            <span>{a.codigo} · {a.status}</span>
                            <small>{a.videoEnviado ? "vídeo enviado" : "sem vídeo"} · {a.mensagem}</small>
                        </li>
                    ))}
                </ul>
            ) : null}
        </div>
    );
}
