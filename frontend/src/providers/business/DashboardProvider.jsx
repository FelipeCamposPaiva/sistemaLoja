import {

    DashboardProvider as Provider

}

from "../contexts/DashboardContext";

export default function DashboardProvider({

    children

}) {

    return (

        <Provider>

            {children}

        </Provider>

    );

}