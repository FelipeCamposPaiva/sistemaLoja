package com.temdetudo.erp.config;

import java.util.Map;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

@RestControllerAdvice
public class ApiExceptionHandler {

    @ExceptionHandler(BadCredentialsException.class)
    public ResponseEntity<Map<String, String>> credenciais(BadCredentialsException ex) {
        String mensagem = ex.getMessage() == null || ex.getMessage().isBlank()
                ? "Usuário ou senha inválidos."
                : ex.getMessage();
        return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                .body(Map.of("mensagem", mensagem));
    }

    @ExceptionHandler({IllegalArgumentException.class, IllegalStateException.class})
    public ResponseEntity<Map<String, String>> regraNegocio(RuntimeException ex) {
        String mensagem = ex.getMessage() == null || ex.getMessage().isBlank()
                ? "Operação não permitida."
                : ex.getMessage();
        return ResponseEntity.badRequest().body(Map.of("mensagem", mensagem));
    }

    @ExceptionHandler(org.springframework.web.multipart.MaxUploadSizeExceededException.class)
    public ResponseEntity<Map<String, String>> arquivoGrande() {
        return ResponseEntity.badRequest().body(Map.of("mensagem", "Arquivo acima do limite (50 MB para vídeo, 8 MB para foto)."));
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<Map<String, String>> validacao(MethodArgumentNotValidException ex) {
        String mensagem = ex.getBindingResult().getFieldErrors().stream()
                .findFirst()
                .map(erro -> erro.getDefaultMessage())
                .orElse("Dados inválidos.");
        return ResponseEntity.badRequest().body(Map.of("mensagem", mensagem));
    }
}
