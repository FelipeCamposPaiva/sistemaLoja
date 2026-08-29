import BaseService from "./base.service";

class MarcaService extends BaseService {

    constructor() {

        super("/marcas");

    }

    ordenar() {

        return this.get("/ordenadas");

    }

}

export default new MarcaService();