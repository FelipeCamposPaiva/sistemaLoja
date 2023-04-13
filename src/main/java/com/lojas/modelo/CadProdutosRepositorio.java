package com.lojas.modelo;

import java.sql.ResultSet;
import java.sql.SQLException;
import java.util.Optional;
import lombok.extern.log4j.Log4j2;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.dao.DataAccessException;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.data.repository.CrudRepository;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;

@Log4j2
@Repository
public class CadProdutosRepositorio implements CrudRepository< CadProdutos, String> {

    private final JdbcTemplate jdbc;

    @Autowired
    public CadProdutosRepositorio(JdbcTemplate jdbc) {
        this.jdbc = jdbc;
    }

    @Override
    public <S extends CadProdutos> S save(S entity) {
        try {

            log.debug("Tentando inserir produto " + entity.getCodigo());

            jdbc.update("insert into cad_produtos (codigo, codProdManual, descricao, un, preco, grupoDeMaterias, grupoDeQuimico, estoqueMinimo, ml,"
                    + " precoDeVenda, porcentagem, referencia, fabricante, precoAprazo, estoqueProduto, foraDeUso, icms, ipi, garantia, fornecedorProduto,"
                    + " setor, fotoProduto, obs, dataCadastro, dataValidade, grade, sel, verificactrlest, atualizadoEm, tblPrecos) values (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)",
                    entity.getCodigo(), entity.getCodProdManual(), entity.getDescricao(), entity.getUn(), entity.getPreco(), entity.getGrupoDeMaterias(), entity.getGrupoDeQuimico(), entity.getEstoqueMinimo(), entity.getMl(),
                    entity.getPrecoDeVenda(), entity.getPorcentagem(), entity.getReferencia(), entity.getFabricante(), entity.getPrecoAprazo(), entity.getEstoqueProduto(), entity.isForaDeUso(), entity.getIcms(), entity.getIpi(), entity.getGarantia(), entity.getFornecedorProduto(),
                    entity.getSetor(), entity.getFotoProduto(), entity.getObs(), entity.getDataCadastro(), entity.getDataValidade(), entity.isGrade(), entity.isSel(), entity.isVerificactrlest(), entity.getAtualizadoEm(), entity.isTblPrecos());
        } catch (DataIntegrityViolationException e) {
            try {
                log.debug("Tentando atualizar produto " + entity.getCodigo());

                jdbc.update("update cad_produtos set "
                        + "codProdManual = ?, "
                        + "descricao = ?, "
                        + "un = ?, "
                        + "preco = ?, "
                        + "grupoDeMaterias = ?, "
                        + "grupoDeQuimico = ?, "
                        + "estoqueMinimo = ?, "
                        + "ml = ?, "
                        + "precoDeVenda = ?, "
                        + "porcentagem = ?, "
                        + "referencia = ?, "
                        + "fabricante = ?, "
                        + "precoAprazo = ?, "
                        + "estoqueProduto = ?, "
                        + "foraDeUso = ?, "
                        + "icms = ?, "
                        + "ipi = ?, "
                        + "garantia = ?, "
                        + "fornecedorProduto = ?, "
                        + "setor = ?, "
                        + "fotoProduto = ?, "
                        + "obs = ?, "
                        + "dataCadastro = ?, "
                        + "dataValidade = ?, "
                        + "grade = ?, "
                        + "sel = ?, "
                        + "verificactrlest = ?, "
                        + "atualizadoEm = ?, "
                        + "tblPrecos = ? "
                        + "where codigo = ? ",
                        entity.getCodProdManual(), entity.getDescricao(), entity.getUn(), entity.getPreco(), entity.getGrupoDeMaterias(), entity.getGrupoDeQuimico(), entity.getEstoqueMinimo(), entity.getMl(),
                        entity.getPrecoDeVenda(), entity.getPorcentagem(), entity.getReferencia(), entity.getFabricante(), entity.getPrecoAprazo(), entity.getEstoqueProduto(), entity.isForaDeUso(), entity.getIcms(), entity.getIpi(), entity.getGarantia(), entity.getFornecedorProduto(),
                        entity.getSetor(), entity.getFotoProduto(), entity.getObs(), entity.getDataCadastro(), entity.getDataValidade(), entity.isGrade(), entity.isSel(), entity.isVerificactrlest(), entity.getAtualizadoEm(), entity.isTblPrecos(), entity.getCodigo());
            } catch (Exception ee) {
                log.error("Erro em inserir e atualizar " + entity.getCodigo());
                log.error(ee);
            }
        }
        return entity;
    }

    @Override
    public <S extends CadProdutos> Iterable< S> saveAll(Iterable< S> entities) {
        throw new UnsupportedOperationException("Not supported yet."); //To change body of generated methods, choose Tools | Templates.
    }

    @Override
    public Optional<CadProdutos> findById(String codigo) {
        CadProdutos cp = jdbc.queryForObject("select * from cad_produtos where (codigo like ?) ", this::mapeiaLinha, "%" + codigo.trim() + "%");
        Optional<CadProdutos> oCp = Optional.of(cp);
        return oCp;
    }

    @Override
    public boolean existsById(String id
    ) {
        throw new UnsupportedOperationException("Not supported yet."); //To change body of generated methods, choose Tools | Templates.
    }

    @Override
    public Iterable<CadProdutos> findAll() {
        return jdbc.query("select * from cad_produtos", this::mapeiaLinha);
    }

    private CadProdutos mapeiaLinha(ResultSet rs, int rowNum) {
        CadProdutos produto = new CadProdutos();

        try {
            produto = new CadProdutos(
                    rs.getLong("codigo"),
                    rs.getString("codProdManual"),
                    rs.getString("descricao"),
                    rs.getString("un"),
                    rs.getDouble("preco"),
                    rs.getString("grupoDeMaterias"),
                    rs.getString("grupoDeQuimico"),
                    rs.getLong("estoqueMinimo"),
                    rs.getLong("ml"),
                    rs.getDouble("precoDeVenda"),
                    rs.getDouble("porcentagem"),
                    rs.getString("referencia"),
                    rs.getString("fabricante"),
                    rs.getDouble("precoAprazo"),
                    rs.getLong("estoqueProduto"),
                    rs.getBoolean("foraDeUso"),
                    rs.getDouble("icms"),
                    rs.getDouble("ipi"),
                    rs.getLong("garantia"),
                    rs.getString("fornecedorProduto"),
                    rs.getString("setor"),
                    rs.getBlob("fotoProduto"),
                    rs.getString("obs"),
                    rs.getTimestamp("dataCadastro"),
                    rs.getTimestamp("dataValidade"),
                    rs.getBoolean("grade"),
                    rs.getBoolean("sel"),
                    rs.getBoolean("verificactrlest"),
                    rs.getTimestamp("atualizadoEm"),
                    rs.getBoolean("tblPrecos")
            );
            return produto;
        } catch (SQLException e) {
            log.error("Erro ao buscar dados em CadProdutos" + e);
            return produto;
        }
    }

    @Override
    public Iterable<CadProdutos> findAllById(Iterable<String> ids) {
        throw new UnsupportedOperationException("Not supported yet."); //To change body of generated methods, choose Tools | Templates.
    }

    @Override
    public long count() {
        throw new UnsupportedOperationException("Not supported yet."); //To change body of generated methods, choose Tools | Templates.
    }

    @Override
    public void deleteById(String id) {
        throw new UnsupportedOperationException("Not supported yet."); //To change body of generated methods, choose Tools | Templates.
    }

    @Override
    public void delete(CadProdutos entity) {
        throw new UnsupportedOperationException("Not supported yet."); //To change body of generated methods, choose Tools | Templates.
    }

    @Override
    public void deleteAllById(Iterable<? extends String> ids) {
        throw new UnsupportedOperationException("Not supported yet."); //To change body of generated methods, choose Tools | Templates.
    }

    @Override
    public void deleteAll(Iterable<? extends CadProdutos> entities) {
        throw new UnsupportedOperationException("Not supported yet."); //To change body of generated methods, choose Tools | Templates.
    }

    @Override
    public void deleteAll() {
        throw new UnsupportedOperationException("Not supported yet."); //To change body of generated methods, choose Tools | Templates.
    }

}
