import BaseService from "./base.service";

class EstoqueService extends BaseService {

    constructor() {

        super("/estoque");

    }

    estoqueBaixo() {

        return this.get("/baixo");

    }

    semEstoque() {

        return this.get("/zerado");

    }

    movimentacoes(produtoId) {

        return this.get(

            `/${produtoId}/movimentacoes`

        );

    }

    ajustar(produtoId, dados) {

        return this.post(

            `/${produtoId}/ajustar`,

            dados

        );

    }

    entrada(produtoId, dados) {

        return this.post(

            `/${produtoId}/entrada`,

            dados

        );

    }

    saida(produtoId, dados) {

        return this.post(

            `/${produtoId}/saida`,

            dados

        );

    }

}

export default new EstoqueService();