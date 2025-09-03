import React from "react";
import { Column, useIsDesktop } from "@agir/front/genericComponents/grid";
import { formatCurrencyAmount } from "@agir/front/currency/utils.currency";
import { useGroupAllocation } from "@agir/groups/groupPage/GroupSettings/GroupFinancePage/apiGroupFinance";

import PropTypes from "prop-types";
import styled from "styled-components";
import { Button } from "@agir/donations/common/StyledComponents";

const HistoryHeader = styled.section`
  display: flex;
  justify-content: space-between;

  a {
    justify-content: flex-end;
  }

  @media (max-width: ${(props) => props.theme.collapse}px) {
    flex-direction: column-reverse;

    h2 {
      margin: 0;
    }
  }
`;

function GroupFinanceHistoryHeader({ groupPk }) {
  const { data: allocation } = useGroupAllocation(groupPk);

  const isDesktop = useIsDesktop();

  return (
    <HistoryHeader>
      <Column>
        <h2 style={{ marginBottom: 0 }}>Détail du budget</h2>

        <Button
          link
          block={!isDesktop}
          color="link"
          route="groupDonationHelp"
          icon="external-link"
          rightIcon
          target={isDesktop ? "_blank" : undefined}
          wrap={!isDesktop}
          style={{ paddingTop: 0 }}
        >
          En savoir plus
        </Button>
      </Column>
      <h2>{formatCurrencyAmount(allocation)}</h2>
    </HistoryHeader>
  );
}

GroupFinanceHistoryHeader.propTypes = {
  groupPk: PropTypes.string,
};

export default GroupFinanceHistoryHeader;
