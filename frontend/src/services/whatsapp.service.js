import api from "./api";

export function statusWhatsapp() {
    return api.get("/whatsapp/status").then((res) => res.data);
}

export function qrCodeWhatsapp() {
    return api.get("/whatsapp/qrcode").then((res) => res.data);
}

export function salvarCredenciaisZapi(dados) {
    return api.post("/whatsapp/credenciais", dados).then((res) => res.data);
}

export function enviarWhatsapp(phone, texto) {
    return api.post("/whatsapp/enviar", { phone, texto }).then((res) => res.data);
}

export function mensagensWhatsapp() {
    return api.get("/whatsapp/mensagens").then((res) => res.data);
}

export function desconectarWhatsapp() {
    return api.post("/whatsapp/desconectar").then((res) => res.data);
}

export function telefoneChave(valor) {
    const d = String(valor || "").replace(/\D/g, "");
    if (d.startsWith("55") && d.length > 11) {
        return d.slice(2);
    }
    return d;
}
