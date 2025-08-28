import PropTypes from "prop-types";
import React, { useMemo } from "react";
import { useLocation } from "react-router-dom";
import styled from "styled-components";

import routes from "@agir/front/app/routes.config";
import { useMobileApp, useDownloadBanner } from "@agir/front/app/hooks";

import DownloadApp from "@agir/front/genericComponents/DownloadApp";
import Spacer from "@agir/front/genericComponents/Spacer";
import NavBar from "./NavBar";

const StyledPageHead = styled.div`
  position: fixed;
  top: var(--safe-area-inset-top, env(safe-area-inset-top));
  left: 0;
  z-index: ${(props) => props.theme.zindexTopBar};
  @media (max-width: ${(props) => props.theme.collapse}px) {
    z-index: 50 !important;
  }
  width: 100%;
  background-color: ${(props) => props.theme.background0};
  isolation: isolate;
`;

export const TopBar = ({ path, hideBannerDownload, ...rest }) => {
  return (
    <StyledPageHead>
      {!hideBannerDownload && <DownloadApp />}
      <NavBar {...rest} path={path} />
    </StyledPageHead>
  );
};

TopBar.propTypes = {
  path: PropTypes.string,
  hideBannerDownload: PropTypes.bool,
};

const RouterTopBar = (props) => {
  const [isBannerDownload] = useDownloadBanner();
  const { pathname } = useLocation();
  const { isMobileApp } = useMobileApp();

  const route = useMemo(
    () => routes.find((route) => route.match(pathname)),
    [pathname],
  );

  const hasTopBar =
    props.hasTopBar ||
    (route && !route.hideTopBar && (!route.appOnlyTopBar || isMobileApp));

  if (!hasTopBar) {
    return null;
  }

  return (
    <>
      <TopBar path={pathname} hasLayout={!!route?.hasLayout} />
      {isBannerDownload && <Spacer size="80px" />}
    </>
  );
};

RouterTopBar.propTypes = {
  hasTopBar: PropTypes.bool,
};

export default RouterTopBar;
