import BaseService from "./base.service";

class ContaReceberService extends BaseService {

    constructor() {

        super("/contas-receber");

    }

    receber(id, dados) {

        return this.post(

            `/${id}/receber`,

            dados

        );

    }

    cancelar(id) {

        return this.patch(

            `/${id}/cancelar`

        );

    }

    vencidas() {

        return this.get(

            "/vencidas"

        );

    }

    receberHoje() {

        return this.get(

            "/hoje"

        );

    }

    porCliente(clienteId) {

        return this.get(

            "/cliente/" + clienteId

        );

    }

}

export default new ContaReceberService();