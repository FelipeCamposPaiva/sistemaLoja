export default function DataGridSearch({

    value,

    onChange

}) {

    return (

        <input

            type="text"

            placeholder="Pesquisar..."

            value={value}

            onChange={e=>onChange(e.target.value)}

        />

    );

}