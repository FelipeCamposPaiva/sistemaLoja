package com.temdetudo.erp.security;

import com.temdetudo.erp.entity.Usuario;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import javax.crypto.SecretKey;

import java.nio.charset.StandardCharsets;
import java.util.Date;

@Service
public class JwtService {

    @Value("${jwt.secret}")
    private String secret;

    @Value("${jwt.expiration}")
    private Long expiration;

    /*
    |--------------------------------------------------------------------------
    | CHAVE JWT
    |--------------------------------------------------------------------------
    */

    private SecretKey getKey() {

        return Keys.hmacShaKeyFor(

                secret.getBytes(StandardCharsets.UTF_8)

        );

    }

    /*
    |--------------------------------------------------------------------------
    | GERA TOKEN
    |--------------------------------------------------------------------------
    */

    public String gerarToken(Usuario usuario) {

        Date agora = new Date();

        Date validade = new Date(

                agora.getTime() + expiration

        );

        return Jwts.builder()

                .subject(usuario.getUsuario())

                .claim("id", usuario.getId())

                .claim("nome", usuario.getNome())

                .claim("usuario", usuario.getUsuario())

                .claim("email", usuario.getEmail())

                .claim("perfil", usuario.getPerfil().name())

                .issuedAt(agora)

                .expiration(validade)

                .signWith(getKey())

                .compact();

    }

    /*
    |--------------------------------------------------------------------------
    | RECUPERA O USUÁRIO DO TOKEN
    |--------------------------------------------------------------------------
    */

    public String getUsuario(String token) {

        return getClaims(token)

                .getSubject();

    }

    /*
    |--------------------------------------------------------------------------
    | VALIDA TOKEN
    |--------------------------------------------------------------------------
    */

    public boolean tokenValido(String token) {

        try {

            getClaims(token);

            return true;

        }

        catch (Exception ex) {

            return false;

        }

    }

    /*
    |--------------------------------------------------------------------------
    | RECUPERA CLAIMS
    |--------------------------------------------------------------------------
    */

    private Claims getClaims(String token) {

        return Jwts.parser()

                .verifyWith(getKey())

                .build()

                .parseSignedClaims(token)

                .getPayload();

    }

}