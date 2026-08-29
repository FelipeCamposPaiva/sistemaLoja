package com.temdetudo.erp.controller;

import com.temdetudo.erp.dto.LoginRequest;
import com.temdetudo.erp.dto.LoginResponse;
import com.temdetudo.erp.entity.Usuario;
import com.temdetudo.erp.service.AuthService;

import jakarta.validation.Valid;

import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
@CrossOrigin(origins = "*")
public class AuthController {

    private final AuthService authService;

    public AuthController(AuthService authService) {

        this.authService = authService;

    }

    /*
    |--------------------------------------------------------------------------
    | LOGIN
    |--------------------------------------------------------------------------
    */

    @PostMapping("/login")
    public ResponseEntity<LoginResponse> login(

            @Valid
            @RequestBody
            LoginRequest request

    ) {

        LoginResponse response =

                authService.login(request);

        return ResponseEntity.ok(response);

    }

    /*
    |--------------------------------------------------------------------------
    | CADASTRAR USUÁRIO
    |--------------------------------------------------------------------------
    */

    @PostMapping("/registrar")
    public ResponseEntity<Usuario> registrar(

            @RequestBody
            Usuario usuario

    ) {

        return ResponseEntity.ok(

                authService.salvar(usuario)

        );

    }

    /*
    |--------------------------------------------------------------------------
    | USUÁRIO LOGADO
    |--------------------------------------------------------------------------
    */

    @GetMapping("/me")
    public ResponseEntity<?> me(

            Authentication authentication

    ) {

        return ResponseEntity.ok(

                authentication.getPrincipal()

        );

    }

    /*
    |--------------------------------------------------------------------------
    | LOGOUT
    |--------------------------------------------------------------------------
    */

    @PostMapping("/logout")
    public ResponseEntity<Void> logout() {

        return ResponseEntity.ok().build();

    }

}