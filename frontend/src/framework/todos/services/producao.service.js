import BaseService from "./base.service";

class ProducaoService extends BaseService {

    constructor() {

        super("/producao");

    }

    kanban() {

        return this.get("/kanban");

    }

    fila() {

        return this.get("/fila");

    }

    painel() {

        return this.get("/painel");

    }

    atrasadas() {

        return this.get("/atrasadas");

    }

    prioridade() {

        return this.get("/prioridade");

    }

    iniciar(id) {

        return this.patch(

            `/${id}/iniciar`

        );

    }

    pausar(id) {

        return this.patch(

            `/${id}/pausar`

        );

    }

    finalizar(id) {

        return this.patch(

            `/${id}/finalizar`

        );

    }

    operador(usuarioId) {

        return this.get(

            `/operador/${usuarioId}`

        );

    }

}

export default new ProducaoService();