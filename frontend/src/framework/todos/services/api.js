import axios from "axios";
import auth from "../core/auth/auth";

/*
|--------------------------------------------------------------------------
| Configuração
|--------------------------------------------------------------------------
*/

const API_URL =
    import.meta.env.VITE_API_URL ||
    (import.meta.env.DEV ? "/api" : "http://localhost:8080/api");

const api = axios.create({

    baseURL: API_URL,

    timeout: 30000,

    withCredentials: true,

    headers: {

        Accept: "application/json",

        "Content-Type": "application/json",

        "X-Requested-With": "XMLHttpRequest"

    }

});

/*
|--------------------------------------------------------------------------
| Request Interceptor
|--------------------------------------------------------------------------
*/

api.interceptors.request.use(

    config => {

        const token = auth.getToken();

        if (token) {

            config.headers.Authorization =
                `Bearer ${token}`;

        }

        return config;

    },

    error => Promise.reject(error)

);

/*
|--------------------------------------------------------------------------
| Response Interceptor
|--------------------------------------------------------------------------
*/

api.interceptors.response.use(

    response => response,

    async error => {

        const originalRequest =
            error.config;

        const response =
            error.response;

        /*
        ------------------------------------------------------------
        Sem resposta do servidor
        ------------------------------------------------------------
        */

        if (!response) {

            return Promise.reject(error);

        }

        /*
        ------------------------------------------------------------
        Continua Parte 2
        ------------------------------------------------------------
        */

                /*
        ------------------------------------------------------------
        | Token expirado
        ------------------------------------------------------------
        */

        if (

            response.status === 401 &&

            !originalRequest._retry

        ) {

            originalRequest._retry = true;

            try {

                const refreshToken =

                    auth.getRefreshToken();

                if (!refreshToken) {

                    auth.logout();

                    return Promise.reject(error);

                }

                const refreshResponse =

                    await axios.post(

                        `${API_URL}/auth/refresh`,

                        {

                            refreshToken

                        },

                        {

                            withCredentials: true

                        }

                    );

                const dados =

                    refreshResponse.data;

                auth.salvarToken(

                    dados.token

                );

                if (

                    dados.refreshToken

                ) {

                    auth.salvarRefreshToken(

                        dados.refreshToken

                    );

                }

                originalRequest.headers.Authorization =

                    `Bearer ${dados.token}`;

                api.defaults.headers.common.Authorization =

                    `Bearer ${dados.token}`;

                return api(

                    originalRequest

                );

            }

            catch (refreshError) {

                auth.logout();

                return Promise.reject(

                    refreshError

                );

            }

        }

        /*
        ------------------------------------------------------------
        | Erros conhecidos
        ------------------------------------------------------------
        */

        switch (

            response.status

        ) {

            case 403:

                console.warn(

                    "Acesso negado."

                );

                break;

            case 404:

                console.warn(

                    "Recurso não encontrado."

                );

                break;

            case 422:

                console.warn(

                    "Erro de validação."

                );

                break;

            default:

                if (

                    response.status >= 500

                ) {

                    console.error(

                        "Erro interno do servidor."

                    );

                }

        }

        return Promise.reject(

            error

        );

    }

);

/*
|--------------------------------------------------------------------------
| Upload
|--------------------------------------------------------------------------
*/

export async function upload(

    endpoint,

    file,

    options = {}

) {

    const formData = new FormData();

    formData.append(

        "file",

        file

    );

    const response = await api.post(

        endpoint,

        formData,

        {

            headers: {

                "Content-Type":

                    "multipart/form-data"

            },

            onUploadProgress: event => {

                if (

                    typeof options.onProgress === "function"

                ) {

                    const percent = Math.round(

                        (event.loaded * 100) /

                        event.total

                    );

                    options.onProgress(percent);

                }

            },

            signal: options.signal,

            ...options.config

        }

    );

    return response.data;

}

/*
|--------------------------------------------------------------------------
| Download
|--------------------------------------------------------------------------
*/

export async function download(

    endpoint,

    options = {}

) {

    const response = await api.get(

        endpoint,

        {

            responseType: "blob",

            signal: options.signal,

            ...options.config

        }

    );

    return response.data;

}

/*
|--------------------------------------------------------------------------
| Retry
|--------------------------------------------------------------------------
*/

export async function retry(

    callback,

    attempts = 3,

    delay = 500

) {

    let lastError;

    for (

        let i = 0;

        i < attempts;

        i++

    ) {

        try {

            return await callback();

        }

        catch (error) {

            lastError = error;

            if (

                i < attempts - 1

            ) {

                await new Promise(

                    resolve =>

                        setTimeout(

                            resolve,

                            delay

                        )

                );

            }

        }

    }

    throw lastError;

}

/*
|--------------------------------------------------------------------------
| Abort Controller
|--------------------------------------------------------------------------
*/

export function createAbortController() {

    return new AbortController();

}

/*
|--------------------------------------------------------------------------
| Timeout
|--------------------------------------------------------------------------
*/

export function setTimeoutApi(

    milliseconds

) {

    api.defaults.timeout = milliseconds;

}

/*
|--------------------------------------------------------------------------
| Authorization
|--------------------------------------------------------------------------
*/

export function setAuthorization(

    token

) {

    api.defaults.headers.common.Authorization =

        `Bearer ${token}`;

}

export function clearAuthorization() {

    delete api.defaults.headers.common.Authorization;

}

/*
|--------------------------------------------------------------------------
| Health Check
|--------------------------------------------------------------------------
*/

export async function health() {

    const response = await api.get(

        "/health"

    );

    return response.data;

}

/*
|--------------------------------------------------------------------------
| Ping
|--------------------------------------------------------------------------
*/

export async function ping() {

    const inicio = performance.now();

    await api.get(

        "/ping"

    );

    return Math.round(

        performance.now() - inicio

    );

}

/*
|--------------------------------------------------------------------------
| Online
|--------------------------------------------------------------------------
*/

export function isOnline() {

    return navigator.onLine;

}

/*
|--------------------------------------------------------------------------
| Broadcast Logout
|--------------------------------------------------------------------------
*/

const authChannel = new BroadcastChannel(

    "erp-auth"

);

authChannel.onmessage = event => {

    if (

        event.data?.type === "LOGOUT"

    ) {

        auth.logout();

        window.location.href = "/login";

    }

};

export function broadcastLogout() {

    authChannel.postMessage({

        type: "LOGOUT"

    });

}

/*
|--------------------------------------------------------------------------
| HTTP Helpers
|--------------------------------------------------------------------------
*/

export const get = (

    url,

    config = {}

) =>

    api.get(

        url,

        config

    );

export const post = (

    url,

    data = {},

    config = {}

) =>

    api.post(

        url,

        data,

        config

    );

export const put = (

    url,

    data = {},

    config = {}

) =>

    api.put(

        url,

        data,

        config

    );

export const patch = (

    url,

    data = {},

    config = {}

) =>

    api.patch(

        url,

        data,

        config

    );

export const remove = (

    url,

    config = {}

) =>

    api.delete(

        url,

        config

    );

/*
|--------------------------------------------------------------------------
| Exportações
|--------------------------------------------------------------------------
*/

export {

    api

};

export default api;