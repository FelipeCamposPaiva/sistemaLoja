import api from "./api";

export async function statusChatGpt() {
    const { data } = await api.get("/ia/status");
    return data;
}

export async function salvarChatGpt(payload) {
    const { data } = await api.post("/ia/credenciais", payload);
    return data;
}

export async function testarChatGpt() {
    const { data } = await api.post("/ia/testar", {}, { timeout: 45000 });
    return data;
}

export async function conversarChatGpt(messages) {
    const { data } = await api.post("/ia/chat", { messages }, { timeout: 60000 });
    return data;
}
