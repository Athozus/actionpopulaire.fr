import querystring from "query-string";
import axios from "@agir/lib/utils/axios";
import { objectToFormData } from "@agir/lib/utils/forms";
import useSWR from "swr";

export const API_GROUP_PREFIX = "/api/groupes/";

export const ENDPOINT = {
  getGroup: `${API_GROUP_PREFIX}:groupPk/`,
  getGroupSuggestions: `${API_GROUP_PREFIX}:groupPk/suggestions/`,

  joinGroup: `${API_GROUP_PREFIX}:groupPk/rejoindre/`,
  followGroup: `${API_GROUP_PREFIX}:groupPk/suivre/`,
  updateOwnMembership: `${API_GROUP_PREFIX}:groupPk/membre/`,
  quitGroup: `${API_GROUP_PREFIX}:groupPk/quitter/`,

  getUpcomingEvents: `${API_GROUP_PREFIX}:groupPk/evenements/a-venir/`,
  getPastEvents:
    `${API_GROUP_PREFIX}:groupPk/evenements/passes/?page=:page&page_size=:pageSize`,
  getPastEventReports: `${API_GROUP_PREFIX}:groupPk/evenements/compte-rendus/`,

  getEventsJoinedByGroup: `${API_GROUP_PREFIX}:groupPk/evenements-rejoints/`,

  getMessages: `${API_GROUP_PREFIX}:groupPk/messages/?page=:page&page_size=:pageSize`,
  getMessage: `${API_GROUP_PREFIX}messages/:messagePk/`,

  createMessage: `${API_GROUP_PREFIX}:groupPk/messages/`,
  createPrivateMessage: `${API_GROUP_PREFIX}:groupPk/envoi-message-prive/`,
  updateMessage: `${API_GROUP_PREFIX}messages/:messagePk/`,
  deleteMessage: `${API_GROUP_PREFIX}messages/:messagePk/`,
  messageNotification: `${API_GROUP_PREFIX}messages/notification/:messagePk/`,
  messageLocked: `${API_GROUP_PREFIX}messages/verrouillage/:messagePk/`,
  messageParticipants: `${API_GROUP_PREFIX}messages/:messagePk/participants/`,

  getComments: `${API_GROUP_PREFIX}messages/:messagePk/comments/`,
  createComment: `${API_GROUP_PREFIX}messages/:messagePk/comments/`,
  deleteComment: `${API_GROUP_PREFIX}messages/comments/:commentPk/`,
  setAllMessagesRead: `/api/messages/all-read/`,

  getMembers: `${API_GROUP_PREFIX}:groupPk/membres/`,
  updateGroup: `${API_GROUP_PREFIX}:groupPk/update/`,
  inviteToGroup: `${API_GROUP_PREFIX}:groupPk/invitation/`,
  getMemberPersonalInformation: `${API_GROUP_PREFIX}membres/:memberPk/informations/`,
  updateMember: `${API_GROUP_PREFIX}membres/:memberPk/`,
  getFinance: `${API_GROUP_PREFIX}:groupPk/finance/`,

  report: `/api/report/`,

  createGroupExternalLink: `${API_GROUP_PREFIX}:groupPk/link/`,
  groupExternalLink: `${API_GROUP_PREFIX}:groupPk/link/:linkPk/`,

  searchGroups: `${API_GROUP_PREFIX}recherche/`,
  geoSearchGroups: `${API_GROUP_PREFIX}recherche/geo/`,

  getStatistics: `${API_GROUP_PREFIX}:groupPk/stats/`,
};

export const useMembershipRemoveRequestById = (requestId) => useSWR(requestId ? `/api/groupes/request-membership-remove/${requestId}` : null)

export const useRemoveMembershipRequestByGroup = (groupId) => {
  return useSWR(`/api/groupes/${groupId}/request-membership-remove`)
}

export const createRemoveMembershipRequest = async (groupId, memberId, details, reason) => axios.post(`/api/groupes/request-membership-remove/`, {
  supportgroupId: groupId,
  personId: memberId,
  details,
  reason: reason
})

export const useMembershipRemoveRequestRefuse = (requestId) => axios.patch(`/api/groupes/request-membership-remove/${requestId}/refuse`)

export const useMembershipRemoveRequestValidate = (requestId) => axios.patch(`/api/groupes/request-membership-remove/${requestId}/validate`)

export const appendQueryParams = (endpoint, params, querystringParams) => {
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      endpoint = endpoint.replace(`:${key}`, value);
    });
  }

  if (querystringParams) {
    endpoint += `?${querystring.stringify(querystringParams, {
      arrayFormat: "comma",
    })}`;
  }

  return endpoint;
}

export const getGroupEndpoint = (key, params, querystringParams) => {
  let endpoint = ENDPOINT[key] || key;

  return appendQueryParams(endpoint, params, querystringParams);
};

export const formatMessage = (message) => {
  const data = {
    ...message,
    linkedEvent: (message.linkedEvent && message.linkedEvent.id) || null,
  };

  if (data.attachment && typeof data.attachment.file === "string") {
    data.attachment = undefined;
  }

  return data.attachment ? objectToFormData({...data, attachmentCreate: data.attachment, attachment: null}) : data;
};

export const createMessage = async (groupPk, message) => {
  const result = {
    data: null,
    error: null,
  };
  const url = getGroupEndpoint("createMessage", { groupPk });
  const body = formatMessage(message);

  try {
    const response = await axios.post(url, body);
    result.data = response.data;
  } catch (e) {
    result.error = (e.response && e.response.data) || e.message;
  }

  return result;
};

export const createPrivateMessage = async (groupPk, message) => {
  const result = {
    data: null,
    error: null,
  };
  const url = getGroupEndpoint("createPrivateMessage", { groupPk });
  const body = formatMessage(message);
  try {
    const response = await axios.post(url, body);
    result.data = response.data;
  } catch (e) {
    result.error = (e.response && e.response.data) || e.message;
  }

  return result;
};

export const updateMessage = async (message) => {
  const result = {
    data: null,
    error: null,
  };
  const url = getGroupEndpoint("updateMessage", { messagePk: message.id });
  const body = formatMessage(message);
  try {
    const response = await axios.patch(url, body);
    result.data = response.data;
  } catch (e) {
    result.error = (e.response && e.response.data) || e.message;
  }

  return result;
};

export const getMessageNotification = async (messagePk) => {
  const result = {
    data: null,
    error: null,
  };
  const url = getGroupEndpoint("messageNotification", {
    messagePk,
  });
  try {
    const response = await axios.get(url);
    result.data = response.data;
  } catch (e) {
    result.error = (e.response && e.response.data) || e.message;
  }

  return result;
};

export const updateMessageNotification = async (messagePk, isMuted) => {
  const result = {
    data: null,
    error: null,
  };
  const url = getGroupEndpoint("messageNotification", {
    messagePk,
  });
  try {
    const response = await axios.put(url, { isMuted });
    result.data = response.data;
  } catch (e) {
    result.error = (e.response && e.response.data) || e.message;
  }

  return result;
};

export const updateMessageLock = async (messagePk, isLocked) => {
  const result = {
    data: null,
    error: null,
  };
  const url = getGroupEndpoint("messageLocked", {
    messagePk,
  });
  try {
    const response = await axios.put(url, { isLocked });
    result.data = response.data;
  } catch (e) {
    result.error = (e.response && e.response.data) || e.message;
  }

  return result;
};

export const deleteMessage = async (message) => {
  const result = {
    data: null,
    error: null,
  };
  const url = getGroupEndpoint("deleteMessage", { messagePk: message.id });
  try {
    const response = await axios.delete(url);
    result.data = response.data;
  } catch (e) {
    result.error = (e.response && e.response.data) || e.message;
  }

  return result;
};

export const getMessageParticipants = async (messagePk) => {
  const result = {
    data: null,
    error: null,
  };
  const url = getGroupEndpoint("messageParticipants", { messagePk });
  try {
    const response = await axios.get(url);
    result.data = response.data;
  } catch (e) {
    result.error = (e.response && e.response.data) || e.message;
  }

  return result;
};

export const reportMessage = async (message) => {
  const result = {
    data: null,
    error: null,
  };
  const url = getGroupEndpoint("report");
  const body = {
    object_id: message.id,
    content_type: "msgs.supportgroupmessage",
  };
  try {
    const response = await axios.post(url, body);
    result.data = response.data;
  } catch (e) {
    result.error = (e.response && e.response.data) || e.message;
  }

  return result;
};

export const getComments = async (messagePk) => {
  const result = {
    data: null,
    error: null,
  };
  const url = getGroupEndpoint("getComments", { messagePk });
  try {
    const response = await axios.post(url);
    result.data = response.data;
  } catch (e) {
    result.error = (e.response && e.response.data) || e.message;
  }

  return result;
};

export const createComment = async (messagePk, data) => {
  const result = {
    data: null,
    error: null,
  };
  const url = getGroupEndpoint("createComment", { messagePk });
  const body = formatMessage(data);
  try {
    const response = await axios.post(url, body);
    result.data = response.data;
  } catch (e) {
    result.error = (e.response && e.response.data) || e.message;
  }

  return result;
};

export const deleteComment = async (comment) => {
  const result = {
    data: null,
    error: null,
  };
  const url = getGroupEndpoint("deleteComment", { commentPk: comment.id });
  try {
    const response = await axios.delete(url);
    result.data = response.data;
  } catch (e) {
    result.error = (e.response && e.response.data) || e.message;
  }

  return result;
};

export const reportComment = async (comment) => {
  const result = {
    data: null,
    error: null,
  };
  const url = getGroupEndpoint("report");
  const body = {
    object_id: comment.id,
    content_type: "msgs.supportgroupmessagecomment",
  };
  try {
    const response = await axios.post(url, body);
    result.data = response.data;
  } catch (e) {
    result.error = (e.response && e.response.data) || e.message;
  }

  return result;
};

export const joinGroup = async (groupPk) => {
  const result = {
    data: null,
    error: null,
  };
  const url = getGroupEndpoint("joinGroup", { groupPk });
  try {
    const response = await axios.post(url, {});
    result.data = response.data;
  } catch (e) {
    result.error = (e.response && e.response.data) || e.message;
  }

  return result;
};

export const followGroup = async (groupPk) => {
  const result = {
    data: null,
    error: null,
  };
  const url = getGroupEndpoint("followGroup", { groupPk });
  try {
    const response = await axios.post(url, {});
    result.data = response.data;
  } catch (e) {
    result.error = e?.response?.data || e.message;
  }

  return result;
};

export const quitGroup = async (groupPk) => {
  const result = {
    data: null,
    error: null,
  };
  const url = getGroupEndpoint("quitGroup", { groupPk });
  try {
    const response = await axios.delete(url, {});
    result.data = response.data;
  } catch (e) {
    result.error = e?.response?.data || e.message;
  }

  return result;
};

export const updateGroup = async (groupPk, data) => {
  const result = {
    data: null,
    error: null,
  };
  const url = getGroupEndpoint("updateGroup", { groupPk });
  let headers = undefined;
  let body = data;

  if (body.image) {
    body = new FormData();
    Object.keys(data).forEach((e) => {
      body.append(e, data[e]);
    });
  }

  try {
    const response = await axios.patch(url, body, { headers });
    result.data = response.data;
  } catch (e) {
    if (e.response && e.response.data) {
      result.error =
        e.response.status === 400 && data.image
          ? { image: "La taille du fichier ne doit pas dépasser le 2.5 Mo" }
          : e.response.data;
    } else {
      result.error = e.message;
    }
  }

  return result;
};

export const inviteToGroup = async (groupPk, data) => {
  const result = {
    data: null,
    error: null,
  };
  const url = getGroupEndpoint("inviteToGroup", { groupPk });

  try {
    const response = await axios.post(url, data);
    result.data = response.data;
  } catch (e) {
    result.error = (e.response && e.response.data) || e.message;
  }

  return result;
};

export const setAllMessagesRead = async () => {
  const result = {
    data: null,
    error: null,
  };
  try {
    const response = await axios.get(ENDPOINT.setAllMessagesRead);
    result.data = response.data;
  } catch (e) {
    result.error = (e.response && e.response.data) || e.message;
  }

  return result;
};

export const getMembers = async (groupPk) => {
  const result = {
    data: null,
    error: null,
  };
  const url = getGroupEndpoint("getMembers", { groupPk });
  try {
    const response = await axios.get(url);
    result.data = response.data;
  } catch (e) {
    result.error = (e.response && e.response.data) || e.message;
  }

  return result;
};

export const getMemberPersonalInformation = async (memberPk) => {
  const result = {
    data: null,
    error: null,
  };
  const url = getGroupEndpoint("getMemberPersonalInformation", {
    memberPk,
  });
  try {
    const response = await axios.get(url);
    result.data = response.data;
  } catch (e) {
    result.error = (e.response && e.response.data) || e.message;
  }

  return result;
};

export const updateMember = async (memberPk, data) => {
  const result = {
    data: null,
    error: null,
  };
  const url = getGroupEndpoint("updateMember", { memberPk });

  try {
    const response = await axios.patch(url, data);
    result.data = response.data;
  } catch (e) {
    result.error = (e.response && e.response.data) || e.message;
  }

  return result;
};

export const getFinance = async (groupPk) => {
  const result = {
    data: null,
    error: null,
  };
  const url = getGroupEndpoint("getFinance", { groupPk });

  try {
    const response = await axios.get(url);
    result.data = response.data;
  } catch (e) {
    result.error = (e.response && e.response.data) || e.message;
  }

  return result;
};

export const createGroupLink = async (groupPk, body) => {
  const result = {
    data: null,
    error: null,
  };

  const url = getGroupEndpoint("createGroupExternalLink", { groupPk });

  try {
    const response = await axios.post(url, body);
    result.data = response.data;
  } catch (e) {
    result.error = (e.response && e.response.data) || e.message;
  }

  return result;
};

export const updateGroupLink = async (groupPk, linkPk, body) => {
  const result = {
    data: null,
    error: null,
  };

  const url = getGroupEndpoint("groupExternalLink", {
    groupPk,
    linkPk,
  });

  try {
    const response = await axios.put(url, body);
    result.data = response.data;
  } catch (e) {
    result.error = (e.response && e.response.data) || e.message;
  }

  return result;
};

export const saveGroupLink = (groupPk, link) => {
  const body = {
    url: encodeURI(
      link.url.includes("http")
        ? link.url.trim()
        : `https://${link.url.trim()}`,
    ),
    label: link.label,
  };
  return link.id
    ? updateGroupLink(groupPk, link.id, body)
    : createGroupLink(groupPk, body);
};

export const deleteGroupLink = async (groupPk, linkPk) => {
  const result = {
    success: false,
    error: null,
  };

  const url = getGroupEndpoint("groupExternalLink", { groupPk, linkPk });

  try {
    await axios.delete(url);
    result.success = true;
  } catch (e) {
    result.error = (e.response && e.response.data) || e.message;
  }

  return result;
};

export const searchGroups = async (searchTerms, params = {}) => {
  const result = {
    data: null,
    error: null,
  };
  const url = getGroupEndpoint("searchGroups");
  try {
    const response = await axios.get(url, {
      params: { ...params, q: searchTerms },
    });
    result.data = response.data;
  } catch (e) {
    result.error = (e.response && e.response.data) || { global: e.message };
  }

  return result;
};

export const updateOwnMembership = async (groupPk, data) => {
  const result = {
    data: null,
    error: null,
  };
  const url = getGroupEndpoint("updateOwnMembership", { groupPk });

  try {
    const response = await axios.patch(url, data);
    result.data = response.data;
  } catch (e) {
    result.error = (e.response && e.response.data) || e.message;
  }

  return result;
};
