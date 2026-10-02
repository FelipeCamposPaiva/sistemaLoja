package com.temdetudo.erp.controller;

import com.temdetudo.erp.dto.AlterarSenhaRequest;
import com.temdetudo.erp.dto.LoginRequest;
import com.temdetudo.erp.dto.LoginResponse;
import com.temdetudo.erp.dto.RecuperarSenhaRequest;
import com.temdetudo.erp.dto.RedefinirSenhaRequest;
import com.temdetudo.erp.dto.Verificar2faRequest;
import com.temdetudo.erp.entity.Usuario;
import com.temdetudo.erp.security.UsuarioAtual;
import com.temdetudo.erp.service.AuthService;

import jakarta.validation.Valid;

import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/auth")
@CrossOrigin(origins = "*")
public class AuthController {

    private final AuthService authService;

    public AuthController(AuthService authService) {
        this.authService = authService;
    }

    @PostMapping("/login")
    public ResponseEntity<LoginResponse> login(@Valid @RequestBody LoginRequest request) {
        return ResponseEntity.ok(authService.login(request));
    }

    @PostMapping("/verificar-2fa")
    public ResponseEntity<LoginResponse> verificar2fa(@Valid @RequestBody Verificar2faRequest request) {
        return ResponseEntity.ok(authService.verificar2fa(request.getLogin(), request.getCodigo()));
    }

    @PostMapping("/recuperar")
    public ResponseEntity<Map<String, String>> recuperar(@Valid @RequestBody RecuperarSenhaRequest request) {
        return ResponseEntity.ok(authService.recuperar(request.getEmail()));
    }

    @PostMapping("/redefinir")
    public ResponseEntity<Map<String, String>> redefinir(@Valid @RequestBody RedefinirSenhaRequest request) {
        authService.redefinir(request.getEmail(), request.getCodigo(), request.getSenhaNova());
        return ResponseEntity.ok(Map.of("mensagem", "Senha redefinida. Entre com a nova senha."));
    }

    @PostMapping("/registrar")
    public ResponseEntity<Usuario> registrar(@RequestBody Usuario usuario) {
        return ResponseEntity.ok(authService.salvar(usuario));
    }

    @GetMapping("/me")
    public ResponseEntity<LoginResponse> me() {
        Usuario usuario = UsuarioAtual.obter()
                .orElseThrow(() -> new BadCredentialsException("Sessão expirada."));
        return ResponseEntity.ok(authService.me(usuario));
    }

    @PutMapping("/senha")
    public ResponseEntity<LoginResponse> senha(@Valid @RequestBody AlterarSenhaRequest request) {
        Usuario usuario = UsuarioAtual.obter()
                .orElseThrow(() -> new BadCredentialsException("Sessão expirada."));
        return ResponseEntity.ok(authService.alterarSenha(usuario, request.getSenhaAtual(), request.getSenhaNova()));
    }

    @PostMapping("/2fa/iniciar")
    public ResponseEntity<LoginResponse> iniciar2fa() {
        Usuario usuario = UsuarioAtual.obter()
                .orElseThrow(() -> new BadCredentialsException("Sessão expirada."));
        return ResponseEntity.ok(authService.iniciar2fa(usuario));
    }

    @PostMapping("/2fa/confirmar")
    public ResponseEntity<LoginResponse> confirmar2fa(@RequestBody Map<String, String> body) {
        Usuario usuario = UsuarioAtual.obter()
                .orElseThrow(() -> new BadCredentialsException("Sessão expirada."));
        return ResponseEntity.ok(authService.confirmar2fa(usuario, body.get("codigo")));
    }

    @PostMapping("/2fa/desativar")
    public ResponseEntity<LoginResponse> desativar2fa(@RequestBody Map<String, String> body) {
        Usuario usuario = UsuarioAtual.obter()
                .orElseThrow(() -> new BadCredentialsException("Sessão expirada."));
        return ResponseEntity.ok(authService.desativar2fa(usuario, body.get("senha")));
    }

    @PostMapping("/logout")
    public ResponseEntity<Void> logout() {
        return ResponseEntity.ok().build();
    }
}
