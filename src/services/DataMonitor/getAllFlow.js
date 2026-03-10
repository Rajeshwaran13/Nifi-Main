import axios from 'axios';
import config from '../../constants/config';

const DEFAULT_GET_ALL_FLOW_API = '/DataFlowService/Normalizer/nifi-processes';
const GET_ALL_FLOW_API = import.meta.env.VITE_FLOW_GET_ALL_API_URL || DEFAULT_GET_ALL_FLOW_API;

const pickFirst = (...values) => values.find((value) => value !== undefined && value !== null && value !== '');

const getFlowItems = (payload) => {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.content)) return payload.content;
  if (Array.isArray(payload?.data?.content)) return payload.data.content;
  if (Array.isArray(payload?.data)) return payload.data;
  if (Array.isArray(payload?.items)) return payload.items;
  return [];
};

const toMonitorRow = (item, index) => ({
  id: pickFirst(item?.id, item?.identifier, item?.instanceIdentifier, `flow-${index + 1}`),
  processGroupName: item?.processGroupName,
  currentFlowStatus: item?.currentFlowStatus,
  domainName: item?.domainName,
  version: item?.version,
  lagCount: item?.lagCount,
  currentReceived: item?.currentReceived,
  currentSent: item?.currentSent,
  dataThroughput: item?.dataThroughput,
  actions: item?.actions,
});

export const getAllFlow = async ({
  tenantCode = config.tenantCode,
  page = 0,
  size = 100,
} = {}) => {
  const response = await axios.get(
    `${GET_ALL_FLOW_API}/${encodeURIComponent(tenantCode)}`,
    {
      params: { page, size },
      headers: {
        accept: 'application/json',
      },
      withCredentials: true,
    }
  );

  return getFlowItems(response?.data).map(toMonitorRow);
};
