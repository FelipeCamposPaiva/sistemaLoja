import BaseService from "./base.service";

class RelatorioService extends BaseService {

    constructor() {

        super("/relatorios");

    }

    financeiro(params) {

        return this.get(

            "/financeiro",

            {

                params

            }

        );

    }

    estoque(params) {

        return this.get(

            "/estoque",

            {

                params

            }

        );

    }

    vendas(params) {

        return this.get(

            "/vendas",

            {

                params

            }

        );

    }

    producao(params) {

        return this.get(

            "/producao",

            {

                params

            }

        );

    }

}

export default new RelatorioService();