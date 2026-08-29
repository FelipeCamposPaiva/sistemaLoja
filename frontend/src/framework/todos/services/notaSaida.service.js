import BaseService from "./base.service";

class NotaSaidaService extends BaseService {

    constructor() {

        super("/notas-saida");

    }

    emitir(id) {

        return this.post(

            `/${id}/emitir`

        );

    }

    cancelar(id) {

        return this.patch(

            `/${id}/cancelar`

        );

    }

}

export default new NotaSaidaService();