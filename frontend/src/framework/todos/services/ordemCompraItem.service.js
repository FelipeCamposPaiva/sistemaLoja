import BaseService from "./base.service";

class OrdemCompraItemService extends BaseService {

    constructor() {

        super("/ordens-compra-itens");

    }

    porOrdem(ordemId) {

        return this.get(

            `/ordem/${ordemId}`

        );

    }

}

export default new OrdemCompraItemService();