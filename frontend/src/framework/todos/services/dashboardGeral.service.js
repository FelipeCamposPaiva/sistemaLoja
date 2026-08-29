import BaseService from "./base.service";

class DashboardGeralService extends BaseService {

    constructor() {

        super("/dashboard/geral");

    }

    indicadores() {

        return this.get("/indicadores");

    }

    cards() {

        return this.get("/cards");

    }

    faturamento() {

        return this.get("/faturamento");

    }

    metas() {

        return this.get("/metas");

    }

    atividades() {

        return this.get("/atividades");

    }

}

export default new DashboardGeralService();