package com.temdetudo.erp.whatsapp;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientResponseException;

import java.nio.file.Files;
import java.nio.file.Path;
import java.util.LinkedHashMap;
import java.util.Map;

@Service
public class ZapiService {

    private static final Path ARQUIVO = Path.of("data", "zapi.json");

    private final ObjectMapper mapper;
    private final WhatsappInboxStore inbox;
    private final String baseUrl;
    private final ZapiCredenciais fallback = new ZapiCredenciais();

    public ZapiService(
            ObjectMapper mapper,
            WhatsappInboxStore inbox,
            @Value("${zapi.base-url:https://api.z-api.io}") String baseUrl,
            @Value("${zapi.instance-id:}") String instanceId,
            @Value("${zapi.token:}") String token,
            @Value("${zapi.client-token:}") String clientToken
    ) {
        this.mapper = mapper;
        this.inbox = inbox;
        this.baseUrl = baseUrl.endsWith("/") ? baseUrl.substring(0, baseUrl.length() - 1) : baseUrl;
        fallback.setInstanceId(instanceId);
        fallback.setToken(token);
        fallback.setClientToken(clientToken);
    }

    public ZapiCredenciais credenciais() {
        ZapiCredenciais arquivo = lerArquivo();
        if (arquivo.preenchida()) {
            return arquivo;
        }
        return fallback;
    }

    public synchronized void salvar(ZapiCredenciais novas) {
        try {
            Files.createDirectories(ARQUIVO.getParent());
            mapper.writerWithDefaultPrettyPrinter().writeValue(ARQUIVO.toFile(), novas);
        } catch (Exception e) {
            throw new IllegalStateException("Não foi possível gravar as credenciais da Z-API.", e);
        }
    }

    public Map<String, Object> status() {
        Map<String, Object> saida = new LinkedHashMap<>();
        ZapiCredenciais cred = credenciais();
        saida.put("configurado", cred.preenchida());
        saida.put("instanceId", cred.getInstanceId());
        if (!cred.preenchida()) {
            saida.put("conectado", false);
            saida.put("mensagem", "Informe Instance ID, Token e Client-Token da Z-API.");
            return saida;
        }
        try {
            JsonNode json = get("/status");
            boolean conectado = json.path("connected").asBoolean(false)
                    || json.path("smartphoneConnected").asBoolean(false);
            saida.put("conectado", conectado);
            saida.put("smartphone", json.path("smartphoneConnected").asBoolean(false));
            saida.put("erro", json.path("error").asText(""));
            saida.put("bruto", mapper.convertValue(json, Map.class));
        } catch (Exception e) {
            saida.put("conectado", false);
            saida.put("mensagem", e.getMessage());
        }
        return saida;
    }

    public Map<String, Object> qrCode() {
        Map<String, Object> saida = new LinkedHashMap<>();
        ZapiCredenciais cred = credenciais();
        if (!cred.preenchida()) {
            saida.put("ok", false);
            saida.put("mensagem", "Credenciais da Z-API não configuradas.");
            return saida;
        }
        try {
            JsonNode json = get("/qr-code");
            String value = json.path("value").asText("");
            if (value.isBlank()) {
                value = json.path("qrcode").asText("");
            }
            saida.put("ok", true);
            saida.put("imagem", value);
            saida.put("conectado", json.path("connected").asBoolean(false));
        } catch (Exception e) {
            saida.put("ok", false);
            saida.put("mensagem", e.getMessage());
        }
        return saida;
    }

    public Map<String, Object> enviar(String phone, String texto) {
        Map<String, Object> saida = new LinkedHashMap<>();
        String numero = WhatsappInboxStore.soDigitos(phone);
        if (numero.isBlank() || texto == null || texto.isBlank()) {
            saida.put("ok", false);
            saida.put("mensagem", "Informe telefone e mensagem.");
            return saida;
        }
        if (!numero.startsWith("55")) {
            numero = "55" + numero;
        }
        try {
            Map<String, String> corpo = Map.of("phone", numero, "message", texto);
            JsonNode json = post("/send-text", corpo);
            inbox.adicionar(numero, numero, texto, true);
            saida.put("ok", true);
            saida.put("zaapId", json.path("zaapId").asText(json.path("messageId").asText("")));
            saida.put("phone", numero);
        } catch (Exception e) {
            saida.put("ok", false);
            saida.put("mensagem", e.getMessage());
        }
        return saida;
    }

    public Map<String, Object> desconectar() {
        Map<String, Object> saida = new LinkedHashMap<>();
        try {
            get("/disconnect");
            saida.put("ok", true);
        } catch (Exception e) {
            saida.put("ok", false);
            saida.put("mensagem", e.getMessage());
        }
        return saida;
    }

    private ZapiCredenciais lerArquivo() {
        try {
            if (!Files.exists(ARQUIVO)) {
                return new ZapiCredenciais();
            }
            return mapper.readValue(ARQUIVO.toFile(), ZapiCredenciais.class);
        } catch (Exception e) {
            return new ZapiCredenciais();
        }
    }

    private RestClient cliente() {
        ZapiCredenciais cred = credenciais();
        if (!cred.preenchida()) {
            throw new IllegalStateException("Z-API não configurada.");
        }
        return RestClient.builder()
                .baseUrl(baseUrl + "/instances/" + cred.getInstanceId() + "/token/" + cred.getToken())
                .defaultHeader("Client-Token", cred.getClientToken())
                .build();
    }

    private JsonNode get(String caminho) {
        return executar(() -> cliente().get().uri(caminho).retrieve().toEntity(String.class));
    }

    private JsonNode post(String caminho, Object corpo) {
        return executar(() -> cliente().post()
                .uri(caminho)
                .contentType(MediaType.APPLICATION_JSON)
                .body(corpo)
                .retrieve()
                .toEntity(String.class));
    }

    private JsonNode executar(java.util.function.Supplier<ResponseEntity<String>> chamada) {
        try {
            ResponseEntity<String> resp = chamada.get();
            String body = resp.getBody();
            if (body == null || body.isBlank()) {
                return mapper.createObjectNode();
            }
            return mapper.readTree(body);
        } catch (RestClientResponseException e) {
            throw new IllegalStateException(textoErro(e.getResponseBodyAsString(), e.getStatusCode().value()), e);
        } catch (Exception e) {
            throw new IllegalStateException(e.getMessage(), e);
        }
    }

    private String textoErro(String body, int status) {
        if (body == null || body.isBlank()) {
            return "Z-API HTTP " + status;
        }
        try {
            JsonNode json = mapper.readTree(body);
            if (json.has("message")) {
                return json.get("message").asText();
            }
            if (json.has("error")) {
                return json.get("error").asText();
            }
        } catch (Exception ignored) {
            /* texto cru */
        }
        return body.length() > 280 ? body.substring(0, 280) : body;
    }
}
