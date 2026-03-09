import { ReactFlowProvider } from '@xyflow/react';
import { DnDProvider, useDnD } from './DnDContext';
import DataFlowCanvas from './DataFlowCanvas';
import useDataFlowBuilder from './useDataFlowBuilder';
import '@xyflow/react/dist/style.css';

function DnDFlowContent({ onOpenControllerServices }) {
  const [selectedProcessor, setSelectedProcessor] = useDnD();
  const flow = useDataFlowBuilder();

  return (
    <DataFlowCanvas
      processors={flow.processors}
      loading={flow.loading}
      error={flow.error}
      onOpenControllerServices={onOpenControllerServices}
      nodes={flow.nodes}
      edges={flow.edges}
      onNodesChange={flow.onNodesChange}
      onEdgesChange={flow.onEdgesChange}
      onConnect={flow.onConnect}
      onNodeDoubleClick={flow.onNodeDoubleClick}
      onDrop={(event) => flow.onDrop(event, selectedProcessor, setSelectedProcessor)}
      onDragOver={flow.onDragOver}
      nodeTypes={flow.nodeTypes}
      drawerOpen={flow.drawerOpen}
      closeModal={flow.closeModal}
      activeNode={flow.activeNode}
      configMode={flow.configMode}
      handleConfigSubmit={flow.handleConfigSubmit}
      controllerServiceOptions={flow.controllerServiceOptions}
      connectionModalOpen={flow.connectionModalOpen}
      connectionNodes={flow.connectionNodes}
      closeConnectionModal={flow.closeConnectionModal}
      applyConnection={flow.applyConnection}
    />
  );
}

export default function WrappedDnDFlow({ onOpenControllerServices }) {
  return (
    <ReactFlowProvider>
      <DnDProvider>
        <DnDFlowContent onOpenControllerServices={onOpenControllerServices} />
      </DnDProvider>
    </ReactFlowProvider>
  );
}
