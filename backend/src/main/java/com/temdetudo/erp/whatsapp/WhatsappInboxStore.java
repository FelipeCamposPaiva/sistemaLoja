package com.temdetudo.erp.whatsapp;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;

import org.springframework.stereotype.Component;

import java.nio.file.Files;
import java.nio.file.Path;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.CopyOnWriteArrayList;

@Component
public class WhatsappInboxStore {

    private static final Path ARQUIVO = Path.of("data", "whatsapp-inbox.json");
    private final ObjectMapper mapper;
    private final CopyOnWriteArrayList<WhatsappMensagem> mensagens = new CopyOnWriteArrayList<>();

    public WhatsappInboxStore(ObjectMapper mapper) {
        this.mapper = mapper;
        carregar();
    }

    public List<WhatsappMensagem> listar() {
        return List.copyOf(mensagens);
    }

    public WhatsappMensagem adicionar(String phone, String nome, String texto, boolean deLoja) {
        WhatsappMensagem msg = new WhatsappMensagem();
        msg.setId(UUID.randomUUID().toString());
        msg.setPhone(soDigitos(phone));
        msg.setNome(nome == null || nome.isBlank() ? msg.getPhone() : nome);
        msg.setTexto(texto == null ? "" : texto);
        msg.setDeLoja(deLoja);
        msg.setEm(Instant.now().toString());
        mensagens.add(msg);
        gravar();
        return msg;
    }

    public void receberWebhook(Map<String, Object> corpo) {
        if (corpo == null) {
            return;
        }
        Object tipo = primeiro(corpo, "type", "Type");
        if (tipo != null && String.valueOf(tipo).toLowerCase().contains("delivery")) {
            return;
        }
        boolean deLoja = bool(primeiro(corpo, "fromMe", "fromme"));
        String phone = String.valueOf(primeiro(corpo, "phone", "Phone", "from"));
        String nome = String.valueOf(primeiro(corpo, "senderName", "chatName", "notification"));
        String texto = extrairTexto(corpo);
        if (texto.isBlank() || soDigitos(phone).isBlank()) {
            return;
        }
        adicionar(phone, "null".equals(nome) ? phone : nome, texto, deLoja);
    }

    private String extrairTexto(Map<String, Object> corpo) {
        Object direto = primeiro(corpo, "message", "text");
        if (direto instanceof Map<?, ?> mapa) {
            Object inner = mapa.get("message");
            if (inner != null) {
                return String.valueOf(inner);
            }
            Object conversation = mapa.get("conversation");
            if (conversation != null) {
                return String.valueOf(conversation);
            }
        }
        if (direto != null && !(direto instanceof Map<?, ?>)) {
            return String.valueOf(direto);
        }
        Object text = corpo.get("text");
        if (text instanceof Map<?, ?> mapa) {
            Object inner = mapa.get("message");
            if (inner != null) {
                return String.valueOf(inner);
            }
        }
        return "";
    }

    private static Object primeiro(Map<String, Object> mapa, String... chaves) {
        for (String chave : chaves) {
            if (mapa.containsKey(chave) && mapa.get(chave) != null) {
                return mapa.get(chave);
            }
        }
        return null;
    }

    private static boolean bool(Object valor) {
        if (valor instanceof Boolean b) {
            return b;
        }
        return "true".equalsIgnoreCase(String.valueOf(valor));
    }

    static String soDigitos(String valor) {
        if (valor == null) {
            return "";
        }
        return valor.replaceAll("\\D", "");
    }

    private void carregar() {
        try {
            if (!Files.exists(ARQUIVO)) {
                return;
            }
            List<WhatsappMensagem> lista = mapper.readValue(ARQUIVO.toFile(), new TypeReference<>() {});
            mensagens.clear();
            mensagens.addAll(lista == null ? List.of() : lista);
        } catch (Exception ignored) {
            /* inbox vazio */
        }
    }

    private void gravar() {
        try {
            Files.createDirectories(ARQUIVO.getParent());
            List<WhatsappMensagem> recorte = new ArrayList<>(mensagens);
            if (recorte.size() > 800) {
                recorte = recorte.subList(recorte.size() - 800, recorte.size());
                mensagens.clear();
                mensagens.addAll(recorte);
            }
            mapper.writerWithDefaultPrettyPrinter().writeValue(ARQUIVO.toFile(), recorte);
        } catch (Exception ignored) {
            /* não bloqueia o atendimento */
        }
    }
}
