import BaseService from "./base.service";

class OSConsumoService extends BaseService {

    constructor() {

        super("/os-consumos");

    }

    porOS(osId) {

        return this.get(

            `/os/${osId}`

        );

    }

    adicionar(osId, dados) {

        return this.post(

            `/os/${osId}`,

            dados

        );

    }

    remover(id) {

        return this.delete(

            `/${id}`

        );

    }

}

export default new OSConsumoService();