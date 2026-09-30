package com.temdetudo.erp.whatsapp;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/whatsapp")
@CrossOrigin(origins = "*")
public class WhatsappController {

    private final ZapiService zapi;
    private final WhatsappInboxStore inbox;

    public WhatsappController(ZapiService zapi, WhatsappInboxStore inbox) {
        this.zapi = zapi;
        this.inbox = inbox;
    }

    @GetMapping("/status")
    public Map<String, Object> status() {
        return zapi.status();
    }

    @GetMapping("/qrcode")
    public Map<String, Object> qr() {
        return zapi.qrCode();
    }

    @PostMapping("/credenciais")
    public Map<String, Object> salvar(@RequestBody ZapiCredenciais credenciais) {
        if (credenciais == null || !credenciais.preenchida()) {
            return Map.of("ok", false, "mensagem", "Preencha Instance ID, Token e Client-Token.");
        }
        zapi.salvar(credenciais);
        return Map.of("ok", true);
    }

    @PostMapping("/enviar")
    public Map<String, Object> enviar(@RequestBody Map<String, String> corpo) {
        return zapi.enviar(corpo.get("phone"), corpo.get("texto") == null ? corpo.get("message") : corpo.get("texto"));
    }

    @PostMapping("/desconectar")
    public Map<String, Object> desconectar() {
        return zapi.desconectar();
    }

    @GetMapping("/mensagens")
    public List<WhatsappMensagem> mensagens() {
        return inbox.listar();
    }

    @PostMapping("/webhook")
    public ResponseEntity<Map<String, String>> webhook(@RequestBody(required = false) Map<String, Object> corpo) {
        inbox.receberWebhook(corpo == null ? Map.of() : corpo);
        return ResponseEntity.ok(Map.of("ok", "true"));
    }
}
