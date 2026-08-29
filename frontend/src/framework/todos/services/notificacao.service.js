import BaseService from "./base.service";

class NotificacaoService extends BaseService {

    constructor() {

        super("/notificacoes");

    }

    naoLidas() {

        return this.get("/nao-lidas");

    }

    marcarComoLida(id) {

        return this.patch(

            `/${id}/lida`

        );

    }

    marcarTodasComoLidas() {

        return this.patch(

            "/lidas"

        );

    }

}

export default new NotificacaoService();