package com.temdetudo.erp.service;

import com.temdetudo.erp.entity.AuditoriaLog;
import com.temdetudo.erp.entity.Usuario;
import com.temdetudo.erp.repository.AuditoriaRepository;
import com.temdetudo.erp.security.UsuarioAtual;

import org.springframework.stereotype.Service;

import java.lang.reflect.Field;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Objects;

@Service
public class AuditoriaService {

    private static final Map<String, String> ROTULOS = Map.ofEntries(
            Map.entry("nome", "Nome"),
            Map.entry("sku", "SKU"),
            Map.entry("codigoBarras", "GTIN/EAN"),
            Map.entry("categoria", "Categoria"),
            Map.entry("unidade", "Unidade"),
            Map.entry("custo", "Custo"),
            Map.entry("custoCompra", "Custo de compra"),
            Map.entry("preco", "Preço"),
            Map.entry("precoAtacado", "Preço atacado"),
            Map.entry("precoPromocional", "Preço promocional"),
            Map.entry("descontoPercentual", "Desconto %"),
            Map.entry("estoque", "Estoque"),
            Map.entry("estoqueMinimo", "Estoque mínimo"),
            Map.entry("estoqueMaximo", "Estoque máximo"),
            Map.entry("localizacao", "Localização"),
            Map.entry("ncm", "NCM"),
            Map.entry("cest", "CEST"),
            Map.entry("ativo", "Ativo"),
            Map.entry("observacoes", "Observações"),
            Map.entry("cpfCnpj", "CPF/CNPJ"),
            Map.entry("telefone", "Telefone"),
            Map.entry("email", "E-mail"),
            Map.entry("cidade", "Cidade"),
            Map.entry("estado", "UF"),
            Map.entry("cep", "CEP"),
            Map.entry("endereco", "Endereço"),
            Map.entry("nomeFantasia", "Nome fantasia"),
            Map.entry("tipo", "Tipo"),
            Map.entry("tipoPessoa", "Tipo de pessoa"),
            Map.entry("contribuinte", "Contribuinte ICMS"),
            Map.entry("consumidorFinal", "Consumidor final"),
            Map.entry("finalidade", "Finalidade"),
            Map.entry("regimeTributario", "Regime tributário"),
            Map.entry("naturezaOperacaoId", "Natureza de operação"),
            Map.entry("limiteCredito", "Limite de crédito"),
            Map.entry("status", "Situação"),
            Map.entry("valor", "Valor"),
            Map.entry("cliente", "Cliente"),
            Map.entry("formaPagamento", "Forma de pagamento"),
            Map.entry("responsavel", "Responsável"),
            Map.entry("descricao", "Descrição"),
            Map.entry("quantidade", "Quantidade"),
            Map.entry("produtoId", "Produto")
    );

    private static final List<String> IGNORAR = List.of(
            "id", "senha", "detalhes", "criadoEm", "atualizadoEm", "arquivoArte",
            "hibernateLazyInitializer"
    );

    private final AuditoriaRepository repository;

    public AuditoriaService(AuditoriaRepository repository) {
        this.repository = repository;
    }

    public Usuario usuarioAtual() {
        return UsuarioAtual.obter().orElse(null);
    }

    public Map<String, String> snapshot(Object alvo) {
        Map<String, String> mapa = new LinkedHashMap<>();
        if (alvo == null) {
            return mapa;
        }
        Class<?> tipo = alvo.getClass();
        while (tipo != null && tipo != Object.class) {
            for (Field campo : tipo.getDeclaredFields()) {
                if (IGNORAR.contains(campo.getName()) || campo.isSynthetic()) {
                    continue;
                }
                try {
                    campo.setAccessible(true);
                    mapa.put(campo.getName(), texto(campo.get(alvo)));
                } catch (Exception ignored) {
                    /* campo inacessível */
                }
            }
            tipo = tipo.getSuperclass();
        }
        return mapa;
    }

    public void registrarCriacao(String entidade, Long id, String nome, Object novo) {
        List<Map<String, String>> campos = new ArrayList<>();
        campos.add(item("cadastro", "", "registro criado"));
        snapshot(novo).forEach((chave, valor) -> {
            if (valor != null && !valor.isBlank()) {
                campos.add(item(ROTULOS.getOrDefault(chave, chave), "", valor));
            }
        });
        gravar(entidade, id, nome, "CRIAR", campos);
    }

    public void registrarAlteracao(String entidade, Long id, String nome, Object anterior, Object novo) {
        registrarAlteracao(entidade, id, nome, snapshot(anterior), snapshot(novo));
    }

    public void registrarAlteracao(String entidade, Long id, String nome, Map<String, String> antes, Map<String, String> depois) {
        List<Map<String, String>> diffs = diff(antes, depois);
        if (diffs.isEmpty()) {
            return;
        }
        gravar(entidade, id, nome, "ALTERAR", diffs);
    }

    public void registrarExclusao(String entidade, Long id, String nome, Object anterior) {
        gravar(entidade, id, nome, "EXCLUIR", List.of(item("cadastro", texto(nome), "excluído")));
    }

    public void registrarResumo(String entidade, Long id, String nome, String acao, String resumo) {
        gravar(entidade, id, nome, acao, List.of(item("resumo", "", resumo == null ? "" : resumo)));
    }

    public List<AuditoriaLog> recentes() {
        return repository.findTop300ByOrderByCriadoEmDesc();
    }

    public List<AuditoriaLog> doRegistro(String entidade, Long id) {
        return repository.findByEntidadeAndRegistroIdOrderByCriadoEmDesc(entidade, id);
    }

    private void gravar(String entidade, Long id, String nome, String acao, List<Map<String, String>> campos) {
        Usuario usuario = usuarioAtual();
        AuditoriaLog log = new AuditoriaLog();
        log.setEntidade(entidade);
        log.setRegistroId(id);
        log.setRegistroNome(nome);
        log.setAcao(acao);
        if (usuario != null) {
            log.setUsuarioId(usuario.getId());
            log.setUsuarioLogin(usuario.getUsuario() != null ? usuario.getUsuario() : usuario.getEmail());
            log.setUsuarioNome(usuario.getNome());
        } else {
            log.setUsuarioLogin("sistema");
            log.setUsuarioNome("Sistema");
        }
        log.setCriadoEm(LocalDateTime.now());
        log.setAlteracoes(json(campos));
        repository.save(log);
    }

    private List<Map<String, String>> diff(Map<String, String> antes, Map<String, String> depois) {
        List<Map<String, String>> lista = new ArrayList<>();
        for (String chave : depois.keySet()) {
            String de = antes.getOrDefault(chave, "");
            String para = depois.getOrDefault(chave, "");
            if (!Objects.equals(de, para)) {
                lista.add(item(ROTULOS.getOrDefault(chave, chave), de, para));
            }
        }
        return lista;
    }

    private Map<String, String> item(String campo, String de, String para) {
        Map<String, String> item = new LinkedHashMap<>();
        item.put("campo", campo);
        item.put("de", de);
        item.put("para", para);
        return item;
    }

    private String texto(Object valor) {
        if (valor == null) {
            return "";
        }
        String s = String.valueOf(valor);
        return s.length() > 400 ? s.substring(0, 400) + "…" : s;
    }

    private String json(List<Map<String, String>> campos) {
        StringBuilder sb = new StringBuilder("[");
        for (int i = 0; i < campos.size(); i++) {
            Map<String, String> item = campos.get(i);
            if (i > 0) {
                sb.append(',');
            }
            sb.append("{\"campo\":").append(aspas(item.get("campo")))
                    .append(",\"de\":").append(aspas(item.get("de")))
                    .append(",\"para\":").append(aspas(item.get("para")))
                    .append('}');
        }
        return sb.append(']').toString();
    }

    private String aspas(String valor) {
        String s = valor == null ? "" : valor.replace("\\", "\\\\").replace("\"", "\\\"").replace("\n", " ");
        return "\"" + s + "\"";
    }
}
