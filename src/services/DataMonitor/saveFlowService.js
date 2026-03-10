import axios from 'axios';

const DEFAULT_SAVE_API = '/DataFlowService/Normalizer/nifi-processes/save';
const SAVE_API = import.meta.env.VITE_FLOW_SAVE_API_URL || DEFAULT_SAVE_API;

const toSaveNode = (node) => ({
  identifier: node.identifier ?? node.id ?? '',
  instanceIdentifier: node.instanceIdentifier ?? '',
  ...node,
});

const toSavePayload = (payload = {}) => ({
  identifier: payload.identifier ?? '',
  instanceIdentifier: payload.instanceIdentifier ?? '',
  ...payload,
  createDataFlow: payload.createDataFlow
    ? {
        vendorId: payload.createDataFlow.vendorId ?? null,
        ...payload.createDataFlow,
      }
    : null,
  nodes: Array.isArray(payload.nodes) ? payload.nodes.map(toSaveNode) : [],
});

export const saveFlow = async ({ payload }) => {
  const response = await axios.post(SAVE_API, toSavePayload(payload), {
    headers: {
      'Content-Type': 'application/json',
      accept: 'application/json',
    },
    withCredentials: true,
  });

  return response?.data;
};
