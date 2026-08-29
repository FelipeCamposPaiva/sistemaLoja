import BaseService from "./base.service";

class ConfiguracaoService extends BaseService {

    constructor() {

        super("/configuracoes");

    }

    geral() {

        return this.get("/geral");

    }

    salvarGeral(dados) {

        return this.put(

            "/geral",

            dados

        );

    }

    tema() {

        return this.get("/tema");

    }

    salvarTema(dados) {

        return this.put(

            "/tema",

            dados

        );

    }

}

export default new ConfiguracaoService();