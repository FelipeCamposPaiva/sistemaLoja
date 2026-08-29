import BaseService from "./base.service";

class PermissaoService extends BaseService {

    constructor() {

        super("/permissoes");

    }

    roles() {

        return this.get("/roles");

    }

    modulos() {

        return this.get("/modulos");

    }

}

export default new PermissaoService();