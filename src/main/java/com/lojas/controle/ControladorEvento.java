package com.lojas.controle;

import com.lojas.modelo.Andamento;
import com.lojas.modelo.Evento;
import com.lojas.modelo.EventoRepositorio;
import com.lojas.modelo.PessoaRepositorio;
import java.lang.reflect.InvocationTargetException;
import java.lang.reflect.Method;
import java.sql.Timestamp;
import java.text.ParseException;
import java.text.SimpleDateFormat;
import java.util.List;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpSession;
import lombok.extern.log4j.Log4j2;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestMethod;
import org.springframework.web.bind.annotation.RestController;

@Log4j2
@CrossOrigin(origins = {"*", "http://10.136.131.128:8082", "http://localhost:8082", "http://10.136.131.128:3000", "http://localhost:3000"})
@RestController
public class ControladorEvento {

    @Autowired
    EventoRepositorio eventoRepositorio;

    @Autowired
    PessoaRepositorio pessoaRepositorio;

    @RequestMapping(value = {"/evento/iniciar"}, method = RequestMethod.POST)
    //Este método tenta conseguir um evento aberto, se não conseguir, tenta criar um.
    public Evento setEvento() {

        Evento evento = null;

        /*
         * Quando o cliente solicita um evento, podem acontecer três situações:
         * 1) O evento já estar em andamento 
         * 2) Já houve eventos mas estão todos encerrados 
         * 3) Não existe nenhum evento na base de dados
         *
         * O primeiro try tenta buscar um evento em andamento. Isto é útil quando
         * há várias sessões abertas, em computadores, páginas ou abas diferentes.*/
        try {

            evento = eventoRepositorio.getUltimoAberto();
            log.debug("Último evento aberto: " + evento.getId() + " às " + evento.getDataHoraInicio());
            evento.setEmAndamento(true);

        } catch (Exception e) {

            log.error("Não há eventos abertos. " + e.getMessage());
            /*Se o retorno de evento em andamento falhar, tenta-se buscar o id do último
            evento encerrado, para que um novo possa iniciar com o id correto.*/

            try {

                evento = eventoRepositorio.getUltimo();
                log.debug("Retornando nova sessão: " + evento.getDataHoraFim());
                /*Tenta criar um novo evento, iterando o id*/
                evento.setId(evento.getId() + 1);
                /*Quando é criado, o evento recebe uma estampa do tempo*/
                evento.setDataHoraInicio(new Timestamp(System.currentTimeMillis()));
                /*Independente se o evento foi encerrado ou não, se alguma outra sessão abrir
                o evento, ele perde o tempo de finalização.*/
                evento.setDataHoraFim(null);
                eventoRepositorio.save(evento);
                /*Necessário limpar a lista pública e estática a cada novo evento*/
                Andamento.listaAndamento.clear();
                evento.setEmAndamento(true);

            } catch (Exception ee) {

                log.error("Não há eventos no banco. Tentando criar novo evento. " + ee.getMessage());
                /*Se falhar tanto em buscar um evento aberto qnto em um finalizado, isto pode indicar
                que não há eventos no banco. Ele tentará criar um com Id 1.*/
                try {

                    evento = new Evento();
                    evento.setId(1);
                    evento.setDataHoraInicio(new Timestamp(System.currentTimeMillis()));
                    evento.setDataHoraFim(null);
                    eventoRepositorio.save(evento);
                    /*Necessário limpar a lista pública e estática a cada novo evento*/
                    Andamento.listaAndamento.clear();
                    evento.setEmAndamento(true);
                    log.debug("Evento criado: " + evento.getId());

                } catch (Exception eee) {

                    Andamento.listaAndamento.clear();
                    log.error("Erro ao acessar tabela Eventos" + eee);

                }
            }
        }

        if (evento != null && evento.isEmAndamento()) {
            log.debug("Evento aberto em andamento: " + evento.getId());
        } else if (evento != null && !evento.isEmAndamento()) {
            log.debug("Evento fechado: " + evento.getId());
        }
        return evento;
    }

    @RequestMapping(value = {"/evento/pesquisar"}, method = RequestMethod.GET)
    public Evento getEvento() {

        Evento evento = new Evento();
        evento.setEmAndamento(false);

        /*
         * Quando o cliente solicita um evento, podem acontecer três situações:
         * 1) O evento já estar em andamento 
         * 2) Já houve eventos mas estão todos encerrados 
         * 3) Não existe nenhum evento na base de dados
         */
 /*O primeiro try, tenta buscar um evento em andamento. Isto é útil quando
        há várias sessões abertas, em computadores, páginas ou abas diferentes.*/
        try {

            evento = eventoRepositorio.getUltimoAberto();
            log.debug("Último evento aberto: " + evento.getDataHoraInicio() + " " + evento.getId());
            evento.setEmAndamento(true);

        } catch (Exception e) {

            log.error("Não há evento aberto. " + e.getMessage());

            try {

                evento = eventoRepositorio.getUltimo();
                log.debug("Último evento: " + evento.getDataHoraInicio() + " " + evento.getId());

            } catch (Exception ee) {
                log.error("Não há evento. " + ee.getMessage());
            }

        }
        return evento;
    }

    @RequestMapping(value = {"/evento/parar"}, method = RequestMethod.POST)
    public Evento pararEvento(HttpServletRequest request, HttpSession sessao
    ) {

        Integer id = Integer.valueOf(request.getParameter("id"));

        try {
            Evento ultimoEvento = eventoRepositorio.findById(id).get();
            ultimoEvento.setDataHoraFim(new Timestamp(System.currentTimeMillis()));
            ultimoEvento.setEmAndamento(false);
            eventoRepositorio.save(ultimoEvento);
            Andamento.listaAndamento.clear();
            return ultimoEvento;
        } catch (Exception e) {
            log.debug("Erro no POST. " + e.getMessage());
            return null;
        }
    }

    /*O método checkPoints recebe dados do front end relacionados aos momentos que
    certas ações são realizadas. Os dados chegam ao par, contendo uma String flag,
    onde é enviado qual checkpoint foi atualizado e uma String com o timestamp.*/
    @RequestMapping(value = {"/evento/salvar/flag"}, method = RequestMethod.POST)
    public Evento setEventoFlags(HttpServletRequest request, HttpSession sessao) {

        log.debug("Controle de flags");
        Evento ultimoEventoAberto = null;
        try {

            String flag = request.getParameter("flag");
            String horario = request.getParameter("horario");
            Integer idEvento = Integer.valueOf(request.getParameter("idEvento"));
            ultimoEventoAberto = eventoRepositorio.findById(idEvento).get();

            try {
                //Formata a string recebida para uso no banco de dados
                log.debug("Controle de flags recebendo horario: " + horario);

                //Se o horário recebido for válido, tenta salvar
                if (horario != null) {
                    Timestamp ts = new java.sql.Timestamp(new SimpleDateFormat("dd/MM/yy hh:mm:ss").parse(horario).getTime());
                    /*Reflection para transformar o nome do checkpoint em um método da classe Evento.
                    O método é um bean, logo possui prefixo (set, get ou is). No caso será um set[Flag] com um objeto Timestamp como argumento. 
                    Não se pode mudar os nomes dos métodos sem que o frontend e o backend se reflitam.*/
                    String strFlag = flag.substring(0, 1).toUpperCase() + flag.substring(1);

                    //Testa se já existe horário válido, a fim de não sobrescrevê-lo. A seuqência para atualizar, é apagar (set null) e depois setar um valor válido.
                    Method metodoGet = Class.forName("com.adam.eor.modelo.Evento").getDeclaredMethod("get" + strFlag);
                    Timestamp tsAntigo = (Timestamp) metodoGet.invoke(ultimoEventoAberto);

                    //Para efetivamente salva o novo horário, além de não ter horário antigo no flag, o evento também deve estar aberto. 
                    if (tsAntigo == null && ultimoEventoAberto.getDataHoraFim() == null) {
                        Class.forName("com.adam.eor.modelo.Evento").getDeclaredMethod("set" + strFlag, Timestamp.class).invoke(ultimoEventoAberto, ts);
                        log.debug("Atualizado horário : " + strFlag);
                        ultimoEventoAberto.setEmAndamento(true);
                    } else {
                        log.debug("Horário antigo de " + strFlag + " é " + tsAntigo);
                        ultimoEventoAberto.setEmAndamento(true);
                    }
                } else {
                    String strFlag = flag.substring(0, 1).toUpperCase() + flag.substring(1);
                    Class.forName("com.adam.eor.modelo.Evento").getDeclaredMethod("set" + strFlag, Timestamp.class).invoke(ultimoEventoAberto, (Object) null);
                    ultimoEventoAberto.setEmAndamento(true);
                    log.debug("Apagado horário : " + strFlag);
                }
                eventoRepositorio.save(ultimoEventoAberto);
            } catch (ClassNotFoundException | IllegalAccessException | IllegalArgumentException | NoSuchMethodException | SecurityException | InvocationTargetException | ParseException ex) {
                log.error("Erro 1 ao atualizar flags. " + ex);
            }
        } catch (NumberFormatException e) {
            log.error("Erro ao 2 atualizar flags. " + e.getMessage());
        }

        return ultimoEventoAberto;
    }

    @RequestMapping(value = {"/evento/pesquisar/flag"}, method = RequestMethod.GET)
    public Evento getEventoFlags(HttpServletRequest request, HttpSession sessao) {

        Evento ultimoEventoAberto = null;

        try {

            String flag = request.getParameter("flag");
            Integer idEvento = Integer.valueOf(request.getParameter("idEvento"));

            ultimoEventoAberto = eventoRepositorio.findById(idEvento).get();

            log.debug("Flag " + flag + " pesquisando evento " + idEvento);

            try {
                Method metodoGet = Class.forName("com.adam.eor.modelo.Evento").getDeclaredMethod("get" + flag, Timestamp.class);
                Timestamp ts = (Timestamp) metodoGet.invoke(ultimoEventoAberto);
                log.debug("Retornado: " + ts);

            } catch (ClassNotFoundException | IllegalAccessException | IllegalArgumentException | NoSuchMethodException | SecurityException | InvocationTargetException ex) {
                log.error("Erro ao buscar flags. " + ex.getMessage());
            }
        } catch (NumberFormatException e) {
        }

        return ultimoEventoAberto;
    }

    @RequestMapping(value = {"/eventos/"}, method = {RequestMethod.GET})
    @CrossOrigin(origins = {"*", "http://10.136.131.128:8082", "http://localhost:8082", "http://10.136.131.128:3000", "http://localhost:3000"})
    public List<Evento> getEventos(HttpServletRequest request, HttpSession sessao) {
        String inicio = request.getParameter("inicio");
        String fim = request.getParameter("fim");
        return eventoRepositorio.findByIntervalo(inicio, fim);
    }

    @RequestMapping(value = {"/eventos/id/{id}"}, method = {RequestMethod.GET})
    @CrossOrigin(origins = {"*", "http://10.136.131.128:8082", "http://localhost:8082", "http://10.136.131.128:3000", "http://localhost:3000"})
    public Evento getEventosId(@PathVariable("id") String id, HttpSession sessao, HttpServletRequest request) {
        try {
            int i = Integer.valueOf(id);
            return eventoRepositorio.findById(i).get();
        } catch (NumberFormatException e) {
        }
        return null;
    }
}
