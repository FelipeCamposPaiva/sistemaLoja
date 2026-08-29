import BaseService from "./base.service";

class FornecedorService extends BaseService {

    constructor() {

        super("/fornecedores");

    }

    ativos() {

        return this.get("/ativos");

    }

    pesquisar(texto) {

        return this.get("/pesquisar", {

            params: {

                q: texto

            }

        });

    }

}

export default new FornecedorService();