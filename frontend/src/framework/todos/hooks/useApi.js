import { useCallback } from "react";
import api from "../services/api";

export default function useApi() {

    const get = useCallback(async (url, config = {}) => {
        try {

            const response = await api.get(
                url,
                config
            );

            return response.data;

        } catch (error) {

            console.error(
                "GET ERROR:",
                error
            );

            throw error;

        }
    }, []);

    const post = useCallback(async (
        url,
        data = {},
        config = {}
    ) => {

        try {

            const response = await api.post(
                url,
                data,
                config
            );

            return response.data;

        } catch (error) {

            console.error(
                "POST ERROR:",
                error
            );

            throw error;

        }

    }, []);

    const put = useCallback(async (
        url,
        data = {},
        config = {}
    ) => {

        try {

            const response = await api.put(
                url,
                data,
                config
            );

            return response.data;

        } catch (error) {

            console.error(
                "PUT ERROR:",
                error
            );

            throw error;

        }

    }, []);

    const patch = useCallback(async (
        url,
        data = {},
        config = {}
    ) => {

        try {

            const response = await api.patch(
                url,
                data,
                config
            );

            return response.data;

        } catch (error) {

            console.error(
                "PATCH ERROR:",
                error
            );

            throw error;

        }

    }, []);

        const remove = useCallback(async (
        url,
        config = {}
    ) => {

        try {

            const response = await api.delete(
                url,
                config
            );

            return response.data;

        } catch (error) {

            console.error(
                "DELETE ERROR:",
                error
            );

            throw error;

        }

    }, []);

    const upload = useCallback(async (
        url,
        arquivo,
        config = {}
    ) => {

        try {

            const formData = new FormData();

            formData.append(
                "file",
                arquivo
            );

            const response = await api.post(
                url,
                formData,
                {
                    headers: {
                        "Content-Type":
                            "multipart/form-data"
                    },
                    ...config
                }
            );

            return response.data;

        } catch (error) {

            console.error(
                "UPLOAD ERROR:",
                error
            );

            throw error;

        }

    }, []);

    const download = useCallback(async (
        url,
        config = {}
    ) => {

        try {

            const response = await api.get(
                url,
                {
                    responseType: "blob",
                    ...config
                }
            );

            return response.data;

        } catch (error) {

            console.error(
                "DOWNLOAD ERROR:",
                error
            );

            throw error;

        }

    }, []);

    const request = useCallback(async (
        options
    ) => {

        try {

            const response =
                await api(options);

            return response.data;

        } catch (error) {

            console.error(
                "REQUEST ERROR:",
                error
            );

            throw error;

        }

    }, []);

    /*
    |--------------------------------------------------------------------------
    | Return
    |--------------------------------------------------------------------------
    */

    return {

        /*
        |--------------------------------------------------------------------------
        | Métodos HTTP
        |--------------------------------------------------------------------------
        */

        get,

        post,

        put,

        patch,

        remove,

        /*
        |--------------------------------------------------------------------------
        | Arquivos
        |--------------------------------------------------------------------------
        */

        upload,

        download,

        /*
        |--------------------------------------------------------------------------
        | Request Genérico
        |--------------------------------------------------------------------------
        */

        request

    };

}