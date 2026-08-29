import BaseService from "./base.service";

class VendedorService extends BaseService {

    constructor() {

        super("/vendedores");

    }

    ranking() {

        return this.get("/ranking");

    }

    comissoes() {

        return this.get("/comissoes");

    }

}

export default new VendedorService();