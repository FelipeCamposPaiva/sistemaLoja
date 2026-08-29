import BaseService from "./base.service";

class OrdemCompraService extends BaseService {

    constructor() {

        super("/ordens-compra");

    }

    aprovar(id) {

        return this.patch(

            `/${id}/aprovar`

        );

    }

    cancelar(id) {

        return this.patch(

            `/${id}/cancelar`

        );

    }

    receber(id) {

        return this.patch(

            `/${id}/receber`

        );

    }

}

export default new OrdemCompraService();