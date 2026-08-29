import BaseService from "./base.service";

class DashboardProducaoService extends BaseService {

    constructor() {

        super("/dashboard/producao");

    }

    resumo() {

        return this.get("/resumo");

    }

    kanban() {

        return this.get("/kanban");

    }

    fila() {

        return this.get("/fila");

    }

    atrasadas() {

        return this.get("/atrasadas");

    }

    produtividade() {

        return this.get("/produtividade");

    }

}

export default new DashboardProducaoService();