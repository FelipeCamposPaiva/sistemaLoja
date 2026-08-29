import CrudService from "../CrudService";

class ClienteService extends CrudService {

    constructor() {

        super("/clientes");

    }

}

export default new ClienteService();