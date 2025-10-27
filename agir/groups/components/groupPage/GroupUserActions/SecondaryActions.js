import PropTypes from "prop-types";
import React, { useState, useCallback } from "react";
import styled from "styled-components";

import Link from "@agir/front/app/Link";
import { RawFeatherIcon } from "@agir/front/genericComponents/FeatherIcon";

import ModalConfirmation from "@agir/front/genericComponents/ModalConfirmation";
import ShareContentUrl from "@agir/front/genericComponents/ShareContentUrl";

import ContactButton from "./ContactButton";

const StyledLink = styled(Link)``;
const StyledContainer = styled.div`
  margin-top: 1rem;
  display: flex;
  gap: 0.75rem;
  justify-content: center;
  width: 100%;

  button,
  ${StyledLink} {
    cursor: pointer;
    display: flex;
    justify-content: space-between;
    flex-direction: column;
    flex: 0 1 auto;
    min-width: 1px;
    padding: 0.75rem;
    background-color: transparent;
    color: ${(props) => props.theme.text1000};
    border: none;
    text-align: center;
    font-size: 0.875rem;
    font-weight: 500;

    &:hover,
    &:focus {
      color: ${(props) => props.theme.linkHoverColor};
    }

    & > span:hover {
      text-decoration: underline;
    }

    & > span {
      display: block;
      white-space: nowrap;
      text-overflow: ellipsis;
      overflow: hidden;
    }
  }
`;

const SecondaryActions = ({
  id,
  contact,
  isCertified,
  isMessagingEnabled,
  routes,
  referents,
}) => {
  const [isShareOpen, setIsShareOpen] = useState(false);

  const handleShareClose = useCallback(() => setIsShareOpen(false), []);
  const handleShareOpen = useCallback(() => setIsShareOpen(true), []);

  return (
    <StyledContainer>
      {Array.isArray(referents) && referents.length > 0 && (
        <ContactButton
          id={id}
          contact={contact}
          isMessagingEnabled={isMessagingEnabled}
          autoOpefeather-uploan
        />
      )}
      {isCertified && (
        <StyledLink route="contributions" params={{ group: id }}>
          <i
            className="fa-regular fa-circle-euro"
            style={{ fontSize: "1.8em", fontWeight: 400 }}
          />
          <span>Financer</span>
        </StyledLink>
      )}
      <button type="button" onClick={handleShareOpen}>
        <RawFeatherIcon name="share-2" width="1.5rem" height="1.5rem" />
        <span>Partager</span>
      </button>
      <ModalConfirmation
        shouldShow={isShareOpen}
        onClose={handleShareClose}
        title="Partager le groupe"
      >
        <ShareContentUrl url={routes.details} />
      </ModalConfirmation>
    </StyledContainer>
  );
};

SecondaryActions.propTypes = {
  id: PropTypes.string.isRequired,
  isCertified: PropTypes.bool,
  isMessagingEnabled: PropTypes.bool,
  routes: PropTypes.object,
  contact: PropTypes.object,
  referents: PropTypes.array,
};

export default SecondaryActions;
