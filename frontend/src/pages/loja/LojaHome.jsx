import { useEffect, useMemo, useState } from "react";
import { Link, useOutletContext } from "react-router-dom";
import { ChevronLeft, ChevronRight, CreditCard, Gift, Lock, Sparkles, Truck } from "lucide-react";

import { catalogoVitrine, filtrarVitrine, marcasLoja, youtubeId } from "../../constants/loja";
import LojaCard from "./LojaCard";
import { ArteCaneca, ArteCanetas, ArteCategoria, ArteChaveiro } from "./LojaVitrineArte";

const ICONE_SELO = {
    truck: Truck,
    card: CreditCard,
    lock: Lock,
    gift: Gift
};

function linkVitrine(vitrine) {
    if (vitrine.grupo) {
        return `/c/${encodeURIComponent(vitrine.grupo)}`;
    }
    if (vitrine.busca) {
        const termo = String(vitrine.busca).split("|")[0];
        return `/busca?q=${encodeURIComponent(termo)}`;
    }
    return "/busca";
}

function Carrossel({ vitrine, produtos, cfg }) {
    const [ini, setIni] = useState(0);
    const visiveis = produtos.slice(ini, ini + 5);
    if (!produtos.length) {
        return null;
    }
    return (
        <section className="lj-sec">
            <div className="lj-sec-head">
                <h2>{vitrine.titulo}</h2>
                <div className="lj-sec-tools">
                    <div className="lj-arrows">
                        <button type="button" disabled={ini <= 0} onClick={() => setIni((n) => Math.max(0, n - 1))} aria-label="Anterior">
                            <ChevronLeft size={18} />
                        </button>
                        <button
                            type="button"
                            disabled={ini + 5 >= produtos.length}
                            onClick={() => setIni((n) => Math.min(produtos.length - 5, n + 1))}
                            aria-label="Próximo"
                        >
                            <ChevronRight size={18} />
                        </button>
                    </div>
                    <Link to={linkVitrine(vitrine)} className="lj-ver-todos">Ver todos</Link>
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
    const { cfg, pronto, revisao = 0 } = useOutletContext();
    const [lista, setLista] = useState([]);
    const [marcaIni, setMarcaIni] = useState(0);

    useEffect(() => {
        if (pronto) {
            setLista(catalogoVitrine());
        }
    }, [pronto, revisao]);

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
                <Link
                    key={banner.id}
                    to={banner.link || "/"}
                    className={`lj-hero lj-hero--${banner.estilo || "laser"}`}
                    aria-label={`${banner.titulo}. Ver produtos`}
                >
                    {banner.estilo === "laser" ? (
                        <>
                            <div className="lj-hero-deco" aria-hidden="true">
                                <span className="lj-blob is-a" />
                                <span className="lj-blob is-b" />
                                <span className="lj-float-heart is-h1" />
                                <span className="lj-float-heart is-h2" />
                                <span className="lj-float-heart is-h3" />
                                <span className="lj-star is-s1" />
                                <span className="lj-star is-s2" />
                                <span className="lj-star is-s3" />
                                <span className="lj-dash is-d1" />
                                <span className="lj-dash is-d2" />
                            </div>
                            <div className="lj-hero-stage">
                                <div className="lj-hero-side is-left">
                                    <ArteCaneca />
                                </div>
                                <div className="lj-hero-copy">
                                    <em>{banner.titulo}</em>
                                    <strong>LASER</strong>
                                    <b>com a sua marca</b>
                                    <small>{banner.subtitulo}</small>
                                    <span className="lj-hero-cta">Ver produtos <ChevronRight size={16} /></span>
                                </div>
                                <div className="lj-hero-side is-right">
                                    <ArteChaveiro />
                                    <ArteCanetas />
                                </div>
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
                <h2 className="lj-center lj-spark">
                    <Sparkles size={18} />
                    {t.escolhaCategorias || "Escolha por categorias"}
                    <Sparkles size={18} />
                </h2>
                <div className="lj-cats-grid">
                    {(cfg.categoriasDestaque || []).map((cat) => (
                        <Link
                            key={cat.id}
                            to={`/c/${encodeURIComponent(cat.grupo)}`}
                            className="lj-cat-tile"
                            style={{ background: cat.cor }}
                        >
                            <ArteCategoria id={cat.id} />
                            <span className="lj-cat-nome">{cat.nome}</span>
                            <span className="lj-cat-go" aria-hidden="true">
                                <ChevronRight size={16} />
                            </span>
                        </Link>
                    ))}
                </div>
            </section>

            {vitrines.map((v) => (
                <Carrossel key={v.id} vitrine={v} produtos={v.itens} cfg={cfg} />
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
                        <div className="lj-video-side">
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
