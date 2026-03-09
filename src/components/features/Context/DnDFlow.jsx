import { useCallback, useEffect, useMemo, useState } from 'react';
import { ReactFlow, ReactFlowProvider,addEdge,useEdgesState,useNodesState,Controls,useReactFlow,Background,} from '@xyflow/react';
import { DnDProvider, useDnD } from './DnDContext';
import Sidebar from '../Sidebar/Sidebar';
import NodeConfigModal from './NodeConfigModal';

import { FlowNode } from '../Nodes/FlowNode';
import { useProcessorCatalog } from '../../../hooks/Data_Fetching/useProcessorCatalog';
import { deployFlow } from '../../../services/deployService';
import { fetchControllerServiceOptions } from '../../../services/Contoller_services/controllerServiceTypesService';
import {
  CREATE_DATA_FLOW_APPLY_EVENT,
  isCreateDataFlowDragItem,
  requestCreateDataFlow,
} from './createDataFlowEvents';
import '@xyflow/react/dist/style.css';

const initialNodes = [];
const normalizeKey = (value) =>
  String(value || '')
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '');

const findGroupIdFieldName = (schema = [], config = {}) => {
  const configKey = Object.keys(config || {}).find((key) => normalizeKey(key) === 'groupid');
  if (configKey) return configKey;

  const schemaField = (schema || []).find(
    (field) =>
      normalizeKey(field?.name) === 'groupid' || normalizeKey(field?.label) === 'groupid'
  );
  if (schemaField?.name) return schemaField.name;
  return 'Group ID';
};

const isStreamReceiverNodeData = (data = {}) => {
  const processorName = normalizeKey(data?.processorName);
  const label = normalizeKey(data?.label);
  if (processorName.includes('consumekafka') || label.includes('streamreceiver')) {
    return true;
  }

  const hasGroupIdField = (data?.schema || []).some(
    (field) =>
      normalizeKey(field?.name) === 'groupid' || normalizeKey(field?.label) === 'groupid'
  );
  return hasGroupIdField;
};

const applyProcessGroupToNodeData = (data, processGroup, forceOverride = false) => {
  if (!data || !processGroup) return data;
  if (!isStreamReceiverNodeData(data)) return data;

  const nextConfig = { ...(data.config || {}) };
  const groupIdField = findGroupIdFieldName(data.schema, nextConfig);
  const existing = nextConfig[groupIdField];

  if (forceOverride || existing === undefined || existing === null || existing === '') {
    nextConfig[groupIdField] = processGroup;
  }

  return {
    ...data,
    config: nextConfig,
  };
};

const buildNodeData = (processor) => ({
  label: processor.nodeName,
  processorName: processor.processorName,
  processorType: processor.processorType,
  schema: processor.schema,
  ports: processor.ports,
  nodeColor: processor.nodeColor || '#3f3f3f',
  borderColor: processor.borderColor || '#898989',
  textColor: processor.textColor || '#ffffff',
  handleColor: processor.handleColor || '#06b6b0',
  config: { ...processor.defaultValues },
});

const hasConfigValue = (value) => value !== undefined && value !== null && value !== '';
const normalizeEnumOption = (option) => {
  if (option && typeof option === 'object' && !Array.isArray(option)) {
    return {
      label: option.label ?? option.value ?? '',
      value: option.value ?? option.label ?? '',
    };
  }

  return { label: option, value: option };
};

const toEnumValueFromLabel = (field, rawValue) => {
  const matched = (field?.options || [])
    .map(normalizeEnumOption)
    .find((opt) => String(opt.label || '').toLowerCase() === String(rawValue || '').toLowerCase());

  if (matched?.value !== undefined && matched?.value !== null && matched?.value !== '') {
    return matched.value;
  }

  return rawValue;
};

const buildExportConfig = (schema = [], config = {}) => {
  const nextConfig = { ...(config || {}) };

  schema.forEach((field) => {
    const name = field?.name;
    if (!name) return;

    if (!hasConfigValue(nextConfig[name])) {
      nextConfig[name] = field?.defaultValue ?? '';
    }

    if (field?.type === 'enum' && hasConfigValue(nextConfig[name])) {
      nextConfig[name] = toEnumValueFromLabel(field, nextConfig[name]);
    }
  });

  return nextConfig;
};

const hasControllerServiceField = (schema = []) =>
  (schema || []).some((field) => field?.type === 'controllerService');

const toControllerServiceIdConfig = (schema = [], values = {}, controllerServiceOptions = []) => {
  const next = { ...(values || {}) };

  (schema || []).forEach((field) => {
    if (field?.type !== 'controllerService') return;
    const selected = next[field.name];
    if (!selected) return;

    const selectedAsText = String(selected).toLowerCase();
    const matchedByName = controllerServiceOptions.find(
      (item) => String(item.label || '').toLowerCase() === selectedAsText
    );

    if (matchedByName?.value) {
      next[field.name] = matchedByName.value;
    }
  });

  return next;
};

const DnDFlow = ({ onOpenControllerServices }) => {
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const { screenToFlowPosition } = useReactFlow();
  const [selectedProcessor, setSelectedProcessor] = useDnD();
  const { processors, loading, error } = useProcessorCatalog();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [configMode, setConfigMode] = useState('drawer');
  const [activeNode, setActiveNode] = useState(null);
  const [nextNodeId, setNextNodeId] = useState(0);
  const [createDataFlow, setCreateDataFlow] = useState(null);
  const [isDeploying, setIsDeploying] = useState(false);
  const [controllerServiceOptions, setControllerServiceOptions] = useState([]);
  const [isLoadingControllerServices, setIsLoadingControllerServices] = useState(false);


  //whenever if we are seeing processor node flownode will render
  const nodeTypes = useMemo(() => ({ processorNode: FlowNode }), []);

  const onConnect = useCallback(
    (params) => {
      const edgeColor = '#06b6b0';
      const relationship = 'success';
      const { source, target } = params;

      setEdges((items) =>
        addEdge(
          {
            ...params,
            label: relationship,
            data: { relationship },
            style: {
              stroke: edgeColor,
              strokeWidth: 2.5,
              strokeLinecap: 'round',
              strokeLinejoin: 'round',
            },
          },
          items
        )
      );

      setNodes((items) =>
        items.map((node) => {
          if (node.id !== source && node.id !== target) return node;
          return {
            ...node,
            data: {
              ...node.data,
              handleColor: edgeColor,
            },
          };
        })
      );
    },
    [setEdges, setNodes]
  );

  const onDragOver = useCallback((event) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  }, []);

  const ensureControllerServicesLoaded = useCallback(async () => {
    if (isLoadingControllerServices) return;
    setIsLoadingControllerServices(true);
    try {
      const options = await fetchControllerServiceOptions();
      setControllerServiceOptions(options);
    } catch (error) {
      console.error('Failed to load controller service options for node config.', {
        status: error?.response?.status,
        payload: error?.response?.data,
      });
    } finally {
      setIsLoadingControllerServices(false);
    }
  }, [isLoadingControllerServices]);

  useEffect(() => {
    const handleCreateDataFlowApply = (event) => {
      const detail = event?.detail || null;
      setCreateDataFlow(detail);

      const processGroup = detail?.processGroup;
      if (!processGroup) return;

      setNodes((items) =>
        items.map((node) => ({
          ...node,
          data: applyProcessGroupToNodeData(node.data, processGroup),
        }))
      );
    };

    window.addEventListener(CREATE_DATA_FLOW_APPLY_EVENT, handleCreateDataFlowApply);
    return () => {
      window.removeEventListener(CREATE_DATA_FLOW_APPLY_EVENT, handleCreateDataFlowApply);
    };
  }, [setNodes]);

  
  const onDrop = useCallback(
    (event) => {
      event.preventDefault();
      if (!selectedProcessor) return;

      const dropPosition = screenToFlowPosition({
        x: event.clientX,
        y: event.clientY,
      });

      if (!isCreateDataFlowDragItem(selectedProcessor)) {
        const seededNodeData = applyProcessGroupToNodeData(
          buildNodeData(selectedProcessor),
          createDataFlow?.processGroup,
          true
        );

        const newNode = {
          id: `dndnode_${nextNodeId}`,
          type: 'processorNode',
          position: dropPosition,
          data: seededNodeData,
        };
        setNodes((items) => items.concat(newNode));
        setNextNodeId((prev) => prev + 1);
        return;
      }

      requestCreateDataFlow({ dropPosition });
      setSelectedProcessor(null);
    },
    [screenToFlowPosition, selectedProcessor, setNodes, setSelectedProcessor, nextNodeId, createDataFlow]
  );

  const onNodeDoubleClick = useCallback(
    async (_, node) => {
      if (isCreateDataFlowDragItem(node?.data)) return;

      if (isStreamReceiverNodeData(node?.data) || hasControllerServiceField(node?.data?.schema)) {
        await ensureControllerServicesLoaded();
      }

      setActiveNode(node);
      setConfigMode('drawer');
      setDrawerOpen(true);
    },
    [ensureControllerServicesLoaded]
  );

  const closeModal = () => {
    setDrawerOpen(false);
    setActiveNode(null);
  };

  const handleConfigSubmit = useCallback(
    (values) => {
      if (!activeNode) return;

      const configuredPayload = {
        processorId: activeNode.data?.processorName,
        nodeName: activeNode.data?.label,
        processorType: activeNode.data?.processorType,
        config: {
          ...activeNode.data?.config,
          ...toControllerServiceIdConfig(
            activeNode.data?.schema,
            values,
            controllerServiceOptions
          ),
        },
        dropPosition: activeNode.position || null,
      };

      // Hook for future page navigation/workflow continuation.
      window.dispatchEvent(
        new CustomEvent('dataflow:configure:apply', { detail: configuredPayload })
      );

      setNodes((items) =>
        items.map((node) => {
          if (node.id !== activeNode.id) return node;
          return {
            ...node,
            data: {
              ...node.data,
              label: values.label || node.data.label,
              config: {
                ...node.data.config,
                ...toControllerServiceIdConfig(
                  node.data?.schema,
                  values,
                  controllerServiceOptions
                ),
              },
            },
          };
        })
      );

      closeModal();
    },
    [activeNode, controllerServiceOptions, setNodes]
  );

  const buildExportPayload = useCallback(() => {
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
  }, [nodes, edges, createDataFlow]);

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
    const handleExportRequest = () => {
      downloadFlowJson();
    };

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

  return (
    <div style={rootStyle}>
      <Sidebar processors={processors} loading={loading} error={error} 
       onOpenControllerServices={onOpenControllerServices}/>

      <div style={flowPaneStyle}>
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          onNodeDoubleClick={onNodeDoubleClick}
          onDrop={onDrop}
          onDragOver={onDragOver}
          nodeTypes={nodeTypes}
        // fitView
        >
          <Controls />
          <Background color="#857d7d" gap={20} size={1} />
        </ReactFlow>
      </div>

      <NodeConfigModal
        open={drawerOpen}
        onClose={closeModal}
        node={activeNode}
        mode={configMode}
        onSubmit={handleConfigSubmit}
        controllerServiceOptions={controllerServiceOptions}
      />

    </div>
  );
};

export default function WrappedDnDFlow({ onOpenControllerServices }) {
  return (
    <ReactFlowProvider>
      <DnDProvider>
        <DnDFlow onOpenControllerServices={onOpenControllerServices}/>
      </DnDProvider>
    </ReactFlowProvider>
  );
}

const rootStyle = {
  width: '100%',
  height: '100%',
  display: 'flex',
  overflow: 'hidden',
  background: '#1f1f1f',
  position: 'relative',
};

const flowPaneStyle = {
  flex: 1,
  minWidth: 0,
  height: '100%',
};
