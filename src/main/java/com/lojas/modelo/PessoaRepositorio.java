package com.lojas.modelo;

import java.sql.ResultSet;
import java.sql.SQLException;
import java.util.Optional;
import java.util.logging.Level;
import java.util.logging.Logger;
import lombok.extern.log4j.Log4j2;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.dao.DataAccessException;
import org.springframework.data.repository.CrudRepository;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;

@Log4j2
@Repository
public class PessoaRepositorio implements CrudRepository<Pessoa, String> {

    private final JdbcTemplate jdbc;

    @Autowired
    public PessoaRepositorio(JdbcTemplate jdbc) {
        this.jdbc = jdbc;
    }

    @Override
    public <S extends Pessoa> S save(S pessoa) {

        /*O método primeiramente tenta salvar o objeto. Se não conseguir, tenta atualizar o objeto.
        Se falhar nas duas tentativas, lançará um erro e gravará no log (do log4j) e na lista de mensagens
        que retornará ao servidor de chamad (e pode ser enviado para o cliente).*/
        try {
            jdbc.update("insert into Pessoas (id, nome, sobrenome, matricula, empresa, funçãoEmpresa, dataCadastro, "
                    + "dataEmbarque, camarote, funçãoEOR, embarcado, baleeira, dias, ramal) values (?,?,?,?,?,?,?,?,?,?,?,?,?,?)",
                    pessoa.getId(), pessoa.getNome(), pessoa.getSobreNome(), pessoa.getMatricula(), pessoa.getEmpresa(),
                    pessoa.getFnEmpresa(), pessoa.getDataCadastro(), pessoa.getDataEmbarque(), pessoa.getCamarote(),
                    pessoa.getFnEOR(), pessoa.isEmbarcado(), pessoa.getBaleeira(), pessoa.getDias(), pessoa.getRamal());
        } catch (DataAccessException e) {
            try {
                log.debug("Tentando atualizar: " + pessoa.getMatricula());
                jdbc.update("update Pessoas set "
                        + "id = ?, "
                        + "nome = ?, "
                        + "sobreNome = ?, "
                        + "matricula = ?, "
                        + "empresa = ?, "
                        + "funçãoEmpresa = ?, "
                        + "dataCadastro = ?,"
                        + "dataEmbarque = ?,"
                        + "camarote = ?, "
                        + "funçãoEOR = ?, "
                        + "embarcado = ?, "
                        + "baleeira = ?, "
                        + "dias = ?, "
                        + "ramal = ? "
                        + "where matricula = ?",
                        pessoa.getId(), pessoa.getNome(), pessoa.getSobreNome(), pessoa.getMatricula(), pessoa.getEmpresa(),
                        pessoa.getFnEmpresa(), pessoa.getDataCadastro(), pessoa.getDataEmbarque(), pessoa.getCamarote(),
                        pessoa.getFnEOR(), pessoa.isEmbarcado(), pessoa.getBaleeira(), pessoa.getDias(), pessoa.getRamal(), pessoa.getMatricula());
            } catch (DataAccessException ef) {
                new Erro(ef, this.getClass(), ef.getStackTrace()[0].getMethodName());
            }
        }

        return pessoa;
    }

    @Override
    public <S extends Pessoa> Iterable<S> saveAll(Iterable<S> entities) {
        for (Pessoa pessoa : entities) {
            try {
                jdbc.update("insert into Pessoas (id, nome, sobrenome, matricula, empresa, funçãoEmpresa, dataCadastro, "
                        + "dataEmbarque, camarote, funçãoEOR, embarcado, baleeira, dias, ramal) values (?,?,?,?,?,?,?,?,?,?,?,?,?,?)",
                        pessoa.getId(), pessoa.getNome(), pessoa.getSobreNome(), pessoa.getMatricula(), pessoa.getEmpresa(),
                        pessoa.getFnEmpresa(), pessoa.getDataCadastro(), pessoa.getDataEmbarque(), pessoa.getCamarote(),
                        pessoa.getFnEOR(), pessoa.isEmbarcado(), pessoa.getBaleeira(), pessoa.getDias(), pessoa.getRamal());
            } catch (DataAccessException e) {
                Exception novaException = new Exception("INSERT: " + pessoa.getMatricula() + " :: " + e.getMessage() + " ::: " + e.getCause(), e);
                //new Erro(novaException, this.getClass(), novaException.getStackTrace()[0].getMethodName());
                try {

                    if (pessoa.getMatricula().isEmpty()) {
                        Exception novaException3 = new Exception("Erro no UPDATE - Matrícula não existente: " + pessoa.getNome() + " " + pessoa.getSobreNome());
                        new Erro(novaException3, this.getClass(), novaException3.getStackTrace()[0].getMethodName());
                    }

                    log.debug("Tentando atualizar: " + pessoa.getMatricula());
                    jdbc.update("update Pessoas set "
                            + "id = ?, "
                            + "nome = ?, "
                            + "sobreNome = ?, "
                            + "matricula = ?, "
                            + "empresa = ?, "
                            + "funçãoEmpresa = ?, "
                            + "dataCadastro = ?,"
                            + "dataEmbarque = ?,"
                            + "camarote = ?, "
                            + "funçãoEOR = ?, "
                            + "embarcado = ?, "
                            + "baleeira = ?, "
                            + "dias = ?, "
                            + "ramal = ? "
                            + "where matricula = ?",
                            pessoa.getId(), pessoa.getNome(), pessoa.getSobreNome(), pessoa.getMatricula(), pessoa.getEmpresa(),
                            pessoa.getFnEmpresa(), pessoa.getDataCadastro(), pessoa.getDataEmbarque(), pessoa.getCamarote(),
                            pessoa.getFnEOR(), pessoa.isEmbarcado(), pessoa.getBaleeira(), pessoa.getDias(), pessoa.getRamal(), pessoa.getMatricula());
                } catch (DataAccessException ef) {
                    try {
                        Exception novaException2 = new Exception("UPDATE: " + pessoa.getMatricula() + " :: " + ef.getMessage() + " ::: " + ef.getCause(), ef);
                        new Erro(novaException2, this.getClass(), novaException2.getStackTrace()[0].getMethodName());
                    } catch (Exception ex) {
                        Logger.getLogger(PessoaRepositorio.class.getName()).log(Level.SEVERE, null, ex);
                    }
                }
            }
        }
        return null;
    }

    @Override
    public Optional<Pessoa> findById(String id) {
        throw new UnsupportedOperationException("Not supported yet."); //To change body of generated methods, choose Tools | Templates.
    }

    @Override
    public boolean existsById(String id) {
        throw new UnsupportedOperationException("Not supported yet."); //To change body of generated methods, choose Tools | Templates.
    }

    @Override
    public Iterable<Pessoa> findAll() {
        return jdbc.query("select * from Pessoas", this::mapeiaLinha);
    }

    public Iterable<Pessoa> findAll(String sentido, String coluna) {

        return jdbc.query("select * from Pessoas ORDER by " + coluna + " " + sentido, this::mapeiaLinha);
    }

    public Iterable<Pessoa> findAllByName(String nome) {
        return jdbc.query("select * from Pessoas where nome like ? ", this::mapeiaLinha, "%" + nome + "%");
    }

    public Iterable<Pessoa> findAllEmbarcado() {
        return jdbc.query("select * from Pessoas where embarcado = 'true'", this::mapeiaLinha);
    }

    private Pessoa mapeiaLinha(ResultSet rs, int rowNum) {
        Pessoa pessoa = new Pessoa();

        try {
            pessoa = new Pessoa(rs.getString("id"),
                    rs.getString("nome"),
                    rs.getString("sobrenome"),
                    rs.getString("matricula"),
                    rs.getString("empresa"),
                    rs.getString("funçãoEmpresa"),
                    rs.getTimestamp("dataCadastro"),
                    rs.getTimestamp("dataEmbarque"),
                    rs.getString("camarote"),
                    rs.getString("funçãoEOR"),
                    rs.getBoolean("embarcado"),
                    rs.getString("baleeira"),
                    rs.getInt("dias"),
                    rs.getString("ramal"));

            return pessoa;
        } catch (SQLException e) {
            log.error("Erro ao buscar dados em Pessoas: " + e);
            pessoa.setId("ID...");
            pessoa.setNome("Nome");
            return pessoa;
        }
    }

    public Pessoa findOne(String id) {

        Pessoa pessoa = null;
        try {
            pessoa = jdbc.queryForObject("select * from Pessoas where (id = ?) ", this::mapeiaLinha, id);
        } catch (DataAccessException e) {
            log.error("[1] Erro ao pesquisar por " + id + " " + e);
            try {
            } catch (Exception ee) {
                pessoa = jdbc.queryForObject("select * from Pessoas where (id like ?) ", this::mapeiaLinha, "%" + id + "%");
                log.error("[2] Erro ao pesquisar por " + id + " " + ee);
            }
        }

        return pessoa;
    }

    public Pessoa findOneName(String nome) {

        Pessoa pessoa = null;
        try {
            pessoa = jdbc.queryForObject("select * from Pessoas where (nome like ?) ", this::mapeiaLinha, nome);
        } catch (DataAccessException e) {
            log.error("Erro ao pesquisar por " + nome + " " + e);
        }

        return pessoa;
    }

    @Override
    public Iterable<Pessoa> findAllById(Iterable<String> ids) {
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
    public void delete(Pessoa entity) {
        throw new UnsupportedOperationException("Not supported yet."); //To change body of generated methods, choose Tools | Templates.
    }

    @Override
    public void deleteAllById(Iterable<? extends String> ids) {
        throw new UnsupportedOperationException("Not supported yet."); //To change body of generated methods, choose Tools | Templates.
    }

    @Override
    public void deleteAll(Iterable<? extends Pessoa> entities) {
        throw new UnsupportedOperationException("Not supported yet."); //To change body of generated methods, choose Tools | Templates.
    }

    @Override
    public void deleteAll() {
        throw new UnsupportedOperationException("Not supported yet."); //To change body of generated methods, choose Tools | Templates.
    }

}
