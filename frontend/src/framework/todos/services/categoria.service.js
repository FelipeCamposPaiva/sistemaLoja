import BaseService from "./base.service";

class CategoriaService extends BaseService {

    constructor() {

        super("/categorias");

    }

    arvore() {

        return this.get("/arvore");

    }

}

export default new CategoriaService();