import "../../styles/layout/content.css";

export default function Content({

    children

}) {

    return (

        <main className="erp-content">

            <div className="erp-content-wrapper">

                {children}

            </div>

        </main>

    );

}