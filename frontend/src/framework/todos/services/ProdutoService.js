import CrudService from "../CrudService";

class ProdutoService extends CrudService {

    constructor() {

        super("/produtos");

    }

}

export default new ProdutoService();