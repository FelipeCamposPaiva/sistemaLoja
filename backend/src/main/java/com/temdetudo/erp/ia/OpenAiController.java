package com.temdetudo.erp.ia;

import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/ia")
@CrossOrigin(origins = "*")
public class OpenAiController {

    private final OpenAiService openai;

    public OpenAiController(OpenAiService openai) {
        this.openai = openai;
    }

    @GetMapping("/status")
    public Map<String, Object> status() {
        return openai.status();
    }

    @PostMapping("/credenciais")
    public Map<String, Object> salvar(@RequestBody OpenAiCredenciais credenciais) {
        try {
            openai.salvar(credenciais == null ? new OpenAiCredenciais() : credenciais);
            Map<String, Object> saida = openai.status();
            saida.put("ok", true);
            return saida;
        } catch (IllegalArgumentException e) {
            return Map.of("ok", false, "mensagem", e.getMessage());
        }
    }

    @PostMapping("/testar")
    public Map<String, Object> testar() {
        return openai.testar();
    }

    @PostMapping("/chat")
    public Map<String, Object> chat(@RequestBody(required = false) ChatPedido corpo) {
        return openai.conversar(corpo == null ? List.of() : corpo.historico());
    }
}
