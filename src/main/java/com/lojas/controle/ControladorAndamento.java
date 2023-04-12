package com.lojas.controle;

import com.lojas.modelo.Andamento;
import com.lojas.modelo.AndamentoRepositorio;
import com.lojas.modelo.Evento;
import com.lojas.modelo.EventoRepositorio;
import com.lojas.modelo.Pessoa;
import com.lojas.modelo.PessoaRepositorio;
import java.sql.Timestamp;
import java.util.ArrayList;
import java.util.Collections;
import java.util.Comparator;
import java.util.List;
import java.util.Map;
import javax.servlet.http.HttpServletRequest;
import lombok.extern.log4j.Log4j2;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestMethod;
import org.springframework.web.bind.annotation.RestController;

@Log4j2
@CrossOrigin(origins = {"*", "http://10.136.131.128:8082", "http://localhost:8082", "http://10.136.131.128:3000", "http://localhost:3000"})
@RestController
public class ControladorAndamento {

    @Autowired
    AndamentoRepositorio repositorio;
    @Autowired
    PessoaRepositorio pessoaRepositorio;
    @Autowired
    EventoRepositorio eventoRepositorio;

    //Tenta buscar todos os itens na Tabela Andamento referentes ao Evento de id idEvento.
    @RequestMapping(value = {"/andamento/pesquisar"}, method = RequestMethod.GET)
    public List<Andamento> getAndamentoByIdEvento(HttpServletRequest request) {

        log.debug("Params: " + request.getQueryString());
        String paramColuna = null;
        String paramSentido = null;
        int paramEvento = 0;
        List<Andamento> lista = null;

        try {
            paramColuna = request.getParameter("coluna");
            paramSentido = request.getParameter("sentido");
            log.debug("Coluna: " + paramColuna);
            log.debug("Sentido: " + paramSentido);
        } catch (Exception e) {
            log.error("Erro coluna: " + e);
        }

        try {
            paramEvento = Integer.parseInt(request.getParameter("idEvento"));
            try {
                //Só executará o método caso a lista de Andamento esteja vazia.
                //A lista só é vazia no início do programa e quando um evento é encerrado
                if (Andamento.listaAndamento.size() > 0) {
                    log.debug("Retornando antiga lista de Andamento " + Andamento.listaAndamento.size());
                    ///Andamento.listaAndamento.clear();
                    if (paramColuna != null && paramSentido != null) {
                        log.debug("**** evento: " + paramEvento + " **** Col: " + paramColuna + " **** sentido: " + paramSentido);
                        lista = (List<Andamento>) repositorio.findAllByIdEvento(paramEvento, paramColuna, paramSentido);
                        lista.forEach(a -> {
                            Andamento.listaAndamento.put(a.getIdPessoa(), a);
                        });
                    } else if ((paramColuna == null || paramSentido == null) && paramEvento > 0) {
                        log.debug("++++ evento: " + paramEvento + " ++++ Col: " + paramColuna + " ++++ sentido: " + paramSentido);
                        lista = (List<Andamento>) repositorio.findAllByIdEvento(paramEvento);
                        lista.forEach(a -> {
                            Andamento.listaAndamento.put(a.getIdPessoa(), a);
                        });
                    }
                                       
                    return new ArrayList(Andamento.listaAndamento.values());
                } else {
                    //Método interno que retorna os itens do andamento atual
                    this.setPessoasEmbarcadas(paramEvento);
                }

                log.debug("Retornando nova lista de Andamento " + Andamento.listaAndamento.size());
                //Retonra só os objetos Andamento
                return new ArrayList(Andamento.listaAndamento.values());

            } catch (Exception e) {
                log.debug("Erro ao buscar tabela de Andamento. " + e);
                return null;
            }
        } catch (NumberFormatException e) {
            return null;
        }
    }

    /**
     * Quando o cliente fizer um post sobre o andamento do evento, deverá passar
     * como parâmetros o id do evento e o id da pessoa. O id da pessoa é obtido
     * pelo tag lido. O id do evento é obtido na hora que se abre a sessão.
     *
     * Ao chegarem ambos parâmetros, uma nova linha na tabela Andamento é
     * incluída. A tabela só tem 3 parâmetros, os ids de evento e pessoa e o
     * timestamp dado pela própria aplicação no servidor.
     *
     * @param request
     * @return Retorna uma lista com dados sobre o atual evento, com Ids das
     * pessoas e o timestamp da leitura do tag
     */
    @RequestMapping(value = {"/andamento/salvar"}, method = RequestMethod.POST)
    public List<Andamento> setPessoaEvento(HttpServletRequest request) {

        List<Andamento> array = new ArrayList();

        log.debug("Params: " + request.getQueryString());
        String paramColuna;
        String paramSentido;
        String paramPessoa;
        int paramEvento;
        List<Andamento> lista = null;

        try {
            paramPessoa = request.getParameter("idPessoa");
            paramColuna = request.getParameter("coluna");
            paramSentido = request.getParameter("sentido");
            log.debug("Coluna: " + paramColuna);
            log.debug("Sentido: " + paramSentido);
        } catch (Exception e) {
            log.error("Erro coluna: " + e);
        }

        try {
            paramEvento = Integer.parseInt(request.getParameter("idEvento"));
        } catch (NumberFormatException e) {
            paramEvento = (int) eventoRepositorio.getUltimoAberto().getId();
        }

        try {

            /*Cada tag lido será pesquisado no banco. Se encontrado, retornará dados sobre
            a pessoa. Esta pesquisa será feita apenas uma vez. Uma vez encontrada a pessoa, esta será 
            incluída em um HasSet, isto é, não poderá haver mesma assinatura de objeto.*/
            paramPessoa = request.getParameter("idPessoa");
            Pessoa pessoa = pessoaRepositorio.findOne(paramPessoa);

            paramEvento = Integer.valueOf(request.getParameter("idEvento"));
            Evento evento = eventoRepositorio.findById(paramEvento).get();

            /*Inclui nova linha na tabela Andamento*/
            Andamento andamento
                    = new Andamento(evento, pessoa, new Timestamp(System.currentTimeMillis()), request.getRemoteAddr());
            /*Quando o id do evento é 0, siginifica que não há nenhum evento cadastrado ainda no banco de dados.*/
            if (andamento.getIdEvento() > 0) {
                repositorio.save(andamento);
            }

            /*Uma lista completa (com join) é retornada para ser renderizada. Só é pesquisada no banco na 
            primeira utilização. Isto formará a tabela de itens completos, mesmo que o tag ainda não tenha sido 
            lido. Tags lidos são tratados mais abaixo.*/
            log.debug("Tamanho da lista estática: " + Andamento.listaAndamento.size());
            if (Andamento.listaAndamento.size() < 1) {

                lista = (List<Andamento>) repositorio.findAllByIdEvento(andamento.getEvento().getId());
                lista.forEach(a -> {
                    Andamento.listaAndamento.put(a.getIdPessoa(), a);
                });
            }
            try {
                Andamento.listaAndamento.put(pessoa.getId(), andamento);
                array = new ArrayList<>(Andamento.listaAndamento.values());

                try {
                    Collections.sort(array, new Comparator<Andamento>() {
                        @Override
                        public int compare(Andamento s1, Andamento s2) {

                            return s1.getPessoa().getNome().compareTo(s2.getPessoa().getNome());
                        }
                    });
                } catch (Exception eC) {
                    log.error("Erro ao tentar ordenar lista " + eC);
                }

                try {
                    Collections.sort(array, new Comparator<Andamento>() {
                        @Override
                        public int compare(Andamento s1, Andamento s2) {

                            Timestamp t1;
                            Timestamp t2;

                            if (s1.getHorario() == null) {
                                t1 = new Timestamp(System.currentTimeMillis() - 86400000);
                            } else {
                                t1 = s1.getHorario();
                            }

                            if (s2.getHorario() == null) {
                                t2 = new Timestamp(System.currentTimeMillis() - 86400000);
                            } else {
                                t2 = s2.getHorario();
                            }

                            return t1.compareTo(t2);
                        }
                    });
                } catch (Exception eC) {
                    log.error("Erro ao tentar ordenar lista " + eC);
                }

            } catch (Exception e) {
                log.debug(" Erro ao adicionar na lista estática: " + andamento + " " + e);
            }

            //HashSet<Andamento> mapLista = new HashSet<>(Andamento.listaAndamento.values());
            //array = new ArrayList(mapLista);
            return array;

        } catch (Exception e) {
        }
        return array;
    }

    @RequestMapping(value = {"/andamentos"}, method = RequestMethod.GET)
    public List<Andamento> getAndamentoAberto(HttpServletRequest request) {

        int paramEvento = Integer.valueOf(request.getParameter("idEvento"));
        log.debug("Retornando andamento aberto: " + paramEvento);

        List<Andamento> listaAndamento = (List<Andamento>) repositorio.findAllByIdEvento(paramEvento);
        return listaAndamento;
    }

    private Map<String, Andamento> setPessoasEmbarcadas(long idEvento) {

        //Cria uma lista com todas as pessoas embarcads do banco de dados
        List<Pessoa> listaEmbarcados = (List<Pessoa>) pessoaRepositorio.findAllEmbarcado();

        //Passa a lista obtida para o hashSet da classe Andamento
        listaEmbarcados.forEach(pessoaEmbarcada -> {
            Andamento objAndamento = new Andamento(new Evento(idEvento), pessoaEmbarcada, null, null);
            Andamento.listaAndamento.put(objAndamento.getPessoa().getId(), objAndamento);
        });

        repositorio.saveAll(Andamento.listaAndamento.values());

        return Andamento.listaAndamento;
    }

}
