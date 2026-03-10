import { useCallback, useEffect, useMemo, useState } from 'react';
import { addEdge, useEdgesState, useNodesState, useReactFlow } from '@xyflow/react';
import { FlowNode } from '../Nodes/FlowNode';
import { fetchControllerServiceOptions } from '../../../services/Contoller_services/controllerServiceTypesService';
import { isCreateDataFlowDragItem, requestCreateDataFlow } from './createDataFlowEvents';
import {
  applyProcessGroupToNodeData,
  buildNodeData,
  getConnectionColor,
  hasControllerServiceField,
  initialNodes,
  isStreamReceiverNodeData,
  toControllerServiceIdConfig,
} from './dndFlowUtils';

const normalizeToken = (value) =>
  String(value || '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '');

const getNextNodeId = (nodes = []) =>
  nodes.reduce((maxId, node) => {
    const matched = String(node?.id || '').match(/dndnode_(\d+)/i);
    if (!matched) return maxId;
    return Math.max(maxId, Number(matched[1]) + 1);
  }, 0);

const hydrateImportedNodes = (nodes = [], processors = []) =>
  (nodes || []).map((node) => {
    const nodeData = node?.data || {};
    const matchedProcessor = (processors || []).find((processor) => {
      const processorName = normalizeToken(processor?.processorName);
      const processorAlias = normalizeToken(processor?.nodeName);
      const nodeProcessorName = normalizeToken(nodeData?.processorName);
      const nodeLabel = normalizeToken(nodeData?.label);

      return (
        (processorName && processorName === nodeProcessorName) ||
        (processorAlias && processorAlias === nodeLabel)
      );
    });

    if (!matchedProcessor) {
      return {
        ...node,
        data: {
          handleColor: '#06b6b0',
          ...nodeData,
        },
      };
    }

    const processorData = buildNodeData(matchedProcessor);
    const importedPorts = nodeData.ports || {};
    const processorPorts = processorData.ports || {};
    const mergedPorts = {
      ...processorPorts,
      ...importedPorts,
      relationships:
        Array.isArray(importedPorts.relationships) && importedPorts.relationships.length > 0
          ? importedPorts.relationships
          : processorPorts.relationships || [],
    };

    return {
      ...node,
      type: node?.type || 'processorNode',
      data: {
        ...processorData,
        ...nodeData,
        config: {
          ...(processorData.config || {}),
          ...(nodeData.config || {}),
        },
        schema:
          Array.isArray(nodeData.schema) && nodeData.schema.length > 0
            ? nodeData.schema
            : processorData.schema,
        ports: mergedPorts,
        relationships: mergedPorts.relationships,
        handleColor: nodeData.handleColor || processorData.handleColor || '#06b6b0',
      },
    };
  });

export default function useFlowInteractions(createDataFlow, initialFlowDefinition, processors) {
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const { screenToFlowPosition } = useReactFlow();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [configMode, setConfigMode] = useState('drawer');
  const [activeNode, setActiveNode] = useState(null);
  const [pendingConnection, setPendingConnection] = useState(null);
  const [connectionModalOpen, setConnectionModalOpen] = useState(false);
  const [connectionNodes, setConnectionNodes] = useState({ from: null, to: null });
  const [nextNodeId, setNextNodeId] = useState(0);
  const [controllerServiceOptions, setControllerServiceOptions] = useState([]);
  const [isLoadingControllerServices, setIsLoadingControllerServices] = useState(false);

  const nodeTypes = useMemo(() => ({ processorNode: FlowNode }), []);

  const closeConnectionModal = useCallback(() => {
    setConnectionModalOpen(false);
    setPendingConnection(null);
    setConnectionNodes({ from: null, to: null });
  }, []);

  const closeModal = useCallback(() => {
    setDrawerOpen(false);
    setActiveNode(null);
  }, []);

  const onConnect = useCallback(
    (params) => {
      const fromNode = nodes.find((node) => node.id === params.source);
      const toNode = nodes.find((node) => node.id === params.target);
      setPendingConnection(params);
      setConnectionNodes({ from: fromNode || null, to: toNode || null });
      setConnectionModalOpen(true);
    },
    [nodes]
  );

  const applyConnection = useCallback(
    (relationship) => {
      if (!pendingConnection) return;

      const normalizedRelationship = String(relationship || '').trim().toLowerCase();
      const edgeColor = getConnectionColor(normalizedRelationship);
      const { source, target } = pendingConnection;

      setEdges((items) =>
        addEdge(
          {
            ...pendingConnection,
            label: normalizedRelationship,
            data: { relationship: normalizedRelationship },
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
        items.map((node) =>
          node.id !== source && node.id !== target
            ? node
            : { ...node, data: { ...node.data, handleColor: edgeColor } }
        )
      );

      closeConnectionModal();
    },
    [pendingConnection, setEdges, setNodes, closeConnectionModal]
  );

  const onDragOver = useCallback((event) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  }, []);

  const ensureControllerServicesLoaded = useCallback(async () => {
    if (isLoadingControllerServices) return;
    setIsLoadingControllerServices(true);
    try {
      setControllerServiceOptions(await fetchControllerServiceOptions());
    } finally {
      setIsLoadingControllerServices(false);
    }
  }, [isLoadingControllerServices]);

  const onDrop = useCallback(
    (event, selectedProcessor, setSelectedProcessor) => {
      event.preventDefault();
      if (!selectedProcessor) return;

      const dropPosition = screenToFlowPosition({ x: event.clientX, y: event.clientY });

      if (!isCreateDataFlowDragItem(selectedProcessor)) {
        setNodes((items) =>
          items.concat({
            id: `dndnode_${nextNodeId}`,
            type: 'processorNode',
            position: dropPosition,
            data: applyProcessGroupToNodeData(
              buildNodeData(selectedProcessor),
              createDataFlow?.processGroup,
              true
            ),
          })
        );
        setNextNodeId((prev) => prev + 1);
        return;
      }

      requestCreateDataFlow({ dropPosition });
      setSelectedProcessor(null);
    },
    [screenToFlowPosition, nextNodeId, createDataFlow, setNodes]
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

  const handleConfigSubmit = useCallback(
    (values) => {
      if (!activeNode) return;

      const mergedConfig = {
        ...activeNode.data?.config,
        ...toControllerServiceIdConfig(
          activeNode.data?.schema,
          values,
          controllerServiceOptions
        ),
      };

      window.dispatchEvent(
        new CustomEvent('dataflow:configure:apply', {
          detail: {
            processorId: activeNode.data?.processorName,
            nodeName: activeNode.data?.label,
            processorType: activeNode.data?.processorType,
            config: mergedConfig,
            dropPosition: activeNode.position || null,
          },
        })
      );

      setNodes((items) =>
        items.map((node) =>
          node.id !== activeNode.id
            ? node
            : { ...node, data: { ...node.data, label: values.label || node.data.label, config: mergedConfig } }
        )
      );

      closeModal();
    },
    [activeNode, controllerServiceOptions, setNodes, closeModal]
  );

  useEffect(() => {
    if (!initialFlowDefinition) return;

    const importedNodes = hydrateImportedNodes(initialFlowDefinition.nodes, processors);
    const importedEdges = Array.isArray(initialFlowDefinition.edges) ? initialFlowDefinition.edges : [];

    setNodes(importedNodes);
    setEdges(importedEdges);
    setNextNodeId(getNextNodeId(importedNodes));
    setDrawerOpen(false);
    setActiveNode(null);
    setPendingConnection(null);
    setConnectionModalOpen(false);
    setConnectionNodes({ from: null, to: null });
  }, [initialFlowDefinition, processors, setEdges, setNodes]);

  return {
    nodes,
    setNodes,
    edges,
    onNodesChange,
    onEdgesChange,
    onConnect,
    onNodeDoubleClick,
    onDrop,
    onDragOver,
    nodeTypes,
    drawerOpen,
    closeModal,
    activeNode,
    configMode,
    handleConfigSubmit,
    controllerServiceOptions,
    connectionModalOpen,
    connectionNodes,
    closeConnectionModal,
    applyConnection,
  };
}
