package com.temdetudo.erp.service;

import com.temdetudo.erp.dto.NaturezaSugeridaDTO;
import com.temdetudo.erp.entity.Cliente;
import com.temdetudo.erp.entity.NaturezaOperacao;
import com.temdetudo.erp.repository.NaturezaOperacaoRepository;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.util.Comparator;
import java.util.List;
import java.util.Locale;

@Service
public class NaturezaOperacaoService {

    private final NaturezaOperacaoRepository repository;
    private final String empresaUf;

    public NaturezaOperacaoService(
            NaturezaOperacaoRepository repository,
            @Value("${erp.empresa.uf:RJ}") String empresaUf
    ) {
        this.repository = repository;
        this.empresaUf = empresaUf == null ? "RJ" : empresaUf.trim().toUpperCase(Locale.ROOT);
    }

    public String empresaUf() {
        return empresaUf;
    }

    public List<NaturezaOperacao> listar() {
        return repository.findByAtivoTrueOrderByPrioridadeAscNomeAsc();
    }

    public NaturezaSugeridaDTO sugerir(Cliente cliente) {
        boolean interna = operacaoInterna(cliente == null ? null : cliente.getEstado());
        if (cliente != null && cliente.getNaturezaOperacaoId() != null) {
            NaturezaOperacao cadastrada = repository.findById(cliente.getNaturezaOperacaoId()).orElse(null);
            if (cadastrada != null && !Boolean.FALSE.equals(cadastrada.getAtivo())) {
                return dto(cadastrada, interna, "CADASTRO",
                        "Natureza padrão do cadastro do cliente.");
            }
        }
        NaturezaOperacao escolhida = escolher(cliente);
        if (escolhida == null) {
            return vazio();
        }
        return dto(escolhida, interna, "AUTOMATICA", motivo(cliente, interna));
    }

    public NaturezaSugeridaDTO sugerir(
            String uf,
            String cpfCnpj,
            String tipoPessoa,
            String contribuinte,
            Boolean consumidorFinal,
            String finalidade
    ) {
        Cliente sombra = new Cliente();
        sombra.setEstado(uf);
        sombra.setCpfCnpj(cpfCnpj);
        sombra.setTipoPessoa(tipoPessoa);
        sombra.setContribuinte(contribuinte);
        sombra.setConsumidorFinal(consumidorFinal);
        sombra.setFinalidade(finalidade);
        return sugerir(sombra);
    }

    private NaturezaOperacao escolher(Cliente cliente) {
        List<NaturezaOperacao> ativas = listar();
        if (ativas.isEmpty()) {
            return null;
        }
        String tipoPessoa = tipoPessoa(cliente);
        boolean pf = "fisica".equals(tipoPessoa);
        boolean contribuinteIcms = contribuinteIcms(cliente);
        boolean consumidor = consumidorFinal(cliente, pf, contribuinteIcms);
        String finalidade = finalidade(cliente, consumidor);

        return ativas.stream()
                .max(Comparator
                        .comparingInt((NaturezaOperacao n) -> pontos(n, pf, contribuinteIcms, consumidor, finalidade))
                        .thenComparing(Comparator.comparingInt(
                                (NaturezaOperacao n) -> n.getPrioridade() == null ? 99 : n.getPrioridade()
                        ).reversed()))
                .orElse(ativas.get(0));
    }

    private int pontos(NaturezaOperacao n, boolean pf, boolean contribuinteIcms, boolean consumidor, String finalidade) {
        int pts = 0;
        if (pf && Boolean.TRUE.equals(n.getParaPessoaFisica())) {
            pts += 3;
        }
        if (!pf && Boolean.TRUE.equals(n.getParaPessoaJuridica())) {
            pts += 3;
        }
        if (contribuinteIcms && Boolean.TRUE.equals(n.getParaContribuinte())) {
            pts += 4;
        }
        if (!contribuinteIcms && Boolean.TRUE.equals(n.getParaNaoContribuinte())) {
            pts += 4;
        }
        if (consumidor && Boolean.TRUE.equals(n.getConsumidorFinal())) {
            pts += 5;
        }
        if (!consumidor && !Boolean.TRUE.equals(n.getConsumidorFinal())) {
            pts += 2;
        }
        if (finalidade.equalsIgnoreCase(nvl(n.getFinalidade(), "AMBOS"))
                || "AMBOS".equalsIgnoreCase(n.getFinalidade())) {
            pts += 3;
        }
        return pts;
    }

    private boolean operacaoInterna(String ufCliente) {
        String uf = nvl(ufCliente, empresaUf).toUpperCase(Locale.ROOT);
        return uf.isBlank() || uf.equals(empresaUf);
    }

    private String tipoPessoa(Cliente cliente) {
        if (cliente == null) {
            return "fisica";
        }
        if (temTexto(cliente.getTipoPessoa())) {
            return cliente.getTipoPessoa().trim().toLowerCase(Locale.ROOT);
        }
        String doc = soDigitos(cliente.getCpfCnpj());
        return doc.length() > 11 ? "juridica" : "fisica";
    }

    private boolean contribuinteIcms(Cliente cliente) {
        if (cliente == null) {
            return false;
        }
        return "1".equals(nvl(cliente.getContribuinte(), "9").trim());
    }

    private boolean consumidorFinal(Cliente cliente, boolean pf, boolean contribuinteIcms) {
        if (cliente != null && cliente.getConsumidorFinal() != null) {
            return cliente.getConsumidorFinal();
        }
        return pf || !contribuinteIcms;
    }

    private String finalidade(Cliente cliente, boolean consumidor) {
        if (cliente != null && temTexto(cliente.getFinalidade())) {
            return cliente.getFinalidade().trim().toUpperCase(Locale.ROOT);
        }
        return consumidor ? "CONSUMO" : "REVENDA";
    }

    private NaturezaSugeridaDTO dto(NaturezaOperacao n, boolean interna, String origem, String motivo) {
        NaturezaSugeridaDTO dto = new NaturezaSugeridaDTO();
        dto.setNaturezaId(n.getId());
        dto.setCodigo(n.getCodigo());
        dto.setNome(n.getNome());
        dto.setCfopInterno(n.getCfopInterno());
        dto.setCfopInterestadual(n.getCfopInterestadual());
        dto.setCfop(interna ? n.getCfopInterno() : n.getCfopInterestadual());
        dto.setOperacao(interna ? "INTERNA" : "INTERESTADUAL");
        dto.setOrigem(origem);
        dto.setMotivo(motivo);
        return dto;
    }

    private NaturezaSugeridaDTO vazio() {
        NaturezaSugeridaDTO dto = new NaturezaSugeridaDTO();
        dto.setNome("Não definida");
        dto.setOrigem("AUTOMATICA");
        dto.setMotivo("Cadastre naturezas de operação.");
        return dto;
    }

    private String motivo(Cliente cliente, boolean interna) {
        String uf = cliente == null ? empresaUf : nvl(cliente.getEstado(), empresaUf);
        String tipo = tipoPessoa(cliente);
        boolean icms = contribuinteIcms(cliente);
        return "UF " + uf.toUpperCase(Locale.ROOT)
                + (interna ? " (mesma UF da loja)" : " (interestadual)")
                + ", " + ("juridica".equals(tipo) ? "CNPJ" : "CPF")
                + ", " + (icms ? "contribuinte ICMS" : "não contribuinte")
                + ", " + finalidade(cliente, consumidorFinal(cliente, "fisica".equals(tipoPessoa(cliente)), icms)).toLowerCase(Locale.ROOT)
                + ".";
    }

    private static String soDigitos(String valor) {
        return valor == null ? "" : valor.replaceAll("\\D", "");
    }

    private static boolean temTexto(String valor) {
        return valor != null && !valor.isBlank();
    }

    private static String nvl(String valor, String padrao) {
        return temTexto(valor) ? valor : padrao;
    }
}
