package com.temdetudo.erp.config;

import java.util.Map;

import org.springframework.dao.DataAccessException;
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

    @ExceptionHandler(DataAccessException.class)
    public ResponseEntity<Map<String, String>> banco(DataAccessException ex) {
        String bruto = "";
        Throwable causa = ex;
        while (causa.getCause() != null && causa.getCause() != causa) {
            causa = causa.getCause();
            if (causa.getMessage() != null && !causa.getMessage().isBlank()) {
                bruto = causa.getMessage();
            }
        }
        String texto = bruto.toLowerCase();
        String mensagem;
        if (texto.contains("duplicate") || texto.contains("uk_clientes_cpf_cnpj")) {
            mensagem = "Já existe um contato com este CPF ou CNPJ.";
        } else if (texto.contains("unknown column")) {
            mensagem = "O banco ainda não tem uma coluna usada neste cadastro.";
        } else if (texto.contains("data too long") || texto.contains("too long")) {
            mensagem = "Um dos campos passou do tamanho permitido.";
        } else if (bruto.isBlank()) {
            mensagem = "Não foi possível gravar no banco.";
        } else {
            mensagem = bruto.length() > 240 ? bruto.substring(0, 240) : bruto;
        }
        return ResponseEntity.badRequest().body(Map.of("mensagem", mensagem));
    }
}
