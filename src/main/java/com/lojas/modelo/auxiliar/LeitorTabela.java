package com.lojas.modelo.auxiliar;

import com.lojas.modelo.CadProdutos;
import java.util.ArrayList;
import org.apache.logging.log4j.LogManager;
import org.apache.poi.ss.usermodel.Sheet;
import org.apache.poi.ss.usermodel.Workbook;
import java.io.IOException;
import org.apache.poi.ss.usermodel.CellType;
import org.apache.poi.ss.usermodel.Cell;
import org.apache.poi.ss.usermodel.Row;
import java.io.InputStream;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import java.io.FileInputStream;
import java.io.File;
import java.sql.Timestamp;
import java.text.SimpleDateFormat;
import java.util.List;
import javax.sql.rowset.serial.SerialBlob;
import lombok.extern.log4j.Log4j2;
import org.apache.logging.log4j.Logger;

@Log4j2
public class LeitorTabela {

    public static List<CadProdutos> lista = new ArrayList<CadProdutos>();

    public LeitorTabela() {
        try {
            final File arquivo = new File("C:\\Users\\Adam.ADAM\\Documents\\NetBeansProjects\\com.lojas_war_v1\\src\\main\\resources\\cad_produtos.xlsx");
            final FileInputStream fis = new FileInputStream(arquivo);
            final Workbook wb = (Workbook) new XSSFWorkbook((InputStream) fis);
            final Sheet sheet = wb.getSheetAt(0);
            int i = 0;
            for (final Row row : sheet) {
                final CadProdutos produto = new CadProdutos();
                ++i;
                for (final Cell cell : row) {
                    if (!cell.toString().isEmpty() && row.getRowNum() > 0) {
                        if (cell.getColumnIndex() == 0 && cell.getCellType() == CellType.NUMERIC) {
                            produto.setCodigo((long) cell.getNumericCellValue());
                        }
                        if (cell.getColumnIndex() == 1 && cell.getCellType() == CellType.STRING) {
                            produto.setCodProdManual(cell.getStringCellValue());
                        }
                        if (cell.getColumnIndex() == 2 && cell.getCellType() == CellType.STRING) {
                            produto.setDescricao(cell.getStringCellValue());
                        }
                        if (cell.getColumnIndex() == 3 && cell.getCellType() == CellType.STRING) {
                            produto.setUn(cell.getStringCellValue());
                        }
                        if (cell.getColumnIndex() == 4 && cell.getCellType() == CellType.NUMERIC) {
                            produto.setPreco(cell.getNumericCellValue());
                        }
                        if (cell.getColumnIndex() == 5 && cell.getCellType() == CellType.STRING) {
                            produto.setGrupoDeMaterias(cell.getStringCellValue());
                        }
                        if (cell.getColumnIndex() == 6 && cell.getCellType() == CellType.STRING) {
                            produto.setGrupoDeQuimico(cell.getStringCellValue());
                        }
                        if (cell.getColumnIndex() == 6 && cell.getCellType() == CellType.STRING) {
                            produto.setGrupoDeQuimico(cell.getStringCellValue());
                        }
                        if (cell.getColumnIndex() == 7 && cell.getCellType() == CellType.NUMERIC) {
                            produto.setEstoqueMinimo((long) cell.getNumericCellValue());
                        }
                        if (cell.getColumnIndex() == 8 && cell.getCellType() == CellType.NUMERIC) {
                            produto.setMl((long) cell.getNumericCellValue());
                        }
                        if (cell.getColumnIndex() == 9 && cell.getCellType() == CellType.NUMERIC) {
                            produto.setPrecoDeVenda(cell.getNumericCellValue());
                        }
                        if (cell.getColumnIndex() == 10 && cell.getCellType() == CellType.NUMERIC) {
                            produto.setPorcentagem(cell.getNumericCellValue());
                        }
                        if (cell.getColumnIndex() == 11 && cell.getCellType() == CellType.STRING) {
                            produto.setReferencia(cell.getStringCellValue());
                        }
                        if (cell.getColumnIndex() == 12 && cell.getCellType() == CellType.STRING) {
                            produto.setFabricante(cell.getStringCellValue());
                        }
                        if (cell.getColumnIndex() == 13 && cell.getCellType() == CellType.NUMERIC) {
                            produto.setPrecoAprazo(cell.getNumericCellValue());
                        }
                        if (cell.getColumnIndex() == 14 && cell.getCellType() == CellType.NUMERIC) {
                            produto.setEstoqueProduto((long) cell.getNumericCellValue());
                        }
                        if (cell.getColumnIndex() == 15 && cell.getCellType() == CellType.STRING) {
                            if (cell.getStringCellValue().trim().contains("Falso")) {
                                produto.setForaDeUso(false);
                            } else if (cell.getStringCellValue().trim().contains("Verdadeiro")) {
                                produto.setForaDeUso(true);
                            }
                        }
                        if (cell.getColumnIndex() == 16 && cell.getCellType() == CellType.NUMERIC) {
                            produto.setIcms(cell.getNumericCellValue());
                        }
                        if (cell.getColumnIndex() == 17 && cell.getCellType() == CellType.NUMERIC) {
                            produto.setIpi(cell.getNumericCellValue());
                        }
                        if (cell.getColumnIndex() == 18 && cell.getCellType() == CellType.NUMERIC) {
                            produto.setGarantia((long) cell.getNumericCellValue());
                        }
                        if (cell.getColumnIndex() == 19 && cell.getCellType() == CellType.STRING) {
                            produto.setFornecedorProduto(cell.getStringCellValue());
                        }
                        if (cell.getColumnIndex() == 20 && cell.getCellType() == CellType.STRING) {
                            produto.setSetor(cell.getStringCellValue());
                        }
                        if (cell.getColumnIndex() == 21 && cell.getCellType() == CellType.STRING) {
                            try {
                                produto.setFotoProduto(new SerialBlob(cell.getStringCellValue().getBytes("UTF-8")));
                            } catch (Exception e) {
                            }
                        }
                        if (cell.getColumnIndex() == 22 && cell.getCellType() == CellType.STRING) {
                            produto.setObs(cell.getStringCellValue());
                        }
                        if (cell.getColumnIndex() == 23 && cell.getCellType() == CellType.STRING) {
                            try {
                                Timestamp ts = new java.sql.Timestamp(new SimpleDateFormat("dd/MM/yyyy").parse(cell.getStringCellValue()).getTime());
                                produto.setDataCadastro(ts);
                            } catch (Exception e) {
                            }
                        }
                        if (cell.getColumnIndex() == 24 && cell.getCellType() == CellType.STRING) {
                            try {
                                Timestamp ts = new java.sql.Timestamp(new SimpleDateFormat("dd/MM/yyyy").parse(cell.getStringCellValue()).getTime());
                                produto.setDataValidade(ts);
                            } catch (Exception e) {
                            }
                        }
                        if (cell.getColumnIndex() == 25 && cell.getCellType() == CellType.STRING) {
                            if (cell.getStringCellValue().trim().contains("Falso")) {
                                produto.setGrade(false);
                            } else if (cell.getStringCellValue().trim().contains("Verdadeiro")) {
                                produto.setGrade(true);
                            }
                        }
                        if (cell.getColumnIndex() == 26 && cell.getCellType() == CellType.STRING) {
                            if (cell.getStringCellValue().trim().contains("Falso")) {
                                produto.setSel(false);
                            } else if (cell.getStringCellValue().trim().contains("Verdadeiro")) {
                                produto.setSel(true);
                            }
                        }
                        if (cell.getColumnIndex() == 27 && cell.getCellType() == CellType.STRING) {
                            if (cell.getStringCellValue().trim().contains("Falso")) {
                                produto.setVerificactrlest(false);
                            } else if (cell.getStringCellValue().trim().contains("Verdadeiro")) {
                                produto.setVerificactrlest(true);
                            }
                        }
                        if (cell.getColumnIndex() == 28 && cell.getCellType() == CellType.STRING) {
                            try {
                                Timestamp ts = new java.sql.Timestamp(new SimpleDateFormat("dd/MM/yyyy").parse(cell.getStringCellValue()).getTime());
                                produto.setAtualizadoEm(ts);
                            } catch (Exception e) {
                            }
                        }
                        if (cell.getColumnIndex() == 29 && cell.getCellType() == CellType.STRING) {
                            if (cell.getStringCellValue().trim().contains("Falso")) {
                                produto.setTblPrecos(false);
                            } else if (cell.getStringCellValue().trim().contains("Verdadeiro")) {
                                produto.setTblPrecos(true);
                            }
                        }
                    }
                }
                LeitorTabela.lista.add(produto);
            }
        } catch (IOException ex) {
        }
    }
}
