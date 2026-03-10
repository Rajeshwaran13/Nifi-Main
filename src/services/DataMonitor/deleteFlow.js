import axios from 'axios';
import config from '../../constants/config';

const DEFAULT_DELETE_FLOW_API = '/DataFlowService/Normalizer/nifi-processes';
const DELETE_FLOW_API = import.meta.env.VITE_FLOW_DELETE_API_URL || DEFAULT_DELETE_FLOW_API;

const pickFirst = (...values) => values.find((value) => value !== undefined && value !== null && value !== '');

export const deleteFlow = async ({
  processGroupName,
  id,
  tenantCode = config.tenantCode,
} = {}) => {
  const groupName = pickFirst(processGroupName, id);

  if (!tenantCode) {
    throw new Error('Missing tenantCode for deleteFlow');
  }

  if (!groupName) {
    throw new Error('Missing processGroupName for deleteFlow');
  }

  const response = await axios.delete(
    `${DELETE_FLOW_API}/${encodeURIComponent(tenantCode)}/${encodeURIComponent(groupName)}`,
    {
      headers: {
        accept: 'application/json',
      },
      withCredentials: true,
    }
  );

  return response?.data;
};
