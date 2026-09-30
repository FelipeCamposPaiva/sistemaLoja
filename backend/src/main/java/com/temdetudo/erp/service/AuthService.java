package com.temdetudo.erp.service;

import com.temdetudo.erp.dto.LoginRequest;
import com.temdetudo.erp.dto.LoginResponse;
import com.temdetudo.erp.entity.Usuario;
import com.temdetudo.erp.repository.UsuarioRepository;
import com.temdetudo.erp.security.JwtService;

import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;

import org.springframework.security.authentication.BadCredentialsException;

import org.springframework.security.crypto.password.PasswordEncoder;

import org.springframework.stereotype.Service;

import java.time.LocalDateTime;

@Service
public class AuthService {

    private final UsuarioRepository usuarioRepository;

    private final AuthenticationManager authenticationManager;

    private final JwtService jwtService;

    private final PasswordEncoder passwordEncoder;

    public AuthService(

            UsuarioRepository usuarioRepository,

            AuthenticationManager authenticationManager,

            JwtService jwtService,

            PasswordEncoder passwordEncoder

    ) {

        this.usuarioRepository = usuarioRepository;

        this.authenticationManager = authenticationManager;

        this.jwtService = jwtService;

        this.passwordEncoder = passwordEncoder;

    }

    /*
    |--------------------------------------------------------------------------
    | LOGIN
    |--------------------------------------------------------------------------
    */

    public LoginResponse login(

            LoginRequest request

    ) {

        Usuario usuario =

                usuarioRepository

                        .findByEmailOrUsuario(

                                request.getLogin(),

                                request.getLogin()

                        )

                        .orElseThrow(

                                () ->

                                        new BadCredentialsException(

                                                "Usuário ou senha inválidos."

                                        )

                        );

        if (

                Boolean.FALSE.equals(

                        usuario.getAtivo()

                )

        ) {

            throw new BadCredentialsException(

                    "Usuário inativo."

            );

        }

        if (

                Boolean.TRUE.equals(

                        usuario.getBloqueado()

                )

        ) {

            throw new BadCredentialsException(

                    "Usuário bloqueado."

            );

        }

        try {

            authenticationManager.authenticate(

                    new UsernamePasswordAuthenticationToken(

                            request.getLogin(),

                            request.getSenha()

                    )

            );

        }

        catch (

                Exception ex

        ) {

            incrementarTentativas(

                    usuario

            );

            throw new BadCredentialsException(

                    "Usuário ou senha inválidos."

            );

        }

        usuario.setTentativasLogin(0);

        usuario.setUltimoLogin(

                LocalDateTime.now()

        );

        usuarioRepository.save(

                usuario

        );

        String token =

                jwtService.gerarToken(

                        usuario

                );

        return new LoginResponse(

                token,

                "Bearer",

                usuario.getId(),

                usuario.getNome(),

                usuario.getUsuario(),

                usuario.getEmail(),

                usuario.getPerfil().name()

        );

    }

    /*
    |--------------------------------------------------------------------------
    | CADASTRO
    |--------------------------------------------------------------------------
    */

    public Usuario salvar(

            Usuario usuario

    ) {

        usuario.setSenha(

                passwordEncoder.encode(

                        usuario.getSenha()

                )

        );

        return usuarioRepository.save(

                usuario

        );

    }

    /*
    |--------------------------------------------------------------------------
    | TENTATIVAS
    |--------------------------------------------------------------------------
    */

    private void incrementarTentativas(

            Usuario usuario

    ) {

        Integer tentativas =

                usuario.getTentativasLogin();

        if (

                tentativas == null

        ) {

            tentativas = 0;

        }

        tentativas++;

        usuario.setTentativasLogin(

                tentativas

        );

        if (

                tentativas >= 5

        ) {

            usuario.setBloqueado(

                    true

            );

        }

        usuarioRepository.save(

                usuario

        );

    }

}