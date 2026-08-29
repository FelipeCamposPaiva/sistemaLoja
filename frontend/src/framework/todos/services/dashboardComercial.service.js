import BaseService from "./base.service";

class DashboardComercialService extends BaseService {

    constructor() {

        super("/dashboard/comercial");

    }

    vendas() {

        return this.get("/vendas");

    }

    vendedores() {

        return this.get("/vendedores");

    }

    clientes() {

        return this.get("/clientes");

    }

    ticketMedio() {

        return this.get("/ticket-medio");

    }

    conversao() {

        return this.get("/conversao");

    }

}

export default new DashboardComercialService();