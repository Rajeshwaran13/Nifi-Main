import { useEffect, useState } from 'react';
import { useProcessorCatalog } from '../../../hooks/Data_Fetching/useProcessorCatalog';
import { CREATE_DATA_FLOW_APPLY_EVENT } from './createDataFlowEvents';
import { applyProcessGroupToNodeData } from './dndFlowUtils';
import useFlowInteractions from './useFlowInteractions';
import useFlowPersistence from './useFlowPersistence';

export default function useDataFlowBuilder() {
  const { processors, loading, error } = useProcessorCatalog();
  const [createDataFlow, setCreateDataFlow] = useState(null);
  const [isDeploying, setIsDeploying] = useState(false);
  const flow = useFlowInteractions(createDataFlow);
  const { setNodes } = flow;

  useEffect(() => {
    const handleCreateDataFlowApply = (event) => {
      const detail = event?.detail || null;
      setCreateDataFlow(detail);

      if (!detail?.processGroup) return;

      setNodes((items) =>
        items.map((node) => ({
          ...node,
          data: applyProcessGroupToNodeData(node.data, detail.processGroup),
        }))
      );
    };

    window.addEventListener(CREATE_DATA_FLOW_APPLY_EVENT, handleCreateDataFlowApply);
    return () => {
      window.removeEventListener(CREATE_DATA_FLOW_APPLY_EVENT, handleCreateDataFlowApply);
    };
  }, [setNodes]);

  useFlowPersistence({
    nodes: flow.nodes,
    edges: flow.edges,
    createDataFlow,
    isDeploying,
    setIsDeploying,
  });

  return {
    processors,
    loading,
    error,
    ...flow,
  };
}
