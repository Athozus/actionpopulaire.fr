import PropTypes from "prop-types";
import React, { useMemo } from "react";
import styled from "styled-components";

import Button from "@agir/front/genericComponents/Button";
import { RawFeatherIcon } from "@agir/front/genericComponents/FeatherIcon";
import Link from "@agir/front/app/Link";
import { routeConfig } from "@agir/front/app/routes.config";
import getRoutes, {
  groupGroupRoutes,
} from "@agir/groups/groupPage/GroupSettings/routes.config";
import Icon from "@agir/front/genericComponents/Icon";

const StyledPanel = styled.div`
  width: 100%;
  background-color: ${(props) => props.theme.primary100};
  padding: 1.5rem;
  margin: 0;

  @media (max-width: ${(props) => props.theme.collapse}px) {
    display: none;
  }

  h6 {
    margin: 0;
    font-size: 1rem;
    line-height: 1;
    color: ${(props) => props.theme.primary500};
    margin-bottom: 1rem;
    font-weight: bold;
  }

  && ul {
    list-style: none;
    padding: 0;
    margin: 0 0 0 0.7em;

    hr {
      margin-top: 0.5em;
      margin-bottom: 0.5em;
      border-color: ${(props) => props.theme.background700};
    }

    li {
      font-size: 0.813rem;
      line-height: 1.3;
      display: flex;
      align-items: baseline;

      a {
        color: ${(props) => props.theme.text1000};
        margin-left: 0.5rem;
      }
    }

    li + li {
      margin-top: 0.5rem;
    }

    li {
      align-items: center;
      font-weight: normal;
      font-size: 0.875rem;

      i,
      svg {
        color: ${(props) => props.theme.primary500};
      }

      a {
        margin-left: 0.5rem;
      }

      ${RawFeatherIcon} {
        svg {
          stroke-width: 2px;
          width: 1rem;
          height: 1rem;
        }
      }
    }
  }

  ${Button} + ul {
    margin-top: 1rem;
  }

  & ~ ${Button} {
    @media (min-width: ${(props) => props.theme.collapse}px) {
      display: none;
    }
  }
`;

const StyledWrapper = styled.div`
  display: flex;
  flex-flow: column nowrap;
  gap: 0.5rem;
  position: relative;
`;

const ManagerActions = (props) => {
  const { id, groupSettingsLinks, isBoucleDepartementale } = props;

  const basePath = routeConfig.groupDetails.getLink({ groupPk: id });
  const routes = getRoutes(basePath, props);

  const groupedItems = useMemo(() => groupGroupRoutes(routes), [routes]);

  return (
    <StyledWrapper>
      <StyledPanel>
        <h6>Gestion du groupe</h6>
        <Button
          link
          route="createEvent"
          params={{ group: id }}
          color="primary"
          icon="plus"
          small
        >
          Créer un événement du groupe
        </Button>
        <ul>
          {groupedItems.map((groupRoutes, index) => {
            return (
              <>
                {index > 0 && <hr />}
                {groupRoutes.map((subRoute) => {
                  return (
                    <li key={subRoute.id}>
                      <Icon name={subRoute.icon} />
                      <Link to={subRoute.path}>{subRoute.label}</Link>
                    </li>
                  );
                })}
              </>
            );
          })}
        </ul>
      </StyledPanel>
      <Button link route="createEvent" color="primary" icon="plus" small>
        Créer un événement du groupe
      </Button>
      <Button link to={groupSettingsLinks?.menu} icon="settings" small>
        Gestion du groupe
      </Button>
    </StyledWrapper>
  );
};

ManagerActions.propTypes = {
  id: PropTypes.string.isRequired,
  routes: PropTypes.object,
  groupSettingsLinks: PropTypes.object,
  isBoucleDepartementale: PropTypes.bool,
};
export default ManagerActions;
