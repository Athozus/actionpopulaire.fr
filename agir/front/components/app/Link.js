import PropTypes from "prop-types";
import React, { useMemo } from "react";
import { Link as RouterLink } from "react-router-dom";

import { routeConfig } from "@agir/front/app/routes.config";
import { addQueryStringParams } from "@agir/lib/utils/url";
import {useMobileApp, useRoute} from "./hooks";

const ExternalLink = (props) => {
  const { params, forwardedRef, ...rest } = props;
  const href = params ? addQueryStringParams(props.href, params) : props.href;
  return <a ref={forwardedRef} {...rest} href={href} />;
};
ExternalLink.propTypes = {
  href: PropTypes.string.isRequired,
  params: PropTypes.object,
};

const InternalLink = (props) => {
  const { to, params, state, backLink, forwardedRef, ...rest } = props;

  const next = useMemo(() => {
    const url = params
      ? addQueryStringParams(to?.pathname || to, params, true)
      : to?.pathname || to;

    let nextState = { ...state };

    if (backLink) {
      nextState = nextState || {};
      if (typeof backLink !== "string") {
        nextState.backLink = backLink;
      } else if (routeConfig[backLink]) {
        nextState.backLink = { route: backLink };
      } else {
        nextState.backLink = { href: backLink };
      }
    }

    return nextState
      ? {
          pathname: url.split("?")[0],
          search: url.split("?")[1] && "?" + url.split("?")[1],
          state: nextState,
        }
      : url;
  }, [to, params, state, backLink]);

  return <RouterLink ref={forwardedRef} {...rest} to={next} />;
};
InternalLink.propTypes = {
  to: PropTypes.string.isRequired,
  state: PropTypes.object,
  params: PropTypes.object,
  backLink: PropTypes.oneOfType([PropTypes.string, PropTypes.object]),
};

const RouteLink = (props) => {
  const { route, routeParams, ...rest } = props;
  const { url, isInternal } = useRoute(route, routeParams);

  return isInternal ? (
    <InternalLink {...rest} to={url} />
  ) : (
    <ExternalLink {...rest} href={url} />
  );
};
RouteLink.propTypes = {
  route: PropTypes.string.isRequired,
  routeParams: PropTypes.object,
};

const Link = (() => {
  const LinkComponent = (props, ref) => {
    const { route, href, to, download } = props;
    let newHref = href;

    const {isAndroid, isIOS} = useMobileApp();
    if (download) {
      if (isAndroid) {
        newHref = newHref + "#Intent;scheme=https;end"
      } else if (isIOS) {
        newHref = "x-safari-" + newHref
      }
    }

    if (route) {
      return <RouteLink forwardedRef={ref} {...props} href={newHref} />;
    }
    if (to) {
      return <InternalLink forwardedRef={ref} to={to} {...props} href={newHref} />;
    }
    if (href) {
      return <ExternalLink forwardedRef={ref} {...props} href={newHref} />;
    }

    return null;
  };
  LinkComponent.displayName = "Link";

  return React.forwardRef(LinkComponent);
})();

export default Link;
