package com.temdetudo.erp.repository;

import com.temdetudo.erp.entity.Usuario;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface UsuarioRepository extends JpaRepository<Usuario, Long> {

    /*
     |--------------------------------------------------------------------------
     | LOGIN
     |--------------------------------------------------------------------------
     */

    Optional<Usuario> findByEmail(String email);

    Optional<Usuario> findByUsuario(String usuario);

    Optional<Usuario> findByEmailOrUsuario(String email, String usuario);

    /*
     |--------------------------------------------------------------------------
     | VALIDAÇÕES
     |--------------------------------------------------------------------------
     */

    boolean existsByEmail(String email);

    boolean existsByUsuario(String usuario);

}