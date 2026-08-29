import {
    useCallback,
    useEffect,
    useRef,
    useState
} from "react";

/*
|--------------------------------------------------------------------------
| useScanner
|--------------------------------------------------------------------------
|
| Hook para leitura de código de barras.
|
| Funciona com:
| ✔ Leitor USB
| ✔ Pistola Zebra
| ✔ Bematech
| ✔ Elgin
| ✔ Honeywell
| ✔ Scanner Bluetooth
|
*/

export default function useScanner({

    enabled = true,

    timeout = 80,

    minLength = 4

} = {}) {

    const [codigo, setCodigo] = useState("");

    const [scanning, setScanning] = useState(false);

    const buffer = useRef("");

    const timer = useRef(null);

    const limpar = useCallback(() => {

        buffer.current = "";

        setScanning(false);

    }, []);

    useEffect(() => {

        if (!enabled) {

            return;

        }

        function onKeyDown(event) {

            if (event.key === "Shift") {

                return;

            }

            if (timer.current) {

                clearTimeout(timer.current);

            }

            setScanning(true);

            if (event.key === "Enter") {

                if (

                    buffer.current.length >= minLength

                ) {

                    setCodigo(

                        buffer.current

                    );

                }

                limpar();

                return;

            }

            buffer.current += event.key;

            timer.current = setTimeout(() => {

                limpar();

            }, timeout);

        }

        window.addEventListener(

            "keydown",

            onKeyDown

        );

        return () =>

            window.removeEventListener(

                "keydown",

                onKeyDown

            );

    }, [

        enabled,

        timeout,

        minLength,

        limpar

    ]);

    return {

        codigo,

        scanning,

        limpar

    };

}