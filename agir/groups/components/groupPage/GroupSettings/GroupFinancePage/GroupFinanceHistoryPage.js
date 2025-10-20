import React, { useCallback, useMemo, useState } from "react";
import Skeleton from "@agir/front/genericComponents/Skeleton";
import PageFadeIn from "@agir/front/genericComponents/PageFadeIn";
import PropTypes from "prop-types";
import { CATEGORY_OPTIONS } from "@agir/donations/spendingRequest/common/form.config";
import {
  StyledBody,
  StyledMain,
  StyledPage,
} from "@agir/donations/common/StyledComponents";
import { Row } from "@agir/front/genericComponents/grid";
import SelectField from "@agir/front/formComponents/SelectField";
import GroupFinanceFutur from "./GroupFinanceFutur";
import GroupFinanceHistoryHeader from "./GroupFinanceHistoryHeader";
import OperationRow from "./OperationRow";
import Spacer from "@agir/front/genericComponents/Spacer";
import { useInfiniteGroupAccountOperations } from "@agir/groups/groupPage/GroupSettings/GroupFinancePage/apiGroupFinance";
import { useInfiniteScroll } from "@agir/lib/utils/hooks";
import RadioListField from "@agir/front/formComponents/RadioListField";
import styled from "styled-components";
import BackLink from "@agir/front/app/Navigation/BackLink";
import startOfWeek from "date-fns/startOfWeek";
import endOfWeek from "date-fns/endOfWeek";
import startOfMonth from "date-fns/startOfMonth";
import DateRangePicker from "@agir/front/formComponents/DateRangePicker";
import { isValid } from "date-fns";

const RowFilter = styled.div`
  display: flex;
  gap: 15px;
  justify-content: space-between;

  @media (max-width: ${(props) => props.theme.collapse}px) {
    flex-direction: column-reverse;
  }
`;

const predefinedBottomRanges = [
  {
    label: "Cette semaine",
    value: [startOfWeek(new Date()), endOfWeek(new Date())],
  },
  {
    label: "Ce mois-ci",
    value: [startOfMonth(new Date()), new Date()],
  },
  {
    label: "Cette année",
    value: [new Date(new Date().getFullYear(), 0, 1), new Date()],
  },
  {
    label: "Annuler",
    value: null,
  },
];

export const CATEGORY_OPTIONS_WITH_DONS = {
  ...CATEGORY_OPTIONS,
  DONS: {
    value: "DONS",
    label: "Dons",
    icon: "heart",
  },
  CNS: {
    label: "Caisse nationale de solidarité",
    icon: "fa:box-heart",
    value: "CNS",
  },
  COTISATIONS: {
    label: "Cotisations d'élu·e",
    value: "COTISATIONS",
    icon: "fa:money-bill-1-wave",
  },
};

const StyledFinanceHistory = styled.div`
  @media (max-width: ${(props) => props.theme.collapse}px) {
    margin-left: 12px;
    margin-right: 12px;
  }
`;

const ALL_CATEGORY = { label: "Toutes catégories", value: "" };
const DEFAULT_SORT = { label: "Date décroissante ↓", value: "-datetime" };

function GroupFinanceHistoryPage({ groupPk }) {
  const [selectedCategory, setSelectedCategory] = useState(ALL_CATEGORY);
  const [selectedDateRange, setSelectedDateRange] = useState([]);
  const [sort, setSort] = useState(DEFAULT_SORT?.value);
  const [incomeFilter, setIncomeFilter] = useState();

  const {
    data: operations,
    isLoading,
    size,
    setSize,
    isLoadingMore,
  } = useInfiniteGroupAccountOperations(groupPk, {
    category: selectedCategory?.value,
    from: selectedDateRange?.[0],
    to: selectedDateRange?.[1],
    income: incomeFilter,
    order: sort?.value,
  });

  const loadMore = useCallback(() => setSize(size + 1), [setSize, size]);
  const lastItemRef = useInfiniteScroll(loadMore, isLoadingMore);

  const isReady = useMemo(() => {
    return !isLoading && operations !== undefined;
  }, [operations, isLoading]);

  return (
    <StyledPage>
      <StyledBody style={{ minHeight: "700px", marginTop: "40px" }}>
        <StyledMain $maxWidth="950px" style={{ paddingBottom: "4rem" }}>
          <StyledFinanceHistory>
            <BackLink style={{ margin: 0 }} />
            <GroupFinanceHistoryHeader groupPk={groupPk} />
            <Spacer size="0.4rem" />
            <GroupFinanceFutur groupPk={groupPk} />
            <h3>Dernières opérations</h3>
            <Row style={{ marginBottom: "12px" }} gutter={0} gap={15}>
              <DateRangePicker
                style={{ flexGrow: 1 }}
                ranges={predefinedBottomRanges}
                placeholder="Filtrer par date"
                onChange={(values) => {
                  if (!isValid(values[0]) || !isValid(values[1])) {
                    return;
                  }

                  return values
                    ? setSelectedDateRange(
                        values.map((date) => date.toISOString()),
                      )
                    : setSelectedDateRange([]);
                }}
              />
              <SelectField
                style={{ flexGrow: 1 }}
                id="category"
                value={selectedCategory}
                onChange={(value) => setSelectedCategory(value)}
                options={Object.values({
                  ALL_CATEGORY,
                  ...CATEGORY_OPTIONS_WITH_DONS,
                }).map(({ label, value }) => ({
                  label,
                  value,
                }))}
                placeholder="Catégorie"
                type="text"
              />
            </Row>
            <RowFilter>
              <RadioListField
                style={{ minWidth: "150px" }}
                id="income"
                options={[
                  {
                    label: "Dépense",
                    value: "depense",
                  },
                  {
                    label: "Revenu",
                    value: "revenu",
                  },
                ]}
                onChange={setIncomeFilter}
                value={incomeFilter}
              />
              <SelectField
                style={{ minWidth: "33%" }}
                placeholder="Trier par..."
                name="sort"
                asRow
                value={sort}
                onChange={setSort}
                options={[
                  { label: "Date croissante ↑", value: "datetime" },
                  DEFAULT_SORT,
                  { label: "Montant croissant ↑", value: "amount" },
                  { label: "Montant décroissant ↓️", value: "-amount" },
                ]}
              />
            </RowFilter>

            <Spacer size="1rem" />
            <div style={{ paddingLeft: "2px", paddingRight: "2px" }}>
              <PageFadeIn ready={isReady} wait={<Skeleton />}>
                {operations?.map((operations_page) =>
                  operations_page?.results.map((operation) => (
                    <OperationRow key={operation.id} operation={operation} />
                  )),
                )}
                {operations?.[0]?.count === 0 && (
                  <p style={{ textAlign: "center", marginTop: "10px" }}>
                    Aucune opération
                  </p>
                )}
              </PageFadeIn>
            </div>

            <div ref={lastItemRef} />
          </StyledFinanceHistory>
        </StyledMain>
      </StyledBody>
    </StyledPage>
  );
}

GroupFinanceHistoryPage.propTypes = {
  groupPk: PropTypes.string,
};

export default GroupFinanceHistoryPage;
