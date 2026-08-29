import CrudService from "../CrudService";

class OrdemServicoService extends CrudService {

    constructor() {

        super("/ordens-servico");

    }

    alterarStatus(id, status) {

        return this.patch(`/${id}/status`, {

            status

        });

    }

}

export default new OrdemServicoService();