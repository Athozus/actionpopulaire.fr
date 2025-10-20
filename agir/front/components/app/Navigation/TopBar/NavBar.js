import React, { Suspense } from "react";
import styled from "styled-components";

import { lazy } from "@agir/front/app/utils";
import { useResponsiveMemo } from "@agir/front/genericComponents/grid";
import { useSelector } from "@agir/front/globalContext/GlobalContext";
import { getAdminLink } from "@agir/front/globalContext/reducers";

import AdminLink from "./AdminLink";

const MobileNavBar = lazy(() => import("./MobileNavBar/MobileNavBar"));
const DesktopNavBar = lazy(() => import("./DesktopNavBar/DesktopNavBar"));

const StyledNav = styled.div`
  position: relative;
  width: 100%;
  height: var(--top-bar-height);
  box-shadow: ${(props) => props.theme.elaborateShadow};

  & > * {
    margin: 0 auto;
  }
`;

const NavBar = (props) => {
  const adminLink = useSelector(getAdminLink);
  const NavBar = useResponsiveMemo(MobileNavBar, DesktopNavBar);
  return (
    <StyledNav>
      <Suspense fallback={null}>
        <AdminLink link={adminLink} />
        <NavBar {...props} />
      </Suspense>
    </StyledNav>
  );
};

export default NavBar;
