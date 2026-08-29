import BaseService from "./base.service";

class CaixaService extends BaseService {

    constructor() {

        super("/caixa");

    }

    abrir(dados) {

        return this.post(

            "/abrir",

            dados

        );

    }

    fechar(dados) {

        return this.post(

            "/fechar",

            dados

        );

    }

    sangria(dados) {

        return this.post(

            "/sangria",

            dados

        );

    }

    suprimento(dados) {

        return this.post(

            "/suprimento",

            dados

        );

    }

    movimento(id) {

        return this.get(

            `/${id}/movimentos`

        );

    }

    resumo(id) {

        return this.get(

            `/${id}/resumo`

        );

    }

}

export default new CaixaService();