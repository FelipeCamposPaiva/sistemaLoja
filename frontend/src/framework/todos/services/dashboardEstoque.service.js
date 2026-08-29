import BaseService from "./base.service";

class DashboardEstoqueService extends BaseService {

    constructor() {

        super("/dashboard/estoque");

    }

    resumo() {

        return this.get("/resumo");

    }

    estoqueBaixo() {

        return this.get("/estoque-baixo");

    }

    semEstoque() {

        return this.get("/sem-estoque");

    }

    giro() {

        return this.get("/giro");

    }

    inventario() {

        return this.get("/inventario");

    }

}

export default new DashboardEstoqueService();