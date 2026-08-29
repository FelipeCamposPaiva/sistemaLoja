package com.temdetudo.erp.config;

import com.temdetudo.erp.entity.Perfil;
import com.temdetudo.erp.entity.Usuario;
import com.temdetudo.erp.repository.UsuarioRepository;

import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import org.springframework.security.crypto.password.PasswordEncoder;

@Configuration
public class AdminInitializer {

    @Bean
    CommandLineRunner criarAdministrador(

            UsuarioRepository repository,

            PasswordEncoder encoder

    ) {

        return args -> {

            if (repository.count() == 0) {

                Usuario admin = new Usuario();

                admin.setNome("Administrador");

                admin.setUsuario("admin");

                admin.setEmail("admin@temdetudovr.com.br");

                admin.setSenha(

                        encoder.encode("123456")

                );

                admin.setPerfil(

                        Perfil.ADMIN

                );

                admin.setAtivo(true);

                admin.setBloqueado(false);

                repository.save(admin);

                System.out.println();

                System.out.println("========================================");

                System.out.println("ADMINISTRADOR CRIADO");

                System.out.println("Usuário: admin");

                System.out.println("Senha: 123456");

                System.out.println("========================================");

                System.out.println();

            }

        };

    }

}