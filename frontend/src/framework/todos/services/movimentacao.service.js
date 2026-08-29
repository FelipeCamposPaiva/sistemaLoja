import BaseService from "./base.service";

class MovimentacaoService extends BaseService {

    constructor() {

        super("/movimentacoes");

    }

    entradas() {

        return this.get("/entradas");

    }

    saidas() {

        return this.get("/saidas");

    }

    porProduto(produtoId) {

        return this.get(

            `/produto/${produtoId}`

        );

    }

    periodo(inicio, fim) {

        return this.get("/periodo", {

            params: {

                inicio,

                fim

            }

        });

    }

}

export default new MovimentacaoService();