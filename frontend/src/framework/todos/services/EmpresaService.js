import CrudService from "../CrudService";

class EmpresaService extends CrudService {

    constructor() {

        super("/empresas");

    }

}

export default new EmpresaService();