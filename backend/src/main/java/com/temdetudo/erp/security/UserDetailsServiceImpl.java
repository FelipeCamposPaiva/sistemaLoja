package com.temdetudo.erp.security;

import com.temdetudo.erp.entity.Usuario;
import com.temdetudo.erp.repository.UsuarioRepository;

import org.springframework.security.core.userdetails.User;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;

import org.springframework.security.core.authority.SimpleGrantedAuthority;

import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class UserDetailsServiceImpl implements UserDetailsService {

    private final UsuarioRepository usuarioRepository;

    public UserDetailsServiceImpl(
            UsuarioRepository usuarioRepository
    ) {

        this.usuarioRepository = usuarioRepository;

    }

    @Override
    public UserDetails loadUserByUsername(
            String login
    ) throws UsernameNotFoundException {

        Usuario usuario =

                usuarioRepository

                        .findByEmailOrUsuario(

                                login,

                                login

                        )

                        .orElseThrow(() ->

                                new UsernameNotFoundException(

                                        "Usuário não encontrado."

                                )

                        );

        if (!Boolean.TRUE.equals(usuario.getAtivo())) {

            throw new UsernameNotFoundException(

                    "Usuário inativo."

            );

        }

        if (Boolean.TRUE.equals(usuario.getBloqueado())) {

            throw new UsernameNotFoundException(

                    "Usuário bloqueado."

            );

        }

        return User.builder()

                .username(

    usuario.getUsuario() != null

            ? usuario.getUsuario()

            : usuario.getEmail()

)

                .password(

                        usuario.getSenha()

                )

                .authorities(

                        List.of(

                                new SimpleGrantedAuthority(

                                        "ROLE_" +

                                                usuario.getPerfil().name()

                                )

                        )

                )

                .build();

    }

}