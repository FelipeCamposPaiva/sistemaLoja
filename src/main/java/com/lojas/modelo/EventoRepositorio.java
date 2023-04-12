package com.lojas.modelo;

import java.sql.ResultSet;
import java.sql.SQLException;
import java.util.List;
import java.util.Optional;
import lombok.extern.log4j.Log4j2;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.dao.DataAccessException;
import org.springframework.data.repository.CrudRepository;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;

@Log4j2
@Repository
public class EventoRepositorio implements CrudRepository<Evento, Integer> {

    private final JdbcTemplate jdbc;

    @Autowired
    public EventoRepositorio(JdbcTemplate jdbc) {
        this.jdbc = jdbc;
    }

    @Override
    public <S extends Evento> S save(S evento) {
        try {
            jdbc.update("insert into Eventos (id, dataHoraInicio, dataHoraFim) values (?,?,?)",
                    evento.getId(), evento.getDataHoraInicio(), evento.getDataHoraFim());
        } catch (DataAccessException e) {
            try {
                jdbc.update("update Eventos set "
                        + "dataHoraFim = ?, "
                        + "brigada = ?, "
                        + "baleeira_1_3 = ?, "
                        + "baleeira_2_4 = ?, "
                        + "FT_Manutenção = ?, "
                        + "FT_Operação = ?, "
                        + "Cinema = ?,"
                        + "Refeitório = ?,"
                        + "CCR = ?, "
                        + "Socorrista = ?, "
                        + "Abandono = ? "
                        + "where id = ?",
                        evento.getDataHoraFim(),
                        evento.getBrigada(),
                        evento.getBaleeira_1_3(),
                        evento.getBaleeira_2_4(),
                        evento.getFtManutencao(),
                        evento.getFtOperacao(),
                        evento.getCinema(),
                        evento.getRefeitorio(),
                        evento.getCcr(),
                        evento.getSocorrista(),
                        evento.getAbandono(),
                        evento.getId());

            } catch (DataAccessException ee) {
                log.error(ee);
            }
        }
        return evento;
    }

    private Evento mapeiaLinha(ResultSet rs, int rowNum) {
        Evento evento = new Evento();

        try {
            evento = new Evento(rs.getLong("id"),
                    rs.getTimestamp("dataHoraInicio"),
                    rs.getTimestamp("dataHoraFim"),
                    rs.getString("fkComandante"),
                    rs.getTimestamp("brigada"),
                    rs.getTimestamp("baleeira_1_3"),
                    rs.getTimestamp("baleeira_2_4"),
                    rs.getTimestamp("FT_Manutenção"),
                    rs.getTimestamp("FT_Operação"),
                    rs.getTimestamp("cinema"),
                    rs.getTimestamp("refeitório"),
                    rs.getTimestamp("ccr"),
                    rs.getTimestamp("socorrista"),
                    rs.getTimestamp("abandono"));

            return evento;
        } catch (SQLException e) {
            log.error("Erro ao buscar dados em Eventos: " + e);
            return evento;
        }
    }

    @Override
    public <S extends Evento> Iterable<S> saveAll(Iterable<S> entities) {
        throw new UnsupportedOperationException("Not supported yet."); //To change body of generated methods, choose Tools | Templates.
    }

    public Evento getUltimo() {

        Evento evento = null;

        try {
            evento = jdbc.query("select * from eventos where id = (select max(id) from "
                    + "Eventos where ((dataHoraInicio is null and dataHoraFim is null)or(dataHoraInicio is not null and dataHoraFim is not null)))",
                    this::mapeiaLinha).get(0);
        } catch (Exception e) {
            log.error("Erro na busca pelo último evento aberto.");
        }
        return evento;

    }

    public Evento getUltimoAberto() {
        Evento evento = null;

        try {
            evento = jdbc.query("select * from eventos where id = (select max(id) from "
                    + "Eventos where dataHoraInicio is not null and dataHoraFim is null)",
                    this::mapeiaLinha).get(0);
        } catch (Exception e) {
            log.error("Erro na busca pelo último evento aberto.");
        }

        return evento;

    }

    @Override
    public Optional<Evento> findById(Integer id) {
        Evento e = jdbc.queryForObject("select * from Eventos where (id like ?) ", this::mapeiaLinha, id);
        Optional<Evento> oe = Optional.of(e);
        return oe;
    }

    @Override
    public boolean existsById(Integer id) {
        throw new UnsupportedOperationException("Not supported yet."); //To change body of generated methods, choose Tools | Templates.
    }

    @Override
    public Iterable<Evento> findAll() {
        return jdbc.query("select * from Evento", this::mapeiaLinha);
    }

    public List<Evento> findByIntervalo(String inicio, String fim) {
        return jdbc.query("select * from Evento where DataHoraInicio >= ? and DataHoraFim <= ?", this::mapeiaLinha, inicio, fim);
    }

    @Override
    public Iterable<Evento> findAllById(Iterable<Integer> ids) {
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
    public void delete(Evento entity) {
        throw new UnsupportedOperationException("Not supported yet."); //To change body of generated methods, choose Tools | Templates.
    }

    @Override
    public void deleteAllById(Iterable<? extends Integer> ids) {
        throw new UnsupportedOperationException("Not supported yet."); //To change body of generated methods, choose Tools | Templates.
    }

    @Override
    public void deleteAll(Iterable<? extends Evento> entities) {
        throw new UnsupportedOperationException("Not supported yet."); //To change body of generated methods, choose Tools | Templates.
    }

    @Override
    public void deleteAll() {
        throw new UnsupportedOperationException("Not supported yet."); //To change body of generated methods, choose Tools | Templates.
    }

}
