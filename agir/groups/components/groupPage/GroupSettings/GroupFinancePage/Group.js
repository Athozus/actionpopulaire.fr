import PropTypes from "prop-types";
import React from "react";
import styled from "styled-components";
import useSWR from "swr";

import Button from "@agir/front/genericComponents/Button";
import PageFadeIn from "@agir/front/genericComponents/PageFadeIn";
import ShareLink from "@agir/front/genericComponents/ShareLink";
import Spacer from "@agir/front/genericComponents/Spacer";
import HeaderPanel from "@agir/front/genericComponents/ObjectManagement/HeaderPanel";
import SpendingRequests from "../SpendingRequests";
import { Row } from "@agir/front/genericComponents/grid";
import { StyledTitle } from "@agir/front/genericComponents/ObjectManagement/styledComponents";

import { getGroupEndpoint } from "@agir/groups/utils/api";
import { useGroup } from "@agir/groups/groupPage/hooks/group.js";
import { formatCurrencyAmount } from "@agir/front/currency/utils.currency";

const DonationSkeleton = styled.p`
  height: 36px;
  margin-bottom: 10px;
  width: 50%;
  background-color: ${(props) => props.theme.text50};
`;

const StyledButtons = styled.p`
  display: flex;
  flex-flow: row wrap;
  gap: 0.5rem;
`;

export const Box = styled.div`
  box-shadow:
    0 0 1px 0 ${(props) => props.theme.background200},
    0px 1px 1px 0px ${(props) => props.theme.background200};
  border-radius: ${(props) => props.theme.borderRadius};
  padding: 0.8rem;
`;

const GroupFinancePage = (props) => {
  const { onBack, illustration, groupPk } = props;

  const group = useGroup(groupPk);
  const { data } = useSWR(getGroupEndpoint("getFinance", { groupPk }));

  return (
    <>
      <HeaderPanel onBack={onBack} illustration={illustration} />

      <PageFadeIn ready={!!data} wait={<DonationSkeleton />}>
        <Box>
          <StyledTitle style={{ fontSize: "1.25rem" }}>
            Budget alloué à mon groupe
          </StyledTitle>
          <Row gutter={0} justify="space-between">
            <p style={{ fontWeight: "500", fontSize: "2.2rem", margin: 0 }}>
              {data && formatCurrencyAmount(data.allocation)}
            </p>
            <Button
              link
              route="groupFinanceHistory"
              routeParams={{ groupPk: groupPk ?? "" }}
              icon="arrow-right"
            >
              Voir le détail du budget
            </Button>
          </Row>
        </Box>
        <Spacer size=".5rem" />
        {data && data.allocation === 0 && (
          <p
            css={`
              color: ${(props) => props.theme.text700};
            `}
          >
            Personne n'a encore alloué de dons à vos actions.
          </p>
        )}
      </PageFadeIn>
      <p
        css={`
          color: ${(props) => props.theme.text700};
        `}
      >
        Vous pouvez allouer des dons à vos actions de manière ponctuelle ou avec
        une contribution financière sur l'année.
      </p>
      <StyledButtons>
        <Button
          link
          route="contributions"
          params={group?.id ? { group: group.id } : undefined}
          color="secondary"
        >
          Devenir financeur·euse
        </Button>
        <Button
          link
          route="donations"
          params={group?.id ? { group: group.id } : undefined}
          color="secondary"
        >
          Allouer un don
        </Button>
      </StyledButtons>

      <Spacer size="2rem" />

      <StyledTitle style={{ fontSize: "1.25rem" }}>
        Solliciter des dons pour mon groupe
      </StyledTitle>

      <p
        css={`
          color: ${(props) => props.theme.text700};
        `}
      >
        Partagez ce lien pour solliciter des dons pour votre groupe&nbsp;:
      </p>

      <ShareLink
        color="primary"
        label="Copier le lien"
        url={group?.routes?.donations}
        $wrap={400}
      />

      <PageFadeIn ready={!!data}>
        <Spacer size="3rem" />
        <StyledTitle style={{ fontSize: "1.25rem" }}>
          Demandes de dépense
        </StyledTitle>
        <p
          css={`
            color: ${(props) => props.theme.text700};
          `}
        >
          Vous pouvez créer une demande de remboursement ou de paiement à tout
          moment et en enregistrer le brouillon.
        </p>
        <p
          css={`
            color: ${(props) => props.theme.text700};
          `}
        >
          Si la demande est complète et l'allocation de votre groupe suffisante,
          vous pourrez la transmettre pour vérification à un·e autre
          animateur·ice ou gestionnaire de votre groupe, et ensuite la faire
          valider par l'équipe de suivi des questions financières.
        </p>
        <Spacer size=".5rem" />
        <SpendingRequests
          spendingRequests={data?.spendingRequests}
          groupPk={group?.id}
        />
      </PageFadeIn>
    </>
  );
};
GroupFinancePage.propTypes = {
  onBack: PropTypes.func,
  illustration: PropTypes.string,
  groupPk: PropTypes.string,
};
export default GroupFinancePage;
