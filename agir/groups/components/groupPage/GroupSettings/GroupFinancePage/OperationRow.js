import styled from "styled-components";
import { Box } from "@agir/groups/groupPage/GroupSettings/GroupFinancePage/Group";
import CategoryIcon from "@agir/donations/spendingRequest/common/CategoryIcon";
import PropTypes from "prop-types";
import React from "react";
import { CATEGORY_OPTIONS_WITH_DONS } from "./GroupFinanceHistoryPage";
import { formatCurrencyAmount } from "@agir/front/currency/utils.currency";
import { Button } from "@agir/donations/common/StyledComponents";

const LeftColumn = styled.div``;
const CenterColumn = styled.div``;

const Amount = styled.span`
  display: flex;
  align-items: center;
  font-size: 1.4rem;
  white-space: nowrap;

  @media (max-width: ${(props) => props.theme.collapse}px) {
    font-size: 1.1rem;
  }
`;

const PositiveAmount = styled.span`
  color: ${(props) => props.theme.success500};
`;
const NegativeAmount = styled.span`
  color: ${(props) => props.theme.error500};
`;

const TitleRow = styled.p`
  margin: 0;
  @media (max-width: ${(props) => props.theme.collapse}px) {
    min-width: 100px;
  }
`;
const DateRow = styled.p`
  color: ${(props) => props.theme.text500};
  margin: 0;
`;

const OperationRowDiv = styled.div`
  display: flex;
  justify-content: space-between;
`;

const OperationInformation = styled.div`
  display: flex;
  flex-direction: row;
  gap: 0.7em;
  a {
    padding: 0;
  }
  ${LeftColumn} {
    span,
    i {
      padding: 12px;
      width: 3rem;
      height: 3rem;
      border-radius: 100%;
      color: ${(props) => props.theme.error500};
      background-color: ${(props) => props.theme.error500}11;
    }

    span[name="heart"],
    i {
      color: ${(props) => props.theme.text25};
      background-color: ${(props) => props.theme.success500};
    }
  }
  ${CenterColumn} {
    display: flex;
    gap: 6px;
    align-items: center;

    span:last-child {
      height: 100%;
    }

    @media (max-width: ${(props) => props.theme.collapse}px) {
      align-items: start;
      flex-direction: column;
      justify-content: center;
      max-width: 140px;
      gap: 0;
    }
  }
`;

function OperationAmount({ amount }) {
  const amountFormatted = formatCurrencyAmount(Math.abs(amount));

  return (
    <Amount>
      {amount > 0 ? (
        <PositiveAmount>+{amountFormatted}</PositiveAmount>
      ) : (
        <NegativeAmount>-{amountFormatted}</NegativeAmount>
      )}
    </Amount>
  );
}

function OperationRow({ operation }) {
  return (
    <Box style={{ marginBottom: "15px" }}>
      <OperationRowDiv>
        <OperationInformation>
          <LeftColumn>
            <CategoryIcon
              category={
                CATEGORY_OPTIONS_WITH_DONS[operation.category ?? "ELLIPSIS"]
              }
              size="1.5rem"
            />
          </LeftColumn>
          <CenterColumn>
            <span>
              <TitleRow>
                {operation.title === "Operation" ? "Autre" : operation.title}
              </TitleRow>
              <DateRow>
                {(operation.spendingDate || operation.datetime) &&
                  new Date(
                    operation.spendingDate ?? operation.datetime,
                  ).toLocaleDateString("fr-FR")}
              </DateRow>
            </span>
            <span>
              {operation.id && operation.spendingDate && (
                <Button
                  link
                  color="link"
                  route="spendingRequestHistory"
                  routeParams={{ spendingRequestPk: operation.id }}
                  icon="external-link"
                >
                  Détails
                </Button>
              )}
            </span>
          </CenterColumn>
        </OperationInformation>
        <OperationAmount amount={operation.amount} />
      </OperationRowDiv>
    </Box>
  );
}

OperationRow.propTypes = {
  operation: PropTypes.object,
  asGrey: PropTypes.bool,
};

export default OperationRow;
