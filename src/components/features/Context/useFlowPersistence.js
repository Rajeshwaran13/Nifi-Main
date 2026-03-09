import { useCallback, useEffect, useMemo } from 'react';
import { deployFlow } from '../../../services/deployService';
import { buildExportConfig } from './dndFlowUtils';

export default function useFlowPersistence({ nodes, edges, createDataFlow, isDeploying, setIsDeploying }) {
  const buildExportPayload = useMemo(
    () => () => {
      const sanitizedNodes = nodes.map((node) => ({
        id: node.id,
        type: node.type,
        position: node.position,
        data: {
          ...node.data,
          schema: undefined,
          config: {
            ...buildExportConfig(node.data?.schema, node.data?.config),
          },
        },
      }));

      const sanitizedEdges = edges.map((edge) => ({
        id: edge.id,
        source: edge.source,
        target: edge.target,
        sourceHandle: edge.sourceHandle ?? null,
        targetHandle: edge.targetHandle ?? null,
        label: edge.label ?? null,
        data: edge.data ?? null,
        style: edge.style ?? null,
        animated: !!edge.animated,
      }));

      return {
        metadata: {
          version: 1,
          exportedAt: new Date().toISOString(),
          nodeCount: sanitizedNodes.length,
          edgeCount: sanitizedEdges.length,
        },
        createDataFlow: createDataFlow ? { ...createDataFlow } : null,
        nodes: sanitizedNodes,
        edges: sanitizedEdges,
      };
    },
    [nodes, edges, createDataFlow]
  );

  const downloadFlowJson = useCallback(() => {
    const payload = buildExportPayload();
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const fileName = `data-flow-${new Date().toISOString().replace(/[:.]/g, '-')}.json`;
    const link = document.createElement('a');

    link.href = url;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }, [buildExportPayload]);

  const handleDeployRequest = useCallback(async () => {
    if (isDeploying) return;

    const payload = buildExportPayload();
    const processGroupId = createDataFlow?.processGroupId || 'root';

    setIsDeploying(true);
    try {
      const response = await deployFlow({ processGroupId, payload });
      window.dispatchEvent(new CustomEvent('dataflow:deploy:success', { detail: response }));
    } catch (error) {
      window.dispatchEvent(
        new CustomEvent('dataflow:deploy:error', {
          detail: {
            message: error?.response?.data?.message || error?.message || 'Deploy failed',
            status: error?.response?.status || null,
            payload: error?.response?.data || null,
          },
        })
      );
    } finally {
      setIsDeploying(false);
    }
  }, [buildExportPayload, createDataFlow, isDeploying]);

  useEffect(() => {
    const handleExportRequest = () => downloadFlowJson();
    window.addEventListener('dataflow:export:request', handleExportRequest);
    return () => {
      window.removeEventListener('dataflow:export:request', handleExportRequest);
    };
  }, [downloadFlowJson]);

  useEffect(() => {
    window.addEventListener('dataflow:deploy:request', handleDeployRequest);
    return () => {
      window.removeEventListener('dataflow:deploy:request', handleDeployRequest);
    };
  }, [handleDeployRequest]);

  return { buildExportPayload };
}
