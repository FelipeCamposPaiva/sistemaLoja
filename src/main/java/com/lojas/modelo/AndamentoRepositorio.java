package com.lojas.modelo;

import com.lojas.modelo.classId.AndamentoId;
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
public class AndamentoRepositorio implements CrudRepository<Andamento, AndamentoId> {

    private final JdbcTemplate jdbc;

    @Autowired
    EventoRepositorio er;
    @Autowired
    PessoaRepositorio pr;

    @Autowired
    public AndamentoRepositorio(JdbcTemplate jdbc) {
        this.jdbc = jdbc;
    }

    @Override
    public <S extends Andamento> S save(S entity) {

        try {
            jdbc.update("update Andamento set horario = ?, ip = ?  where fkEvento = ? and fkPessoa like ?",
                    entity.getHorario(), entity.getIp(), entity.getIdEvento(), entity.getIdPessoa());
            return entity;
        } catch (DataAccessException e) {
            log.debug("Erro ao salvar Andamento: " + e);
            jdbc.update("insert into Andamento (fkEvento, fkPessoa, horario, origem, ip) values (?, ?, ?, ?, ?)", entity.getEvento().getId(),
                    entity.getPessoa().getId(), entity.getHorario(), entity.getPessoa().getBaleeira(), entity.getIp());
            return entity;
        }

    }

    @Override
    public <S extends Andamento> Iterable<S> saveAll(Iterable<S> entities) {

        for (Andamento entity : entities) {
            try {
                jdbc.update("insert into Andamento (fkEvento, fkPessoa, horario, origem) values (?, ?, ?, ?)", entity.getEvento().getId(),
                        entity.getPessoa().getId(), entity.getHorario(), entity.getPessoa().getBaleeira());
            } catch (Exception e) {
                log.debug("Erro na pré-lista. " + e);
            }
        }

        return null;

    }

    @Override
    public Optional<Andamento> findById(AndamentoId id) {
        throw new UnsupportedOperationException("Not supported yet."); //To change body of generated methods, choose Tools | Templates.
    }

    @Override
    public boolean existsById(AndamentoId id) {
        throw new UnsupportedOperationException("Not supported yet."); //To change body of generated methods, choose Tools | Templates.
    }

    @Override
    public Iterable<Andamento> findAll() {
        return jdbc.query("select * from Andamento order by Horario desc", this::mapeiaLinha);
    }

    public Iterable<Andamento> findAll(long idEvento,String coluna, String sentido) {
        return jdbc.query("select * from Andamento where fkEvento = ? order by " + coluna + "  " + sentido, this::mapeiaLinha, idEvento);
    }

    public Iterable<Andamento> findAllByIdEvento(long idEvento, String coluna, String sentido) {
        try {
            return jdbc.query("select * from Andamento as A "
                    + "inner join Pessoas as P "
                    + "on (A.fkPessoa = P.Id) "
                    + "where (A.fkEvento = ?)"
                    + "order by " + coluna + " " + sentido, this::mapeiaLinha, idEvento);
        } catch (DataAccessException e) {
            log.debug("Erro ao mapear linha Andamento: " + e);
            return null;
        }
    }

    public Iterable<Andamento> findAllByIdEvento(long idEvento) {
        try {
            return jdbc.query("select * from Andamento as A "
                    + "inner join Pessoas as P "
                    + "on (A.fkPessoa = P.Id) "
                    + "where (A.fkEvento = ?)"
                    + "order by Horario desc", this::mapeiaLinha, idEvento);
        } catch (DataAccessException e) {
            log.debug("Erro ao mapear linha Andamento: " + e);
            return null;
        }

    }

    private Andamento mapeiaLinha(ResultSet rs, int rowNum) {
        Andamento andamento;
        Evento evento;
        Pessoa pessoa;

        try {

            evento = er.findById(rs.getInt("fkEvento")).get();
            //log.debug("Teste findAll Evento " + evento.getDataHoraInicio());
            pessoa = pr.findOne(rs.getString("fkPessoa"));
            //log.debug("Teste findAll Pessoa " + pessoa.getBaleeira());
            andamento = new Andamento(evento, pessoa, rs.getTimestamp("horario"), rs.getString("IP"));
            return andamento;
        } catch (SQLException e) {
            log.error("Erro ao buscar dados em Andamento: " + e);
            return null;
        }
    }

    @Override
    public Iterable<Andamento> findAllById(Iterable<AndamentoId> ids) {
        throw new UnsupportedOperationException("Not supported yet."); //To change body of generated methods, choose Tools | Templates.
    }

    @Override
    public long count() {
        throw new UnsupportedOperationException("Not supported yet."); //To change body of generated methods, choose Tools | Templates.
    }

    @Override
    public void deleteById(AndamentoId id) {
        throw new UnsupportedOperationException("Not supported yet."); //To change body of generated methods, choose Tools | Templates.
    }

    @Override
    public void delete(Andamento entity) {
        throw new UnsupportedOperationException("Not supported yet."); //To change body of generated methods, choose Tools | Templates.
    }

    @Override
    public void deleteAllById(Iterable<? extends AndamentoId> ids) {
        throw new UnsupportedOperationException("Not supported yet."); //To change body of generated methods, choose Tools | Templates.
    }

    @Override
    public void deleteAll(Iterable<? extends Andamento> entities) {
        throw new UnsupportedOperationException("Not supported yet."); //To change body of generated methods, choose Tools | Templates.
    }

    @Override
    public void deleteAll() {
        throw new UnsupportedOperationException("Not supported yet."); //To change body of generated methods, choose Tools | Templates.
    }

}
