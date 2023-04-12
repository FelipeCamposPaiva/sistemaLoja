package com.lojas.modelo;

import java.sql.ResultSet;
import java.sql.SQLException;
import java.util.Optional;
import lombok.extern.log4j.Log4j2;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.dao.DataAccessException;
import org.springframework.data.repository.CrudRepository;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;

@Log4j2
@Repository
public class ErroRepositorio implements CrudRepository<Erro, Integer> {

    private final JdbcTemplate jdbc;

    @Autowired
    public ErroRepositorio(JdbcTemplate jdbc) {
        this.jdbc = jdbc;
    }

    @Override
    public <S extends Erro> S save(S entity) {
        throw new UnsupportedOperationException("Not supported yet."); //To change body of generated methods, choose Tools | Templates.
    }

    @Override
    public <S extends Erro> Iterable<S> saveAll(Iterable<S> entities) {
        for (Erro erro : entities) {
            try {
                jdbc.update("insert into Erros (DataErro, Mensagem, Metodo, ClasseOrigem, ClasseFinal) values (?,?,?,?,?)",
                        erro.getDataErro(), erro.getMensagem(), erro.getMetodo(), erro.getClasseOrigem(),
                        erro.getClasseFinal());
            } catch (DataAccessException e) {
                try {
                    jdbc.update("update Erros set "
                            + "DataErro = ?, "
                            + "Mensagem = ?, "
                            + "Metodo = ?, "
                            + "ClasseOrigem = ?, "
                            + "ClasseFinal = ? "
                            + "where id = ?",
                            erro.getDataErro(), erro.getMensagem(), erro.getMetodo(), erro.getClasseOrigem(),
                            erro.getClasseFinal(), erro.getId());

                } catch (DataAccessException ee) {
                    new Erro(ee, ee.getClass(), ee.getStackTrace()[0].getMethodName());
                    log.error("Erro ao salvar: " + erro.getId() + " " + ee);
                }
            }
        }
        return null;
    }

    @Override
    public Optional<Erro> findById(Integer id) {
        throw new UnsupportedOperationException("Not supported yet."); //To change body of generated methods, choose Tools | Templates.
    }

    @Override
    public boolean existsById(Integer id) {
        throw new UnsupportedOperationException("Not supported yet."); //To change body of generated methods, choose Tools | Templates.
    }

    @Override
    public Iterable<Erro> findAll() {
        throw new UnsupportedOperationException("Not supported yet."); //To change body of generated methods, choose Tools | Templates.
    }

    @Override
    public Iterable<Erro> findAllById(Iterable<Integer> ids) {
        throw new UnsupportedOperationException("Not supported yet."); //To change body of generated methods, choose Tools | Templates.
    }

    @Override
    public long count() {
        throw new UnsupportedOperationException("Not supported yet."); //To change body of generated methods, choose Tools | Templates.
    }

    @Override
    public void deleteById(Integer id) {
        throw new UnsupportedOperationException("Not supported yet."); //To change body of generated methods, choose Tools | Templates.
    }

    @Override
    public void delete(Erro entity) {
        throw new UnsupportedOperationException("Not supported yet."); //To change body of generated methods, choose Tools | Templates.
    }

    @Override
    public void deleteAllById(Iterable<? extends Integer> ids) {
        throw new UnsupportedOperationException("Not supported yet."); //To change body of generated methods, choose Tools | Templates.
    }

    @Override
    public void deleteAll(Iterable<? extends Erro> entities) {
        throw new UnsupportedOperationException("Not supported yet."); //To change body of generated methods, choose Tools | Templates.
    }

    @Override
    public void deleteAll() {
        throw new UnsupportedOperationException("Not supported yet."); //To change body of generated methods, choose Tools | Templates.
    }

    private Erro mapeiaLinha(ResultSet rs, int rowNum) {
        Erro erro = new Erro();

        try {
            erro = new Erro(rs.getTimestamp("DataErro"),
                    rs.getString("Mensagem"),
                    rs.getString("Metodo"),
                    rs.getString("ClasseOrigem"),
                    rs.getString("ClasseFinal"));

            log.debug("ID: " + rs.getString("id"));
            log.debug("NOME: " + rs.getString("nome"));

            return erro;
        } catch (SQLException e) {
            log.error("Erro ao buscar dados em Erro: " + e);
            return null;
        }
    }

}
