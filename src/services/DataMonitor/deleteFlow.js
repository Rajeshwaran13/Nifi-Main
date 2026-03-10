import axios from 'axios';
import config from '../../constants/config';

const DEFAULT_DELETE_FLOW_API = '/DataFlowService/Normalizer/nifi-processes';
const DELETE_FLOW_API = import.meta.env.VITE_FLOW_DELETE_API_URL || DEFAULT_DELETE_FLOW_API;

export const deleteFlow = async ({ id, tenantCode = config.tenantCode }) => {
  const response = await axios.delete(
    `${DELETE_FLOW_API}/${encodeURIComponent(tenantCode)}/${encodeURIComponent(id)}`,
    {
      headers: {
        accept: 'application/json',
      },
      withCredentials: true,
    }
  );

  return response?.data;
};
