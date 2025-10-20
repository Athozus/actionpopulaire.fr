import React from "react";
import PropTypes from "prop-types";
import OperationRow from "./OperationRow";
import Accordion from "@agir/front/genericComponents/Accordion";
import { Box } from "@agir/groups/groupPage/GroupSettings/GroupFinancePage/Group";
import {
  useGroupFinanceFutur,
  useGroupSpendingRequests,
} from "@agir/groups/groupPage/GroupSettings/GroupFinancePage/apiGroupFinance";
import styled from "styled-components";

const GroupFinanceFuturContent = styled.div`
  width: 100%;
  padding: 1.2rem;
  @media (max-width: ${(props) => props.theme.collapse}px) {
    padding: 0.5rem;
  }
`;

const FUTURS_OPERATIONS = [
  { key: "allocsFutur", title: "Dons à venir", category: "DONS" },
  {
    key: "cotisationFutur",
    title: "Cotisations à venir",
    category: "COTISATIONS",
  },
  {
    key: "cnsFutur",
    title: "Prochaine distribution de la CNS",
    category: "CNS",
  },
];

function GroupFinanceFutur({ groupPk }) {
  const { data: operations } = useGroupFinanceFutur(groupPk);
  const { data: spendingRequests } = useGroupSpendingRequests(
    groupPk,
    "G,R,I",
  );

  const amountFutursOperation =
    Object.values(operations ?? {})
      .map((value) => (value > 0 ? 1 : 0))
      .reduce((prev, curr) => prev + curr, 0) + (spendingRequests?.length ?? 0);

  return (
    <div>
      <Box style={{ padding: 0 }}>
        <Accordion
          style={{
            borderRadius: "10px",
          }}
          name={
            amountFutursOperation
              ? `${amountFutursOperation} opérations à venir`
              : "Aucune opération à venir"
          }
        >
          <GroupFinanceFuturContent>
            <p>
              <i className="fa fa-circle-info" /> Les revenus sont calculés en
              fonction des dons mensuels et des précédentes cotisations, c'est
              une estimation.
            </p>
            {FUTURS_OPERATIONS.filter(
              (operation) => operations?.[operation.key] > 0,
            ).map((operation) => (
              <OperationRow
                key={operation.key}
                operation={{
                  title: operation.title,
                  amount: operations?.[operation.key],
                  category: operation.category,
                }}
              />
            ))}
            {spendingRequests?.map((request) => (
              <OperationRow
                key={request.id}
                operation={{
                  ...request,
                  amount: -request.amount,
                }}
              />
            ))}
          </GroupFinanceFuturContent>
        </Accordion>
      </Box>
    </div>
  );
}

GroupFinanceFutur.propTypes = {
  groupPk: PropTypes.string,
};

export default GroupFinanceFutur;
