package com.lojas.modelo;

import javax.persistence.Column;
import javax.persistence.Entity;
import javax.persistence.Id;
import java.io.Serializable;
import lombok.Getter;
import lombok.Setter;
import lombok.extern.log4j.Log4j2;

@Entity
@Log4j2
@Setter
@Getter
public class ItemVenda implements Serializable {
    @Column(name = "id")
    @Id
    private Long id;

    @Column(name = "empresas_id")
    private Long empresasId;

    @Column(name = "vendas_id")
    private Long vendasId;

    @Column(name = "produtos_id")
    private Long produtosId;

    @Column(name = "usuarios_id")
    private Long usuariosId;

    @Column(name = "quantidade")
    private String quantidade;

    @Column(name = "valor_compra")
    private double valorCompra;

    @Column(name = "valor_venda")
    private double valorVenda;

    @Column(name = "valor_pago")
    private double valorPago;

    @Column(name = "valor_comissao")
    private boolean valorComissao;

    @Column(name = "devolvido")
    private String devolvido;

    @Column(name = "descricao")
    private String descricao;

    @Column(name = "produtos_nome")
    private String produtosNome;

    @Column(name = "unidade")
    private String unidade;

    @Column(name = "estoque_atual")
    private String estoqueAtual;

    @Column(name = "is_composto")
    private boolean isComposto;

    @Column(name = "pai_nome")
    private String paiNome;

    @Column(name = "codigo_barras")
    private String codigoBarras;

    @Column(name = "imagem")
    private String imagem;

    @Column(name = "valor_desconto")
    private double valorDesconto;

}