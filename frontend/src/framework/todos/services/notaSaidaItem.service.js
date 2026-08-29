import BaseService from "./base.service";

class NotaSaidaItemService extends BaseService {

    constructor() {

        super("/notas-saida-itens");

    }

    porNota(notaId) {

        return this.get(

            `/nota/${notaId}`

        );

    }

}

export default new NotaSaidaItemService();