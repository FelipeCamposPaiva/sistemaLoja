import BaseService from "./base.service";

class DashboardVendasService extends BaseService {

    constructor() {

        super("/dashboard/vendas");

    }

    resumo() {

        return this.get("/resumo");

    }

    faturamento() {

        return this.get("/faturamento");

    }

    pedidos() {

        return this.get("/pedidos");

    }

    produtosMaisVendidos() {

        return this.get("/produtos-mais-vendidos");

    }

    vendedores() {

        return this.get("/vendedores");

    }

    metas() {

        return this.get("/metas");

    }

}

export default new DashboardVendasService();