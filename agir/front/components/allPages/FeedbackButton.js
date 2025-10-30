import React from "react";

import { useSelector } from "@agir/front/globalContext/GlobalContext";
import { getRoutes } from "@agir/front/globalContext/reducers";
import { useMobileApp } from "@agir/front/app/hooks";

import background from "./life-ring.svg";
import ConnectedFloatButton from "@agir/front/allPages/FloatButton";

function FeedbackButton() {
  const routes = useSelector(getRoutes);
  const href = routes && routes.feedbackForm;
  const { isMobileApp } = useMobileApp();

  return (
    <ConnectedFloatButton
      background={background}
      href={href}
      content={
        <>
          <strong>Aidez-nous !</strong>
          {isMobileApp ? (
            <span>
              Donnez votre avis sur l'application Action Populaire&nbsp;→
            </span>
          ) : (
            <span>Donnez votre avis sur le site Action Populaire&nbsp;→</span>
          )}
        </>
      }
    />
  );
}

export default FeedbackButton;
