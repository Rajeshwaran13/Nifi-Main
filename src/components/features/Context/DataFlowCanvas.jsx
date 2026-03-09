import { Background, Controls, ReactFlow } from '@xyflow/react';
import Sidebar from '../Sidebar/Sidebar';
import NodeConfigModal from './NodeConfigModal';
import ConnectionConfigModal from '../Nodes/ConnectionConfigModal';

export default function DataFlowCanvas({
  processors,
  loading,
  error,
  onOpenControllerServices,
  nodes,
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
}) {
  return (
    <div style={rootStyle}>
      <Sidebar
        processors={processors}
        loading={loading}
        error={error}
        onOpenControllerServices={onOpenControllerServices}
      />

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
      <ConnectionConfigModal
        open={connectionModalOpen}
        fromNode={connectionNodes.from}
        toNode={connectionNodes.to}
        onCancel={closeConnectionModal}
        onApply={applyConnection}
      />
    </div>
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
