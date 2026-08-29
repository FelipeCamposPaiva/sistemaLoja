import BaseService from "./base.service";

class BackupService extends BaseService {

    constructor() {

        super("/backup");

    }

    executar() {

        return this.post("/executar");

    }

    restaurar(id) {

        return this.post(

            `/${id}/restaurar`

        );

    }

    download(id) {

        return super.download(

            `/${id}`

        );

    }

}

export default new BackupService();