package com.lojas.modelo;

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
import java.util.List;
import org.apache.logging.log4j.Logger;

public class LeitorTabela {

    private static final Logger log;
    public static List<CadProdutos> lista;

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
                        if (cell.getColumnIndex() != 20 || cell.getCellType() != CellType.STRING) {
                            continue;
                        }
                        produto.setSetor(cell.getStringCellValue());
                    }
                }
                LeitorTabela.lista.add(produto);
            }
        } catch (IOException ex) {
        }
    }

    static {
        log = LogManager.getLogger((Class) LeitorTabela.class);
        LeitorTabela.lista = new ArrayList<CadProdutos>();
    }
}
