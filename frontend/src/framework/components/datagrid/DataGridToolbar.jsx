export default function DataGridToolbar({

    children

}){

    return(

        <div

            style={{

                display:"flex",

                justifyContent:"space-between",

                alignItems:"center",

                marginBottom:20

            }}

        >

            {children}

        </div>

    );

}