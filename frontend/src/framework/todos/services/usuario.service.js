import BaseService from "./base.service";

class UsuarioService extends BaseService {

    constructor() {

        super("/usuarios");

    }

    alterarSenha(id, senha) {

        return this.patch(

            `/${id}/senha`,

            {

                senha

            }

        );

    }

    bloquear(id) {

        return this.patch(

            `/${id}/bloquear`

        );

    }

    desbloquear(id) {

        return this.patch(

            `/${id}/desbloquear`

        );

    }

}

export default new UsuarioService();