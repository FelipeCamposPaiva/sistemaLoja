import { useEffect, useState } from "react";
import QRCode from "qrcode";

export default function QrImagem({ valor, tamanho = 180, alt = "QR Code" }) {
    const [src, setSrc] = useState("");

    useEffect(() => {
        let vivo = true;
        if (!valor) {
            setSrc("");
            return undefined;
        }
        QRCode.toDataURL(valor, { margin: 1, width: tamanho, errorCorrectionLevel: "M" })
            .then((url) => {
                if (vivo) {
                    setSrc(url);
                }
            })
            .catch(() => {
                if (vivo) {
                    setSrc("");
                }
            });
        return () => {
            vivo = false;
        };
    }, [valor, tamanho]);

    if (!src) {
        return null;
    }
    return <img className="mq-qr" src={src} width={tamanho} height={tamanho} alt={alt} />;
}
