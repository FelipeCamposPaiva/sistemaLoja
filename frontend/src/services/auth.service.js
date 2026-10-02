import api from "./api";

export function loginApi(login, senha) {
    return api.post("/auth/login", { login, senha }).then((res) => res.data);
}

export function verificar2faApi(login, codigo) {
    return api.post("/auth/verificar-2fa", { login, codigo }).then((res) => res.data);
}

export function recuperarSenhaApi(email) {
    return api.post("/auth/recuperar", { email }).then((res) => res.data);
}

export function redefinirSenhaApi(email, codigo, senhaNova) {
    return api.post("/auth/redefinir", { email, codigo, senhaNova }).then((res) => res.data);
}

export function alterarSenhaApi(senhaAtual, senhaNova) {
    return api.put("/auth/senha", { senhaAtual, senhaNova }).then((res) => res.data);
}

export function iniciar2faApi() {
    return api.post("/auth/2fa/iniciar").then((res) => res.data);
}

export function confirmar2faApi(codigo) {
    return api.post("/auth/2fa/confirmar", { codigo }).then((res) => res.data);
}

export function desativar2faApi(senha) {
    return api.post("/auth/2fa/desativar", { senha }).then((res) => res.data);
}

export function meApi() {
    return api.get("/auth/me").then((res) => res.data);
}
