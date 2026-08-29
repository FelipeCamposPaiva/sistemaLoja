import BaseService from "./base.service";

class FinanceiroService extends BaseService {

    constructor() {

        super("/financeiro");

    }

    dashboard() {

        return this.get("/dashboard");

    }

    fluxoCaixa(params = {}) {

        return this.get("/fluxo-caixa", {

            params

        });

    }

    resumo(params = {}) {

        return this.get("/resumo", {

            params

        });

    }

    saldoAtual() {

        return this.get("/saldo");

    }

    movimentacoes(params = {}) {

        return this.get("/movimentacoes", {

            params

        });

    }

    fecharCaixa() {

        return this.post("/fechar-caixa");

    }

    reabrirCaixa() {

        return this.post("/reabrir-caixa");

    }

}

export default new FinanceiroService();