import BaseService from "./base.service";

class AgendaService extends BaseService {

    constructor() {

        super("/agenda");

    }

    hoje() {

        return this.get("/hoje");

    }

    semana() {

        return this.get("/semana");

    }

    mes() {

        return this.get("/mes");

    }

    porData(data) {

        return this.get(

            "/data",

            {

                params: {

                    data

                }

            }

        );

    }

    confirmar(id) {

        return this.patch(

            `/${id}/confirmar`

        );

    }

    cancelar(id) {

        return this.patch(

            `/${id}/cancelar`

        );

    }

}

export default new AgendaService();