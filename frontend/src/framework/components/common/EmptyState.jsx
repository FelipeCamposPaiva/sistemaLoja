export default function EmptyState({

    titulo = "Nenhum registro encontrado",

    descricao = "Não existem informações para exibir.",

    children

}) {

    return (

        <div

            style={{

                padding: 40,

                textAlign: "center",

                color: "#6b7280"

            }}

        >

            <h2>{titulo}</h2>

            <p>{descricao}</p>

            {children}

        </div>

    );

}