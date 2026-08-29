import { Link } from "react-router-dom";

import { menus } from "../../constants/menu";

export default function SubSidebar({
  menuAtual
}) {

  const submenu =
    menus[menuAtual] || [];

  return (

    <aside className="sub-sidebar">

      <div className="submenu-titulo">
        {menuAtual}
      </div>

      {submenu.map((item) => (

        <Link
          key={item.rota}
          to={item.rota}
          className="submenu-item"
        >
          {item.nome}
        </Link>

      ))}

    </aside>

  );
}