import axios from 'axios';

const DEFAULT_EDIT_FLOW_API = '/DataFlowService/Normalizer/nifi-processes/fetch';
const EDIT_FLOW_API = import.meta.env.VITE_FLOW_EDIT_API_URL || DEFAULT_EDIT_FLOW_API;

const getFlowPayload = (responseData) => responseData?.data || responseData || null;

export const editFlow = async (processGroupName) => {
  const response = await axios.get(
    `${EDIT_FLOW_API}/${encodeURIComponent(processGroupName)}`,
    {
      headers: {
        accept: 'application/json',
      },
      withCredentials: true,
    }
  );

  return getFlowPayload(response?.data);
};
