import BaseService from "./base.service";

class ImpressaoService extends BaseService {

    constructor() {

        super("/impressao");

    }

    etiqueta(id) {

        return this.get(

            `/etiqueta/${id}`

        );

    }

    os(id) {

        return this.get(

            `/os/${id}`

        );

    }

    pedido(id) {

        return this.get(

            `/pedido/${id}`

        );

    }

    nota(id) {

        return this.get(

            `/nota/${id}`

        );

    }

}

export default new ImpressaoService();