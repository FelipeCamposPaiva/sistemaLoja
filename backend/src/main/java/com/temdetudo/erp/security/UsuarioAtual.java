package com.temdetudo.erp.security;

import com.temdetudo.erp.entity.Usuario;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;

import java.util.Optional;

public final class UsuarioAtual {

    private UsuarioAtual() {
    }

    public static Optional<Usuario> obter() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null) {
            return Optional.empty();
        }
        Object principal = auth.getPrincipal();
        if (principal instanceof Usuario usuario) {
            return Optional.of(usuario);
        }
        return Optional.empty();
    }
}
