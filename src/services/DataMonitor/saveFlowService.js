import axios from 'axios';
import { withTargetEntityCode } from '../targetEntityPayload';

const DEFAULT_SAVE_API = '/DataFlowService/Normalizer/nifi-processes/save';
const SAVE_API = import.meta.env.VITE_FLOW_SAVE_API_URL || DEFAULT_SAVE_API;

const toSaveNode = (node) => ({
  identifier: node.identifier ?? node.id ?? '',
  instanceIdentifier: node.instanceIdentifier ?? '',
  ...node,
});

const toSavePayload = (payload = {}) => {
  const normalized = withTargetEntityCode(payload);

  return {
    identifier: normalized.identifier ?? '',
    instanceIdentifier: normalized.instanceIdentifier ?? '',
    ...normalized,
    createDataFlow: normalized.createDataFlow
      ? {
          vendorId: normalized.createDataFlow.vendorId ?? null,
          ...normalized.createDataFlow,
        }
      : null,
    nodes: Array.isArray(normalized.nodes) ? normalized.nodes.map(toSaveNode) : [],
  };
};

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
