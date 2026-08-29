import BaseService from "./base.service";

class DashboardService extends BaseService {

    constructor() {

        super("/dashboard");

    }

    geral() {

        return this.get("/geral");

    }

    resumo() {

        return this.get("/resumo");

    }

    indicadores() {

        return this.get("/indicadores");

    }

    cards() {

        return this.get("/cards");

    }

    grafico(periodo = "mes") {

        return this.get("/grafico", {

            params: {

                periodo

            }

        });

    }

}

export default new DashboardService();