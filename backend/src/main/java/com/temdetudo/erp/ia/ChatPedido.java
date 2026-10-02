package com.temdetudo.erp.ia;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;

public class ChatPedido {

    private List<Map<String, String>> messages;
    private String mensagem;

    public List<Map<String, String>> getMessages() {
        return messages;
    }

    public void setMessages(List<Map<String, String>> messages) {
        this.messages = messages;
    }

    public String getMensagem() {
        return mensagem;
    }

    public void setMensagem(String mensagem) {
        this.mensagem = mensagem;
    }

    public List<Map<String, String>> historico() {
        if (messages != null && !messages.isEmpty()) {
            return messages;
        }
        if (mensagem != null && !mensagem.isBlank()) {
            List<Map<String, String>> unica = new ArrayList<>();
            unica.add(Map.of("role", "user", "content", mensagem.trim()));
            return unica;
        }
        return List.of();
    }
}
