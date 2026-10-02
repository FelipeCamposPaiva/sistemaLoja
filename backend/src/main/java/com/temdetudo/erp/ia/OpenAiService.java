package com.temdetudo.erp.ia;

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
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@Service
public class OpenAiService {

    private static final Path ARQUIVO = Path.of("data", "openai.json");
    private static final String SISTEMA = """
            Você é o assistente do ERP Tem de Tudo, papelaria, presentes e personalizados em Búzios/RJ.
            Responda em português, de forma objetiva, para quem usa o sistema no dia a dia:
            cadastros, estoque, vendas, PDV, OS, financeiro e loja.
            Se faltar dado no sistema, diga o que conferir na tela. Não invente saldos, notas ou preços.
            """;

    private final ObjectMapper mapper;
    private final RestClient http;
    private final String fallbackKey;
    private final String fallbackModelo;

    public OpenAiService(
            ObjectMapper mapper,
            @Value("${openai.api-key:}") String fallbackKey,
            @Value("${openai.model:gpt-4o-mini}") String fallbackModelo
    ) {
        this.mapper = mapper;
        this.fallbackKey = fallbackKey == null ? "" : fallbackKey.trim();
        this.fallbackModelo = fallbackModelo == null || fallbackModelo.isBlank() ? "gpt-4o-mini" : fallbackModelo.trim();
        this.http = RestClient.builder()
                .baseUrl("https://api.openai.com/v1")
                .build();
    }

    public OpenAiCredenciais credenciais() {
        OpenAiCredenciais arquivo = lerArquivo();
        if (arquivo.preenchida()) {
            return arquivo;
        }
        OpenAiCredenciais env = new OpenAiCredenciais();
        env.setApiKey(fallbackKey);
        env.setModelo(fallbackModelo);
        return env;
    }

    public synchronized void salvar(OpenAiCredenciais novas) {
        OpenAiCredenciais atual = credenciais();
        if (novas.getApiKey() == null || novas.getApiKey().isBlank() || novas.getApiKey().contains("…")) {
            novas.setApiKey(atual.getApiKey());
        }
        if (!novas.preenchida()) {
            throw new IllegalArgumentException("Cole a chave da API da OpenAI (começa com sk-).");
        }
        try {
            Files.createDirectories(ARQUIVO.getParent());
            mapper.writerWithDefaultPrettyPrinter().writeValue(ARQUIVO.toFile(), novas);
        } catch (IllegalArgumentException e) {
            throw e;
        } catch (Exception e) {
            throw new IllegalStateException("Não foi possível gravar a chave do ChatGPT.", e);
        }
    }

    public Map<String, Object> status() {
        OpenAiCredenciais cred = credenciais();
        Map<String, Object> saida = new LinkedHashMap<>();
        saida.put("configurado", cred.preenchida());
        saida.put("modelo", cred.getModelo());
        saida.put("mascara", mascarar(cred.getApiKey()));
        if (!cred.preenchida()) {
            saida.put("mensagem", "Cole a chave da API em Integrações → ChatGPT. Ela sai de platform.openai.com, com o mesmo e-mail da sua conta.");
        }
        return saida;
    }

    public Map<String, Object> testar() {
        return conversar(List.of(Map.of("role", "user", "content", "Responda só: ok")));
    }

    public Map<String, Object> conversar(List<Map<String, String>> historico) {
        Map<String, Object> saida = new LinkedHashMap<>();
        OpenAiCredenciais cred = credenciais();
        if (!cred.preenchida()) {
            saida.put("ok", false);
            saida.put("mensagem", "ChatGPT ainda não está conectado. Abra Integrações e cole a chave da API.");
            return saida;
        }
        List<Map<String, String>> mensagens = new ArrayList<>();
        mensagens.add(Map.of("role", "system", "content", SISTEMA));
        if (historico != null) {
            for (Map<String, String> item : historico) {
                String papel = item.getOrDefault("role", "user");
                String texto = item.getOrDefault("content", "");
                if (texto.isBlank()) {
                    continue;
                }
                if (!"user".equals(papel) && !"assistant".equals(papel)) {
                    papel = "user";
                }
                mensagens.add(Map.of("role", papel, "content", texto));
            }
        }
        if (mensagens.size() < 2) {
            saida.put("ok", false);
            saida.put("mensagem", "Escreva uma pergunta.");
            return saida;
        }
        try {
            Map<String, Object> corpo = Map.of(
                    "model", cred.getModelo(),
                    "temperature", 0.4,
                    "messages", mensagens
            );
            ResponseEntity<String> resp = http.post()
                    .uri("/chat/completions")
                    .header("Authorization", "Bearer " + cred.getApiKey())
                    .contentType(MediaType.APPLICATION_JSON)
                    .body(corpo)
                    .retrieve()
                    .toEntity(String.class);
            JsonNode json = mapper.readTree(resp.getBody() == null ? "{}" : resp.getBody());
            String texto = json.path("choices").path(0).path("message").path("content").asText("");
            if (texto.isBlank()) {
                saida.put("ok", false);
                saida.put("mensagem", "A OpenAI não devolveu texto. Confira o modelo e o saldo da conta.");
                return saida;
            }
            saida.put("ok", true);
            saida.put("resposta", texto.trim());
            saida.put("modelo", json.path("model").asText(cred.getModelo()));
        } catch (RestClientResponseException e) {
            saida.put("ok", false);
            saida.put("mensagem", mensagemOpenAi(e));
        } catch (Exception e) {
            saida.put("ok", false);
            saida.put("mensagem", e.getMessage() == null ? "Falha ao falar com o ChatGPT." : e.getMessage());
        }
        return saida;
    }

    private OpenAiCredenciais lerArquivo() {
        try {
            if (!Files.exists(ARQUIVO)) {
                return new OpenAiCredenciais();
            }
            return mapper.readValue(ARQUIVO.toFile(), OpenAiCredenciais.class);
        } catch (Exception e) {
            return new OpenAiCredenciais();
        }
    }

    private static String mascarar(String chave) {
        if (chave == null || chave.length() < 8) {
            return "";
        }
        return chave.substring(0, 3) + "…" + chave.substring(chave.length() - 4);
    }

    private static String mensagemOpenAi(RestClientResponseException e) {
        String corpo = e.getResponseBodyAsString();
        if (corpo != null && corpo.contains("incorrect api key")) {
            return "Chave inválida. Gere outra em platform.openai.com/api-keys.";
        }
        if (corpo != null && corpo.contains("insufficient_quota")) {
            return "Sem crédito na conta da OpenAI. Recarregue o saldo em Billing.";
        }
        if (e.getStatusCode().value() == 401) {
            return "A OpenAI recusou a chave. Confira se copiou inteira (sk-...).";
        }
        return "OpenAI HTTP " + e.getStatusCode().value();
    }
}
