package com.temdetudo.erp.config;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

import org.springframework.boot.autoconfigure.condition.ConditionalOnResource;
import org.springframework.core.Ordered;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;

/**
 * Quando o JAR traz o build do React, rotas da tela (sem extensão) devolvem
 * index.html. Arquivos reais e a API seguem o fluxo normal.
 */
@Component
@Order(Ordered.HIGHEST_PRECEDENCE)
@ConditionalOnResource(resources = "classpath:static/index.html")
public class SpaFallbackFilter extends OncePerRequestFilter {

    @Override
    protected void doFilterInternal(
            HttpServletRequest request,
            HttpServletResponse response,
            FilterChain filterChain
    ) throws ServletException, IOException {

        if (!"GET".equalsIgnoreCase(request.getMethod())
                && !"HEAD".equalsIgnoreCase(request.getMethod())) {
            filterChain.doFilter(request, response);
            return;
        }

        String caminho = request.getRequestURI();
        if (caminho == null
                || caminho.startsWith("/api")
                || caminho.startsWith("/uploads")
                || "/popular".equals(caminho)) {
            filterChain.doFilter(request, response);
            return;
        }

        int barra = caminho.lastIndexOf('/');
        int ponto = caminho.lastIndexOf('.');
        if (ponto > barra) {
            filterChain.doFilter(request, response);
            return;
        }

        request.getRequestDispatcher("/index.html").forward(request, response);
    }
}
