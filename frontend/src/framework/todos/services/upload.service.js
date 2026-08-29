import BaseService from "./base.service";

class UploadService extends BaseService {

    constructor() {

        super("/upload");

    }

    imagem(file, onUploadProgress) {

        return this.upload(

            file,

            "/imagem",

            onUploadProgress

        );

    }

    documento(file, onUploadProgress) {

        return this.upload(

            file,

            "/documento",

            onUploadProgress

        );

    }

    xml(file, onUploadProgress) {

        return this.upload(

            file,

            "/xml",

            onUploadProgress

        );

    }

    planilha(file, onUploadProgress) {

        return this.upload(

            file,

            "/planilha",

            onUploadProgress

        );

    }

}

export default new UploadService();