package com.lojas.controle;

import com.lojas.modelo.Erro;
import com.lojas.auxiliar.Arquivo;
import com.lojas.modelo.ErroRepositorio;
import com.lojas.modelo.Pessoa;
import com.lojas.modelo.PessoaRepositorio;
import java.io.File;
import java.io.IOException;
import java.io.InputStream;
import java.sql.Timestamp;
import java.text.ParseException;
import java.text.SimpleDateFormat;
import java.util.ArrayList;
import java.util.List;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpSession;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestMethod;

import lombok.extern.log4j.Log4j2;
import org.apache.commons.io.FileUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestPart;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

@Log4j2
@CrossOrigin(origins = {"*", "http://10.136.131.128:8082", "http://localhost:8082", "http://10.136.131.128:3000", "http://localhost:3000"})
@RestController
public class ControladorPessoa {

    @Autowired
    PessoaRepositorio repositorio;

    @Autowired
    ErroRepositorio erroRepositorio;

    @RequestMapping(value = {"/"}, method = {RequestMethod.GET})
    @CrossOrigin(origins = {"*", "http://10.136.131.128:8082", "http://localhost:8082", "http://10.136.131.128:3000", "http://localhost:3000"})
    public String getIndex() {
        return "index";
    }

    @RequestMapping(value = {"/pessoas"}, method = {RequestMethod.GET})
    @CrossOrigin(origins = {"*", "http://10.136.131.128:8082", "http://localhost:8082", "http://10.136.131.128:3000", "http://localhost:3000"})
    public List<Pessoa> getPessoa(HttpServletRequest request, HttpSession sessao) {
        List<Pessoa> lista = (List<Pessoa>) repositorio.findAll();

        return lista;
    }

    @RequestMapping(value = {"/pessoas/{coluna}/{sentido}"}, method = {RequestMethod.GET})
    @CrossOrigin(origins = {"*", "http://10.136.131.128:8082", "http://localhost:8082", "http://10.136.131.128:3000", "http://localhost:3000"})
    public List<Pessoa> getPessoaOrderBy(@PathVariable("coluna") String coluna, @PathVariable("sentido") String sentido) {

        List<Pessoa> lista = (List<Pessoa>) repositorio.findAll(sentido, coluna);

        return lista;
    }

    /*O REACT faz uma busca passando o parâmetro /pessoa seguido de um Nome, que é o Nome 
    da pessoa. O método retorna 0 à várias pessoas se houver requisição por Nome.*/
    @RequestMapping(value = {"/pessoa/nome/{nome}"}, method = {RequestMethod.GET})
    @CrossOrigin(origins = {"*", "http://10.136.131.128:8082", "http://localhost:8082", "http://10.136.131.128:3000", "http://localhost:3000"})
    public List<Pessoa> getPessoaNome(@PathVariable("nome") String nome, HttpSession sessao) {
        log.debug("Nome recebido: " + nome);

        /*As classes JDBC do Spring têm maior facilidade em retornar listas, mesmo sendo 
        necessário apenas um objeto.*/
        List<Pessoa> lista;

        try {
            lista = (List<Pessoa>) repositorio.findAllByName(nome);
            return lista;

        } catch (Exception e) {
            log.debug("Erro ao pesquisar por : " + nome + " " + e);
            return null;
        }
    }

    /*O REACT faz uma busca passando o parâmetro /pessoa seguido de um Id, que é o Id 
    do RFID. Aqui deve ser tratados os Ids inválidos e o retorno do banco.
    O método retorna apenas um Id se houver requisiççao por Id e uma lista se houver
    requisição genérica.*/
    @RequestMapping(value = {"/pessoa/id/{id}"}, method = {RequestMethod.GET})
    @CrossOrigin(origins = {"*", "http://10.136.131.128:8082", "http://localhost:8082", "http://10.136.131.128:3000", "http://localhost:3000"})
    public List<Pessoa> getPessoaId(@PathVariable("id") String id, HttpSession sessao) {
        log.debug("Id recebido: " + id);

        /*As classes JDBC do Spring têm maior facilidade em retornar listas, mesmo sendo 
        necessário apenas um objeto.*/
        List<Pessoa> listaFake = new ArrayList<>();

        try {
            listaFake.add(repositorio.findOne(id));
            return listaFake;

        } catch (Exception e) {
            log.debug("Erro ao pesquisar por : " + id + " " + e);
            return null;
        }
    }

    @RequestMapping(value = {"/pessoa/{id}"}, method = {RequestMethod.POST})
    @CrossOrigin(origins = {"*", "http://10.136.131.128:8082", "http://localhost:8082", "http://10.136.131.128:3000", "http://localhost:3000"})
    public List<Pessoa> setPessoaId(HttpServletRequest request, HttpSession sessao) {

        Pessoa pessoa = new Pessoa();

        try {
            Timestamp ts;
            log.debug("dataCadastro: " + request.getParameter("dataCadastro"));
            if (request.getParameter("dataCadastro") != null) {
                log.debug("Data cadastro Node " + request.getParameter("dataCadastro"));
                ts = new java.sql.Timestamp(new SimpleDateFormat("dd/MM/yyyy").parse(request.getParameter("dataCadastro").trim()).getTime());
                log.debug("Data cadastro SQL " + ts);
                pessoa.setDataCadastro(ts);
            }

            log.debug("dataEmbarque: " + request.getParameter("dataEmbarque"));
            if (request.getParameter("dataEmbarque") != null) {
                ts = new java.sql.Timestamp(new SimpleDateFormat("dd/MM/yyyy").parse(request.getParameter("dataEmbarque").trim()).getTime());
                pessoa.setDataEmbarque(ts);
            }

        } catch (ParseException ex) {
            log.debug("Erro: " + ex);
        } finally {
            log.debug("Id: " + request.getParameter("id"));
            if (request.getParameter("id") != null) {
                pessoa.setId(request.getParameter("id").trim());
            }

            log.debug("nome: " + request.getParameter("nome"));
            if (request.getParameter("nome") != null) {
                pessoa.setNome(request.getParameter("nome").trim());
            }

            log.debug("sobreNome: " + request.getParameter("sobreNome"));
            if (request.getParameter("sobreNome") != null) {
                pessoa.setSobreNome(request.getParameter("sobreNome").trim());
            }

            log.debug("matricula: " + request.getParameter("matricula"));
            if (request.getParameter("matricula") != null) {
                pessoa.setMatricula(request.getParameter("matricula").trim());
            }

            log.debug("empresa: " + request.getParameter("empresa"));
            if (request.getParameter("empresa") != null) {
                pessoa.setEmpresa(request.getParameter("empresa").trim());
            }

            log.debug("fnEmpresa: " + request.getParameter("fnEmpresa"));
            if (request.getParameter("fnEmpresa") != null) {
                pessoa.setFnEmpresa(request.getParameter("fnEmpresa").trim());
            }

            log.debug("camarote: " + request.getParameter("camarote"));
            if (request.getParameter("camarote") != null) {
                pessoa.setCamarote(request.getParameter("camarote").trim());
            }

            log.debug("fnEOR: " + request.getParameter("fnEOR"));
            if (request.getParameter("fnEOR") != null) {
                pessoa.setFnEOR(request.getParameter("fnEOR").trim());
            }

            log.debug("baleeira: " + request.getParameter("baleeira"));
            if (request.getParameter("baleeira") != null) {
                pessoa.setBaleeira(request.getParameter("baleeira").trim());
            }

            log.debug("embarcado: " + request.getParameter("embarcado"));
            if (request.getParameter("embarcado").contains("true")) {
                pessoa.setEmbarcado(true);
            } else {
                pessoa.setEmbarcado(false);
            }
        }

        try {
            log.debug("Salvando " + pessoa.getId());
            repositorio.save(pessoa);
        } catch (Exception e) {
            log.debug("Erro: " + e);
        }

        return null;
    }

    /* Ao receber o post /arquivo, um objeto multipaart apontado como arquivo é armazenado em um arquivo temporário.
    Este arquivo temporário é lido linha a linha na classe Arquivo (preparada para ler arquivos Excel).
    Na classe Arquivo cada linha, seguindo um padrão, é transformada em um objeto Pessoa, e cada pessoa é adicionada a uma lista.
    Esta lista é armazenada no banco de dados, na tabela Pessoas.
     */
    @RequestMapping(value = {"/pessoa/arquivo"}, method = {RequestMethod.POST}, consumes = {MediaType.MULTIPART_FORM_DATA_VALUE})
    @CrossOrigin(origins = {"*", "http://10.136.131.128:8082", "http://localhost:8082", "http://10.136.131.128:3000", "http://localhost:3000"})
    public String setArquivo(@RequestPart MultipartFile arquivo, HttpServletRequest request, HttpSession sessao) {

        InputStream is = null;
        ArrayList<Pessoa> lista;
        Arquivo objArquivo;

        try {
            Erro.listaErros.clear();
            is = arquivo.getInputStream();
            File arquivoTemporario = new File("..\\temp.xls");
            FileUtils.copyInputStreamToFile(is, arquivoTemporario);
            objArquivo = new Arquivo(arquivoTemporario);
            lista = (ArrayList<Pessoa>) objArquivo.getListaPessoas();

            repositorio.saveAll(lista);

        } catch (IOException ex) {
            log.error("Erro 1: " + ex);
        } finally {
            try {
                is.close();
            } catch (IOException ex) {
                log.error("Erro 2: " + ex);
            }
        }
        erroRepositorio.saveAll(Erro.listaErros);
        return null;
    }
}
