import BaseService from "./base.service";

class InventarioService extends BaseService {

    constructor() {

        super("/inventarios");

    }

    iniciar() {

        return this.post("/iniciar");

    }

    finalizar(id) {

        return this.post(

            `/${id}/finalizar`

        );

    }

    contar(id, dados) {

        return this.post(

            `/${id}/contagem`,

            dados

        );

    }

    divergencias(id) {

        return this.get(

            `/${id}/divergencias`

        );

    }

}

export default new InventarioService();