import {
    useCallback,
    useState
} from "react";

import api from "../services/api";

/*
|--------------------------------------------------------------------------
| useUpload
|--------------------------------------------------------------------------
|
| Upload de Arquivos
|
| Recursos
| ✔ Upload
| ✔ Múltiplos Arquivos
| ✔ Progresso
| ✔ Cancelamento
|
*/

export default function useUpload() {

    const [

        loading,

        setLoading

    ] = useState(false);

    const [

        progress,

        setProgress

    ] = useState(0);

    const upload = useCallback(async (

        file,

        endpoint = "/upload",

        config = {}

    ) => {

        const form = new FormData();

        form.append(

            "file",

            file

        );

        setLoading(true);

        setProgress(0);

        try {

            const response = await api.post(

                endpoint,

                form,

                {

                    headers: {

                        "Content-Type":

                            "multipart/form-data"

                    },

                    onUploadProgress(event) {

                        const percent = Math.round(

                            (

                                event.loaded * 100

                            ) /

                            event.total

                        );

                        setProgress(percent);

                    },

                    ...config

                }

            );

            return response.data;

        }

        finally {

            setLoading(false);

        }

    }, []);

    const uploadMultiple = useCallback(async (

        files,

        endpoint = "/upload"

    ) => {

        const form = new FormData();

        [...files].forEach(file =>

            form.append(

                "files",

                file

            )

        );

        setLoading(true);

        setProgress(0);

        try {

            const response = await api.post(

                endpoint,

                form,

                {

                    headers: {

                        "Content-Type":

                            "multipart/form-data"

                    },

                    onUploadProgress(event) {

                        const percent = Math.round(

                            (

                                event.loaded * 100

                            ) /

                            event.total

                        );

                        setProgress(percent);

                    }

                }

            );

            return response.data;

        }

        finally {

            setLoading(false);

        }

    }, []);

    const reset = useCallback(() => {

        setProgress(0);

        setLoading(false);

    }, []);

    return {

        loading,

        progress,

        upload,

        uploadMultiple,

        reset

    };

}