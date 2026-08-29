import BaseService from "./base.service";

class ContaPagarService extends BaseService {

    constructor() {

        super("/contas-pagar");

    }

    pagar(id, dados) {

        return this.post(

            `/${id}/pagar`,

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

    pagarHoje() {

        return this.get(

            "/hoje"

        );

    }

    porFornecedor(fornecedorId) {

        return this.get(

            "/fornecedor/" + fornecedorId

        );

    }

}

export default new ContaPagarService();