import useSWR from "swr";

import { appendQueryParams } from "@agir/groups/utils/api";
import { API_GROUP_PREFIX } from "@agir/groups/utils/api";
import useSWRInfinite from "swr/infinite";

const GROUP_ACCOUNT_OPERATIONS_URL = `${API_GROUP_PREFIX}:groupPk/accountoperations`;

const PAGE_LIMIT = 20;
function getSwrGetKey(endpoint, pageIndex, prevPage, params, queryParams) {
  if (prevPage && !prevPage.next) return null;
  return appendQueryParams(endpoint, params, {
    ...queryParams,
    page: pageIndex + 1,
    page_size: PAGE_LIMIT,
  });
}

export const useInfiniteGroupAccountOperations = (groupPk, queryParams) => {
  const { data, size, error, ...rest } = useSWRInfinite((index, prevPage) =>
    getSwrGetKey(
      GROUP_ACCOUNT_OPERATIONS_URL,
      index,
      prevPage,
      { groupPk },
      queryParams,
    ),
  );

  const isLoadingInitialData = !data && !error;
  const isLoadingMore =
    isLoadingInitialData ||
    (size > 0 && data && typeof data[size - 1] === "undefined");

  return { data, size, error, isLoadingMore, ...rest };
};

export const useGroupFinanceFutur = (groupPk) => {
  return useSWR(
    appendQueryParams(`${API_GROUP_PREFIX}:groupPk/finance/futur`, { groupPk }),
  );
};

export const useGroupAllocation = (groupPk) => {
  return useSWR(
    appendQueryParams(`${API_GROUP_PREFIX}:groupPk/allocation`, { groupPk }),
  );
};

export const useGroupSpendingRequests = (groupPk, status) => {
  return useSWR(
    appendQueryParams(
      `${API_GROUP_PREFIX}:groupPk/spendingrequests`,
      { groupPk },
      { status_in: status },
    ),
  );
};
