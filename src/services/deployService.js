import axios from 'axios';

const DEFAULT_DEPLOY_API = '/DataFlowService/api/v1/flows/deploy';
const DEPLOY_API = import.meta.env.VITE_FLOW_DEPLOY_API_URL || DEFAULT_DEPLOY_API;

export const deployFlow = async ({ processGroupId = 'root', payload }) => {
  const response = await axios.post(DEPLOY_API, payload, {
    params: { processGroupId },
    headers: {
      'Content-Type': 'application/json',
    },
    withCredentials: true,
  });

  return response?.data;
};
