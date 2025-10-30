import React from "react";

import { useSelector } from "@agir/front/globalContext/GlobalContext";
import { getRoutes } from "@agir/front/globalContext/reducers";

import ConnectedFloatButton from "@agir/front/allPages/FloatButton";

function HelpButton() {
  const routes = useSelector(getRoutes);
  const href = routes && routes.help;

  return (
    <ConnectedFloatButton
      icon="fa-regular fa-circle-question"
      label="Aide"
      href={href}
      content={<strong>Besoin d'aide ?</strong>}
    />
  );
}

export default HelpButton;
