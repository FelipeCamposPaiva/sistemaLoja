import BaseService from "./base.service";

class NotaEntradaItemService extends BaseService {

    constructor() {

        super("/notas-entrada-itens");

    }

    porNota(notaId) {

        return this.get(

            `/nota/${notaId}`

        );

    }

}

export default new NotaEntradaItemService();