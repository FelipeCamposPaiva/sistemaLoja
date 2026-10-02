package com.temdetudo.erp.service;

import com.temdetudo.erp.dto.LoginRequest;
import com.temdetudo.erp.dto.LoginResponse;
import com.temdetudo.erp.entity.Usuario;
import com.temdetudo.erp.repository.UsuarioRepository;
import com.temdetudo.erp.security.JwtService;

import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.security.SecureRandom;
import java.time.LocalDateTime;
import java.util.Map;
import java.util.Optional;

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

    public LoginResponse login(LoginRequest request) {
        Usuario usuario = usuarioRepository
                .findByEmailOrUsuario(request.getLogin(), request.getLogin())
                .orElseThrow(() -> new BadCredentialsException("Usuário ou senha inválidos."));

        if (Boolean.FALSE.equals(usuario.getAtivo())) {
            throw new BadCredentialsException("Usuário inativo.");
        }
        if (Boolean.TRUE.equals(usuario.getBloqueado())) {
            throw new BadCredentialsException("Usuário bloqueado. Recupere a senha ou fale com o administrador.");
        }

        try {
            authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(request.getLogin(), request.getSenha())
            );
        } catch (Exception ex) {
            incrementarTentativas(usuario);
            throw new BadCredentialsException("Usuário ou senha inválidos.");
        }

        usuario.setTentativasLogin(0);
        usuario.setUltimoLogin(LocalDateTime.now());

        if (Boolean.TRUE.equals(usuario.getDoisFatores())) {
            String codigo = gerarCodigo();
            usuario.setCodigo2fa(codigo);
            usuario.setCodigo2faExpira(LocalDateTime.now().plusMinutes(5));
            usuarioRepository.save(usuario);
            LoginResponse desafio = base(usuario, null);
            desafio.setPrecisa2fa(true);
            desafio.setCodigo2fa(codigo);
            return desafio;
        }

        usuario.setCodigo2fa(null);
        usuario.setCodigo2faExpira(null);
        usuarioRepository.save(usuario);
        return sessao(usuario);
    }

    public LoginResponse verificar2fa(String login, String codigo) {
        Usuario usuario = usuarioRepository.findByEmailOrUsuario(login, login)
                .orElseThrow(() -> new BadCredentialsException("Usuário ou senha inválidos."));
        if (!Boolean.TRUE.equals(usuario.getDoisFatores())) {
            throw new BadCredentialsException("2FA não está ativo nesta conta.");
        }
        if (!codigoValido(usuario.getCodigo2fa(), usuario.getCodigo2faExpira(), codigo)) {
            throw new BadCredentialsException("Código inválido ou expirado.");
        }
        usuario.setCodigo2fa(null);
        usuario.setCodigo2faExpira(null);
        usuario.setUltimoLogin(LocalDateTime.now());
        usuario.setTentativasLogin(0);
        usuarioRepository.save(usuario);
        return sessao(usuario);
    }

    public LoginResponse alterarSenha(Usuario autenticado, String senhaAtual, String senhaNova) {
        Usuario usuario = usuarioRepository.findById(autenticado.getId())
                .orElseThrow(() -> new IllegalArgumentException("Usuário não encontrado."));
        if (!passwordEncoder.matches(senhaAtual, usuario.getSenha())) {
            throw new IllegalArgumentException("Senha atual incorreta.");
        }
        usuario.setSenha(passwordEncoder.encode(senhaNova));
        usuarioRepository.save(usuario);
        return sessao(usuario);
    }

    public LoginResponse iniciar2fa(Usuario autenticado) {
        Usuario usuario = usuarioRepository.findById(autenticado.getId())
                .orElseThrow(() -> new IllegalArgumentException("Usuário não encontrado."));
        String codigo = gerarCodigo();
        usuario.setCodigo2fa(codigo);
        usuario.setCodigo2faExpira(LocalDateTime.now().plusMinutes(5));
        usuarioRepository.save(usuario);
        LoginResponse resp = base(usuario, null);
        resp.setPrecisa2fa(true);
        resp.setCodigo2fa(codigo);
        return resp;
    }

    public LoginResponse confirmar2fa(Usuario autenticado, String codigo) {
        Usuario usuario = usuarioRepository.findById(autenticado.getId())
                .orElseThrow(() -> new IllegalArgumentException("Usuário não encontrado."));
        if (!codigoValido(usuario.getCodigo2fa(), usuario.getCodigo2faExpira(), codigo)) {
            throw new IllegalArgumentException("Código inválido ou expirado.");
        }
        usuario.setDoisFatores(true);
        usuario.setCodigo2fa(null);
        usuario.setCodigo2faExpira(null);
        usuarioRepository.save(usuario);
        return base(usuario, null);
    }

    public LoginResponse desativar2fa(Usuario autenticado, String senha) {
        Usuario usuario = usuarioRepository.findById(autenticado.getId())
                .orElseThrow(() -> new IllegalArgumentException("Usuário não encontrado."));
        if (!passwordEncoder.matches(senha, usuario.getSenha())) {
            throw new IllegalArgumentException("Senha incorreta.");
        }
        usuario.setDoisFatores(false);
        usuario.setCodigo2fa(null);
        usuario.setCodigo2faExpira(null);
        usuarioRepository.save(usuario);
        return base(usuario, null);
    }

    public Map<String, String> recuperar(String email) {
        String chave = email == null ? "" : email.trim();
        Optional<Usuario> opt = usuarioRepository.findByEmailOrUsuario(chave, chave);
        if (opt.isPresent()) {
            Usuario usuario = opt.get();
            String codigo = gerarCodigo();
            usuario.setRecuperacaoToken(codigo);
            usuario.setRecuperacaoExpira(LocalDateTime.now().plusMinutes(15));
            usuario.setBloqueado(false);
            usuario.setTentativasLogin(0);
            usuarioRepository.save(usuario);
            return Map.of(
                    "mensagem", "Enviamos um código de verificação para o e-mail cadastrado.",
                    "codigo", codigo
            );
        }
        return Map.of("mensagem", "Se existir uma conta para este e-mail, enviaremos as instruções.");
    }

    public void redefinir(String email, String codigo, String senhaNova) {
        String chave = email == null ? "" : email.trim();
        Usuario usuario = usuarioRepository.findByEmailOrUsuario(chave, chave)
                .orElseThrow(() -> new IllegalArgumentException("Código inválido ou expirado."));
        if (!codigoValido(usuario.getRecuperacaoToken(), usuario.getRecuperacaoExpira(), codigo)) {
            throw new IllegalArgumentException("Código inválido ou expirado.");
        }
        usuario.setSenha(passwordEncoder.encode(senhaNova));
        usuario.setRecuperacaoToken(null);
        usuario.setRecuperacaoExpira(null);
        usuario.setBloqueado(false);
        usuario.setTentativasLogin(0);
        usuarioRepository.save(usuario);
    }

    public LoginResponse me(Usuario usuario) {
        return base(usuario, null);
    }

    public Usuario salvar(Usuario usuario) {
        usuario.setSenha(passwordEncoder.encode(usuario.getSenha()));
        return usuarioRepository.save(usuario);
    }

    private LoginResponse sessao(Usuario usuario) {
        return base(usuario, jwtService.gerarToken(usuario));
    }

    private LoginResponse base(Usuario usuario, String token) {
        LoginResponse resp = new LoginResponse(
                token,
                token == null ? null : "Bearer",
                usuario.getId(),
                usuario.getNome(),
                usuario.getUsuario(),
                usuario.getEmail(),
                usuario.getPerfil() == null ? null : usuario.getPerfil().name()
        );
        resp.setDoisFatores(Boolean.TRUE.equals(usuario.getDoisFatores()));
        if (usuario.getUltimoLogin() != null) {
            resp.setUltimoLogin(usuario.getUltimoLogin().toString());
        }
        return resp;
    }

    private boolean codigoValido(String salvo, LocalDateTime expira, String informado) {
        return salvo != null && expira != null
                && !expira.isBefore(LocalDateTime.now())
                && salvo.equals(String.valueOf(informado == null ? "" : informado).trim());
    }

    private String gerarCodigo() {
        return String.format("%06d", new SecureRandom().nextInt(1_000_000));
    }

    private void incrementarTentativas(Usuario usuario) {
        int tentativas = usuario.getTentativasLogin() == null ? 0 : usuario.getTentativasLogin();
        tentativas++;
        usuario.setTentativasLogin(tentativas);
        if (tentativas >= 5) {
            usuario.setBloqueado(true);
        }
        usuarioRepository.save(usuario);
    }
}
