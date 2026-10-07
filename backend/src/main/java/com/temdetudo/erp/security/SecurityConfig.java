package com.temdetudo.erp.security;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.config.Customizer;

import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;

import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;

import org.springframework.security.config.annotation.web.builders.HttpSecurity;

import org.springframework.security.config.http.SessionCreationPolicy;

import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;

import org.springframework.http.HttpMethod;
import org.springframework.security.web.SecurityFilterChain;

import jakarta.servlet.http.HttpServletRequest;

import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;

@Configuration
@EnableMethodSecurity
public class SecurityConfig {

    private final JwtFilter jwtFilter;

    public SecurityConfig(JwtFilter jwtFilter) {

        this.jwtFilter = jwtFilter;

    }

    @Bean
    public SecurityFilterChain securityFilterChain(

            HttpSecurity http

    ) throws Exception {

        http

                .csrf(

                        csrf -> csrf.disable()

                )

                .cors(

                        Customizer.withDefaults()

                )

                .sessionManagement(

                        session ->

                                session.sessionCreationPolicy(

                                        SessionCreationPolicy.STATELESS

                                )

                )

                .authorizeHttpRequests(

                        auth -> auth

                                /*
                                 * ROTAS PÚBLICAS
                                 */

                                .requestMatchers(HttpMethod.OPTIONS, "/**").permitAll()

                                .requestMatchers(

                                        "/",

                                        "/api/teste",

                                        "/api/auth/login",

                                        "/api/auth/verificar-2fa",

                                        "/api/auth/recuperar",

                                        "/api/auth/redefinir",

                                        "/api/whatsapp/webhook",

                                        "/api/publico/maquinas/**",

                                        "/api/publico/vitrine",

                                        "/api/publico/vitrine/**",

                                        "/uploads/**",

                                        "/h2-console/**",

                                        "/swagger-ui/**",

                                        "/v3/api-docs/**"

                                ).permitAll()

                                .requestMatchers(SecurityConfig::paginaDoSistema).permitAll()

                                /*
                                 * DEMAIS ROTAS
                                 */

                                .anyRequest()

                                .authenticated()

                )

                .headers(

                        headers ->

                                headers.frameOptions(

                                        frame -> frame.disable()

                                )

                )

                .addFilterBefore(

                        jwtFilter,

                        UsernamePasswordAuthenticationFilter.class

                );

        return http.build();

    }

    @Bean
    public PasswordEncoder passwordEncoder() {

        return new BCryptPasswordEncoder();

    }

    @Bean
    public AuthenticationManager authenticationManager(

            AuthenticationConfiguration configuration

    ) throws Exception {

        return configuration.getAuthenticationManager();

    }

    private static boolean paginaDoSistema(HttpServletRequest request) {
        String metodo = request.getMethod();
        if (!"GET".equalsIgnoreCase(metodo) && !"HEAD".equalsIgnoreCase(metodo)) {
            return false;
        }
        String caminho = request.getRequestURI();
        return caminho != null
                && !"/popular".equals(caminho)
                && !caminho.startsWith("/api");
    }

}