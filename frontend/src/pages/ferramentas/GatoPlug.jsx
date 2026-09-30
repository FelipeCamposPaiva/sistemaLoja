export default function GatoPlug({ lupa = false }) {
    return (
        <svg className="fer-gato" viewBox="0 0 140 110" aria-hidden>
            <ellipse cx="70" cy="98" rx="38" ry="7" fill="#1a1a1e" />
            <path d="M46 38 l10-22 8 16 M94 38 l-10-22 -8 16" fill="#f4f4f5" />
            <ellipse cx="70" cy="58" rx="32" ry="28" fill="#f4f4f5" />
            <circle cx="58" cy="54" r="4" fill="#18181b" />
            <circle cx="82" cy="54" r="4" fill="#18181b" />
            <path d="M66 64 h8 l-4 5z" fill="#f97316" />
            <path d="M48 78 q22 16 44 0" fill="none" stroke="#d4d4d8" strokeWidth="3" />
            {lupa ? (
                <g>
                    <circle cx="108" cy="78" r="14" fill="none" stroke="#3b82f6" strokeWidth="4" />
                    <path d="M118 88 l12 12" stroke="#3b82f6" strokeWidth="4" strokeLinecap="round" />
                </g>
            ) : (
                <g>
                    <rect x="96" y="70" width="22" height="14" rx="3" fill="#3b82f6" />
                    <path d="M107 70 v-10" stroke="#3b82f6" strokeWidth="3" />
                    <circle cx="107" cy="56" r="5" fill="none" stroke="#3b82f6" strokeWidth="3" />
                </g>
            )}
        </svg>
    );
}
