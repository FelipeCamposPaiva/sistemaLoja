package com.lojas.auxiliar;

import com.lojas.modelo.Pessoa;
import java.io.File;
import java.io.FileInputStream;
import java.io.FileNotFoundException;
import java.io.IOException;
import java.sql.Timestamp;
import java.util.ArrayList;
import java.util.List;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import lombok.Getter;
import lombok.Setter;
import lombok.extern.log4j.Log4j2;
import org.apache.poi.hssf.usermodel.HSSFSheet;
import org.apache.poi.hssf.usermodel.HSSFWorkbook;
import org.apache.poi.ss.usermodel.Row;

@Log4j2
@Setter
@Getter
public class Arquivo {

    private List listaPessoas = new ArrayList<Pessoa>();

    public Arquivo(File file) {
        this.listaPessoas.clear();
        log.debug("Criando arquivo: " + file.getAbsolutePath());
        this.trataArquivo(file);
    }

    private void trataArquivo(File file) {
        try {
            FileInputStream fis = new FileInputStream(file);
            HSSFWorkbook wb = new HSSFWorkbook(fis);
            HSSFSheet sheet = wb.getSheetAt(0);

            for (Row row : sheet) {
                if (row.getRowNum() > 5) {
                    try {

                        //Cria objeto pessoa
                        Pessoa p = new Pessoa();
                        //Cria Id
                        p.setId("FAKE" + System.currentTimeMillis());
                        //Pausa por 10ms para alterar o valor do Id
                        Thread.sleep(10);
                        //Lê o camarote da coluna A e seta no objeto
                        p.setCamarote(row.getCell(0).getStringCellValue().replace(" ", ""));
                        log.debug(" [1][camarote] : " + p.getCamarote());
                        //************************************************************//
                        //Prepara a coluna B para buscar nome e sobrenome
                        String[] nomeArray;
                        String sobrenome = "";
                        String nome = "";
                        nomeArray = row.getCell(1).getStringCellValue().split(" ");
                        for (int i = 0; i < nomeArray.length; i++) {

                            if (i > 0) {
                                sobrenome += " " + nomeArray[i];
                            } else if (i == 0) {
                                nome = (nomeArray[0]);
                            }
                        }
                        //Seta nome e sobrenome no objeto pessoa
                        p.setNome(nome);
                        log.debug(" [2a][Nome] : " + p.getNome());
                        p.setSobreNome(sobrenome);
                        log.debug(" [2b][Sobrenome] : " + p.getSobreNome());
                        //************************************************************//
                        p.setRamal(row.getCell(2).getStringCellValue().trim());
                        log.debug(" [3][Ramal] : " + p.getRamal());
                        p.setMatricula(row.getCell(3).getStringCellValue());
                        log.debug(" [4][Matrícula] : " + p.getMatricula());
                        p.setFnEmpresa(row.getCell(4).getStringCellValue());
                        log.debug(" [5][Função] : " + p.getFnEmpresa());
                        p.setEmpresa(row.getCell(5).getStringCellValue());
                        log.debug(" [6][Empresa] : " + p.getEmpresa());
                        //************************************************************//
                        //Prepara a coluna F para buscar baleeira
                        String strBaleeira = row.getCell(6).getStringCellValue();
                        Pattern pattern = Pattern.compile(".*(\\d).*(\\d).*");
                        Matcher matcher = pattern.matcher(strBaleeira);
                        if (matcher.find()) {
                            log.debug("Grupo 1: " + matcher.group(1) + "/" + matcher.group(2));
                        }
                        p.setBaleeira(matcher.group(1) + "/" + matcher.group(2));
                        log.debug(" [7][Baleeira] : " + p.getBaleeira());
                        //************************************************************//
                        p.setDias(Integer.parseInt(row.getCell(7).getStringCellValue().trim()));
                        log.debug(" [8][Dias] : " + p.getDias());
                        p.setEmbarcado(true);
                        p.setDataCadastro(new Timestamp(System.currentTimeMillis()));
                        log.debug(" [****************************************************************]");
                        this.listaPessoas.add(p);
                        log.debug("Nova pessoa " + this.listaPessoas.size());
                    } catch (Exception ee) {
                        log.error("Erro " + ee);
                    }
                }
            }

        } catch (FileNotFoundException ex) {
            log.error(ex);
        } catch (IOException ex) {
            log.error(ex);
        }
    }

}
