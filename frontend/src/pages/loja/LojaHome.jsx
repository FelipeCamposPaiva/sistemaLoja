import { useEffect, useMemo, useState } from "react";
import { Link, useOutletContext } from "react-router-dom";
import { ChevronLeft, ChevronRight, CreditCard, Lock, Truck } from "lucide-react";

import { catalogoVitrine, filtrarVitrine, marcasLoja, youtubeId } from "../../constants/loja";
import LojaCard from "./LojaCard";

const ICONE_SELO = {
    truck: Truck,
    card: CreditCard,
    lock: Lock
};

function Carrossel({ titulo, produtos, cfg }) {
    const [ini, setIni] = useState(0);
    const visiveis = produtos.slice(ini, ini + 5);
    if (!produtos.length) {
        return null;
    }
    return (
        <section className="lj-sec">
            <div className="lj-sec-head">
                <h2>{titulo}</h2>
                <div className="lj-arrows">
                    <button type="button" disabled={ini <= 0} onClick={() => setIni((n) => Math.max(0, n - 1))}>
                        <ChevronLeft size={18} />
                    </button>
                    <button
                        type="button"
                        disabled={ini + 5 >= produtos.length}
                        onClick={() => setIni((n) => Math.min(produtos.length - 5, n + 1))}
                    >
                        <ChevronRight size={18} />
                    </button>
                </div>
            </div>
            <div className="lj-track">
                {visiveis.map((p) => (
                    <LojaCard key={p.id} produto={p} cfg={cfg} />
                ))}
            </div>
        </section>
    );
}

export default function LojaHome() {
    const { cfg, pronto } = useOutletContext();
    const [lista, setLista] = useState([]);
    const [marcaIni, setMarcaIni] = useState(0);

    useEffect(() => {
        if (pronto) {
            setLista(catalogoVitrine());
        }
    }, [pronto]);

    const vitrines = useMemo(
        () => (cfg.vitrines || []).map((v) => ({ ...v, itens: filtrarVitrine(v, lista) })),
        [cfg.vitrines, lista]
    );
    const marcas = useMemo(() => {
        const cadastro = marcasLoja().map((m) => m.nome).filter(Boolean);
        const destaque = cfg.marcasDestaque || [];
        return [...new Set([...destaque, ...cadastro])].slice(0, 40);
    }, [cfg.marcasDestaque, pronto]);
    const marcasVisiveis = marcas.slice(marcaIni, marcaIni + 5);
    const yt = youtubeId(cfg.video?.link);
    const noVideo = cfg.video?.ativo && yt ? filtrarVitrine({ busca: cfg.video.busca, tipo: "busca" }, lista).slice(0, 4) : [];
    const t = cfg.textos || {};

    return (
        <>
            {(cfg.banners || []).filter((b) => b.ativo).map((banner) => (
                <Link key={banner.id} to={banner.link || "/"} className={`lj-hero lj-hero--${banner.estilo || "laser"}`}>
                    {banner.estilo === "laser" ? (
                        <>
                            <div className="lj-hero-art lj-hero-left" aria-hidden>
                                <span className="lj-pen is-a" />
                                <span className="lj-pen is-b" />
                                <span className="lj-pen is-c" />
                                <span className="lj-key" />
                            </div>
                            <div className="lj-hero-copy">
                                <em>{banner.titulo}</em>
                                <strong>LASER</strong>
                                <small>{banner.subtitulo}</small>
                            </div>
                            <div className="lj-hero-art lj-hero-right" aria-hidden>
                                <span className="lj-cup is-a" />
                                <span className="lj-cup is-b" />
                                <span className="lj-cup is-c" />
                            </div>
                        </>
                    ) : (
                        <div className="lj-hero-copa">
                            <span>DISPONÍVEL</span>
                            <h2>{banner.titulo}</h2>
                            <p>{banner.subtitulo}</p>
                        </div>
                    )}
                </Link>
            ))}

            <ul className="lj-selos">
                {(cfg.selos || []).map((selo) => {
                    const Icon = ICONE_SELO[selo.icone] || Truck;
                    return (
                        <li key={selo.id}>
                            <Icon size={22} />
                            <span>
                                <strong>{selo.titulo}</strong>
                                {selo.texto}
                            </span>
                        </li>
                    );
                })}
            </ul>

            <section className="lj-sec">
                <h2 className="lj-center">{t.escolhaCategorias || "Escolha por categorias"}</h2>
                <div className="lj-cats-grid">
                    {(cfg.categoriasDestaque || []).map((cat) => (
                        <Link
                            key={cat.id}
                            to={`/c/${encodeURIComponent(cat.grupo)}`}
                            className="lj-cat-tile"
                            style={{ background: cat.cor }}
                        >
                            {cat.icone ? <img src={cat.icone} alt="" /> : null}
                            {cat.nome}
                        </Link>
                    ))}
                </div>
            </section>

            {vitrines.map((v) => (
                <Carrossel key={v.id} titulo={v.titulo} produtos={v.itens} cfg={cfg} />
            ))}

            {cfg.video?.ativo && yt ? (
                <section className="lj-sec lj-video">
                    <h2 className="lj-center">{cfg.video.titulo}</h2>
                    <div className="lj-video-grid">
                        <div className="lj-video-frame">
                            <iframe
                                title={cfg.video.titulo}
                                src={`https://www.youtube.com/embed/${yt}`}
                                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                allowFullScreen
                            />
                        </div>
                        <div>
                            <h3>{cfg.video.produtosTxt}</h3>
                            <div className="lj-video-prods">
                                {noVideo.map((p) => <LojaCard key={p.id} produto={p} cfg={cfg} compacto />)}
                            </div>
                        </div>
                    </div>
                </section>
            ) : null}

            <section className="lj-sec">
                <div className="lj-sec-head">
                    <h2>{t.escolhaMarca || "Escolha pela marca"}</h2>
                    <div className="lj-arrows">
                        <button type="button" disabled={marcaIni <= 0} onClick={() => setMarcaIni((n) => Math.max(0, n - 1))}>
                            <ChevronLeft size={18} />
                        </button>
                        <button
                            type="button"
                            disabled={marcaIni + 5 >= marcas.length}
                            onClick={() => setMarcaIni((n) => n + 1)}
                        >
                            <ChevronRight size={18} />
                        </button>
                    </div>
                </div>
                <div className="lj-marcas">
                    {marcasVisiveis.map((nome) => (
                        <Link key={nome} to={`/busca?q=${encodeURIComponent(nome)}`} className="lj-marca">
                            {nome}
                        </Link>
                    ))}
                </div>
            </section>

            <section className="lj-sec">
                <h2 className="lj-center">{t.depoimentos || "Quem já comprou e recomenda"}</h2>
                <div className="lj-deps">
                    {(cfg.depoimentos || []).map((d) => {
                        const corpo = (
                            <>
                                {d.avatar ? <img src={d.avatar} alt="" className="lj-avatar" /> : null}
                                <p>“{d.texto}”</p>
                                <strong>{d.nome}</strong>
                                {d.cidade ? <small>{d.cidade}</small> : null}
                                <span>{"★".repeat(d.nota || 5)}</span>
                            </>
                        );
                        return d.link ? (
                            <a key={d.nome} href={d.link} target="_blank" rel="noopener noreferrer" className="lj-dep">
                                {corpo}
                            </a>
                        ) : (
                            <article key={d.nome} className="lj-dep">{corpo}</article>
                        );
                    })}
                </div>
            </section>
        </>
    );
}
