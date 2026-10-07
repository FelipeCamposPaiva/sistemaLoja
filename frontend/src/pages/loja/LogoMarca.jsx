export default function LogoMarca({ url, nome = "Tem de Tudo" }) {
    if (url) {
        return <img src={url} alt={nome} className="lj-logo-img" />;
    }
    return (
        <svg className="lj-logo-svg" viewBox="0 0 250 72" role="img" aria-label={nome}>
            <path d="M34 22c-8-12-22-8-18 2 3 6 10 8 16 6" fill="#fb7185" />
            <path d="M40 22c8-12 22-8 18 2-3 6-10 8-16 6" fill="#fde68a" />
            <path d="M36 26c2 4 6 4 8 0" fill="none" stroke="#fff" strokeWidth="2" />
            <rect x="18" y="30" width="40" height="30" rx="6" fill="#ff4d9a" />
            <rect x="34" y="30" width="8" height="30" fill="#fbcfe8" />
            <rect x="16" y="26" width="44" height="8" rx="3" fill="#f43f8a" />
            <rect x="34" y="26" width="8" height="8" fill="#fff" opacity="0.75" />
            <text x="72" y="34" fill="#ff2f92" fontFamily="Anek Latin, Nunito, sans-serif" fontSize="26" fontWeight="800">
                TEM
            </text>
            <text x="72" y="58" fill="#ec4899" fontFamily="Anek Latin, Nunito, sans-serif" fontSize="22" fontWeight="800">
                DE TUDO
            </text>
            <circle cx="148" cy="16" r="4" fill="#fde68a" />
            <circle cx="228" cy="48" r="3.5" fill="#c4b5fd" />
        </svg>
    );
}
