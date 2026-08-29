const REGEX_PIX = {

    email:

        /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/,

    telefone:

        /^\+?55\d{10,11}$/,

    cpf:

        /^\d{11}$/,

    cnpj:

        /^\d{14}$/,

    aleatoria:

        /^[A-Za-z0-9]{32,36}$/

};

export default REGEX_PIX;