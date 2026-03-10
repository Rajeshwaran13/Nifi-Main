import axios from 'axios';
import config from '../../constants/config';

const DEFAULT_RESTORE_FLOW_API = '/DataFlowService/Normalizer/nifi-processes';
const RESTORE_FLOW_API = import.meta.env.VITE_FLOW_RESTORE_API_URL || DEFAULT_RESTORE_FLOW_API;

export const restoreFlow = async ({
  tenantCode = config.tenantCode,
  processGroupName,
} = {}) => {
  if (!tenantCode) throw new Error('Missing tenantCode for restoreFlow');
  if (!processGroupName) throw new Error('Missing processGroupName for restoreFlow');

  const response = await axios.post(
    `${RESTORE_FLOW_API}/${encodeURIComponent(tenantCode)}/${encodeURIComponent(
      processGroupName
    )}/restore`,
    '',
    {
      headers: {
        accept: 'application/json',
      },
      withCredentials: true,
    }
  );

  return response?.data;
};
