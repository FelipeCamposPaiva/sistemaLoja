export default function LogoMarca({ url, nome = "Tem de Tudo" }) {
    if (url) {
        return <img src={url} alt={nome} className="lj-logo-img" />;
    }
    return (
        <svg className="lj-logo-svg" viewBox="0 0 220 72" role="img" aria-label={nome}>
            <text x="8" y="34" fill="#ff2f92" fontFamily="Nunito, Trebuchet MS, sans-serif" fontSize="28" fontWeight="800">
                TEM
            </text>
            <text x="78" y="34" fill="#7c3aed" fontFamily="Nunito, Trebuchet MS, sans-serif" fontSize="14" fontWeight="800">
                DE
            </text>
            <text x="8" y="62" fill="#ec4899" fontFamily="Nunito, Trebuchet MS, sans-serif" fontSize="28" fontWeight="800">
                TUDO
            </text>
            <circle cx="198" cy="18" r="7" fill="#facc15" />
            <circle cx="186" cy="8" r="4" fill="#fb7185" />
            <rect x="168" y="28" width="36" height="28" rx="6" fill="#f472b6" />
            <rect x="176" y="36" width="20" height="14" rx="3" fill="#fff" />
        </svg>
    );
}
