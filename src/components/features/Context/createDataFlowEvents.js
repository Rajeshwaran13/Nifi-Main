export const CREATE_DATA_FLOW_REQUEST_EVENT = 'dataflow:create:request';
export const CREATE_DATA_FLOW_APPLY_EVENT = 'dataflow:create:apply';

export const CREATE_DATA_FLOW_DRAG_ITEM = {
  id: 'create-data-flow',
  nodeName: 'Create Data Flow',
  processorName: 'Create Data Flow',
  processorType: 'dataflow',
};

export const isCreateDataFlowDragItem = (item) =>
  String(item?.processorType || '').toLowerCase() === 'dataflow';

export const requestCreateDataFlow = (detail = {}) => {
  window.dispatchEvent(new CustomEvent(CREATE_DATA_FLOW_REQUEST_EVENT, { detail }));
};

export const applyCreateDataFlow = (detail) => {
  window.dispatchEvent(new CustomEvent(CREATE_DATA_FLOW_APPLY_EVENT, { detail }));
};
