import BaseService from "./base.service";

class NotaEntradaService extends BaseService {

    constructor() {

        super("/notas-entrada");

    }

    importarXML(id) {

        return this.post(

            `/${id}/importar-xml`

        );

    }

    confirmar(id, corpo = { modoData: "ENTRADA" }) {

        return this.put(

            `/${id}/confirmar`,
            corpo

        );

    }

    cancelar(id) {

        return this.patch(

            `/${id}/cancelar`

        );

    }

}

export default new NotaEntradaService();