import PropTypes from "prop-types";
import React from "react";
import styled from "styled-components";
import useSWR from "swr";

import Button from "@agir/front/genericComponents/Button";
import PageFadeIn from "@agir/front/genericComponents/PageFadeIn";
import Spacer from "@agir/front/genericComponents/Spacer";
import HeaderPanel from "@agir/front/genericComponents/ObjectManagement/HeaderPanel";
import SpendingRequests from "../SpendingRequests";

import { StyledTitle } from "@agir/front/genericComponents/ObjectManagement/styledComponents";

import { getGroupEndpoint } from "@agir/groups/utils/api";
import { useGroup } from "@agir/groups/groupPage/hooks/group";
import Link from "@agir/front/app/Link";
import { formatCurrencyAmount } from "@agir/front/currency/utils.currency";
import { Row } from "@agir/front/genericComponents/grid";
import { Box } from "./Group";

const DonationSkeleton = styled.p`
  height: 2.25rem;
  margin-bottom: 0.625rem;
  width: 50%;
  background-color: ${(props) => props.theme.text50};
`;

const StyledButtons = styled.p`
  display: flex;
  flex-flow: row wrap;
  gap: 0.5rem;
`;

const BouDepFinancePage = (props) => {
  const { onBack, illustration, groupPk } = props;

  const group = useGroup(groupPk);
  const { data } = useSWR(getGroupEndpoint("getFinance", { groupPk }));

  return (
    <>
      <HeaderPanel onBack={onBack} illustration={illustration} />
      <Box>
        <StyledTitle style={{ fontSize: "1.25rem" }}>
          Montant alloué à la boucle
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
      <Spacer size="1rem" />
      <PageFadeIn ready={!!data} wait={<DonationSkeleton />}>
        {data && data.allocation === 0 && (
          <p
            css={`
              color: ${(props) => props.theme.text700};
            `}
          >
            Le solde de votre boucle départementale est nul.
          </p>
        )}
      </PageFadeIn>
      <p
        css={`
          color: ${(props) => props.theme.text700};
        `}
      >
        La caisse de la boucle départementale peut-être alimentée par les
        cotisations des élu·es du département, par la redistribution d'une
        caisse nationale de solidarité et par des dons.
      </p>
      <p
        css={`
          color: ${(props) => props.theme.text700};
        `}
      >
        Il est possible d'allouer des dons aux actions de la boucle
        départementale de manière ponctuelle ou avec une contribution financière
        sur l'année, en choisissant de reserver une partie de son financement à
        un département. <Link route="groupDonationHelp">En savoir plus</Link>
      </p>
      <StyledButtons>
        <Button link route="contributions" color="secondary">
          Devenir financeur·euse
        </Button>
        <Button link route="donations" color="secondary">
          Allouer un don
        </Button>
      </StyledButtons>

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
          Si la demande est complète et l'allocation de votre boucle suffisante,
          vous pourrez la transmettre pour vérification à l'autre personne en
          charge de la gestion de la caisse départementale, et ensuite la faire
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
BouDepFinancePage.propTypes = {
  onBack: PropTypes.func,
  illustration: PropTypes.string,
  groupPk: PropTypes.string,
};
export default BouDepFinancePage;
