export default function DataGridFilters({

    children

}){

    return(

        <div

            style={{

                display:"flex",

                gap:15,

                marginBottom:20

            }}

        >

            {children}

        </div>

    );

}