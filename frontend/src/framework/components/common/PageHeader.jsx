import "../../styles/components/PageHeader/PageHeader.css";

export default function PageHeader({

    titulo,

    subtitulo,

    icon,

    total,

    children

}) {

    return (

        <header className="page-header">

            <div className="page-header-left">

                {

                    icon && (

                        <div className="page-header-icon">

                            {icon}

                        </div>

                    )

                }

                <div>

                    <h1 className="page-header-title">

                        {titulo}

                    </h1>

                    {

                        subtitulo && (

                            <p className="page-header-subtitle">

                                {subtitulo}

                            </p>

                        )

                    }

                </div>

            </div>

            <div className="page-header-right">

                {

                    total !== undefined && (

                        <div className="page-header-total">

                            <span>Total</span>

                            <strong>{total}</strong>

                        </div>

                    )

                }

                {children}

            </div>

        </header>

    );

}