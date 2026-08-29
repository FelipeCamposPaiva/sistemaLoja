import BaseService from "./base.service";

class DashboardFinanceiroService extends BaseService {

    constructor() {

        super("/dashboard/financeiro");

    }

    resumo() {

        return this.get("/resumo");

    }

    fluxoCaixa() {

        return this.get("/fluxo-caixa");

    }

    contasReceber() {

        return this.get("/contas-receber");

    }

    contasPagar() {

        return this.get("/contas-pagar");

    }

    inadimplencia() {

        return this.get("/inadimplencia");

    }

    dre() {

        return this.get("/dre");

    }

}

export default new DashboardFinanceiroService();