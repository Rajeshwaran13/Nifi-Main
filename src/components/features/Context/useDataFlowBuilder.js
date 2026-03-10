import { useEffect, useState } from 'react';
import { useProcessorCatalog } from '../../../hooks/Data_Fetching/useProcessorCatalog';
import { CREATE_DATA_FLOW_APPLY_EVENT } from './createDataFlowEvents';
import { applyProcessGroupToNodeData } from './dndFlowUtils';
import useFlowInteractions from './useFlowInteractions';
import useFlowPersistence from './useFlowPersistence';

export default function useDataFlowBuilder(initialCreateDataFlow = null, initialFlowDefinition = null) {
  const { processors, loading, error } = useProcessorCatalog();
  const [createDataFlow, setCreateDataFlow] = useState(initialCreateDataFlow);
  const [isDeploying, setIsDeploying] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const flow = useFlowInteractions(createDataFlow, initialFlowDefinition, processors);
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

  useEffect(() => {
    if (!initialCreateDataFlow) return;
    setCreateDataFlow(initialCreateDataFlow);

    if (!initialCreateDataFlow.processGroup) return;

    setNodes((items) =>
      items.map((node) => ({
        ...node,
        data: applyProcessGroupToNodeData(node.data, initialCreateDataFlow.processGroup),
      }))
    );
  }, [initialCreateDataFlow, setNodes]);

  useEffect(() => {
    if (!initialFlowDefinition?.createDataFlow) return;
    setCreateDataFlow(initialFlowDefinition.createDataFlow);
  }, [initialFlowDefinition]);

  useFlowPersistence({
    nodes: flow.nodes,
    edges: flow.edges,
    createDataFlow,
    isDeploying,
    setIsDeploying,
    isSaving,
    setIsSaving,
  });

  return {
    processors,
    loading,
    error,
    createDataFlow,
    ...flow,
  };
}
