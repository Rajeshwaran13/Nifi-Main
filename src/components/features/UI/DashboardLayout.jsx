import { useEffect, useState } from 'react';
import DataFlowBar from './DataFlowBar';
import WrappedDnDFlow from '../Context/DnDFlow';
import ControllerServicesPage from './../Nodes/ControllerServicesPage';
import ConfigureDataFlowModal from './ConfigureDataFlowModal';
import DataFlowMonitorPage from './DataFlowMonitorPage';
import {
  applyCreateDataFlow,
  CREATE_DATA_FLOW_REQUEST_EVENT,
} from '../Context/createDataFlowEvents';
import { editFlow } from '../../../services/DataMonitor/editFlow';
// import TopToolBar from './TopToolBar';

const DashboardLayout = () => {
  const [page, setPage] = useState('monitor');
  const [configureModalOpen, setConfigureModalOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [createDataFlow, setCreateDataFlow] = useState(null);
  const [initialFlowDefinition, setInitialFlowDefinition] = useState(null);

  useEffect(() => {
    const handleCreateRequest = () => {
      setConfigureModalOpen(true);
    };

    window.addEventListener(CREATE_DATA_FLOW_REQUEST_EVENT, handleCreateRequest);
    return () => {
      window.removeEventListener(CREATE_DATA_FLOW_REQUEST_EVENT, handleCreateRequest);
    };
  }, []);

  const handleCreateApply = (payload) => {
    setCreateDataFlow(payload);
    setInitialFlowDefinition(null);
    applyCreateDataFlow(payload);
    setConfigureModalOpen(false);
    setPage('flow');
  };

  const handleEditFlow = async (row) => {
    const processGroupName = row?.processGroupName;
    if (!processGroupName) return;

    try {
      const flowDefinition = await editFlow(processGroupName);

      setCreateDataFlow(flowDefinition?.createDataFlow || null);
      setInitialFlowDefinition(flowDefinition);
      setPage('flow');
    } catch (error) {
      window.dispatchEvent(
        new CustomEvent('dataflow:edit:error', {
          detail: {
            message: error?.response?.data?.message || error?.message || 'Failed to load flow',
          },
        })
      );
    }
  };

  return (
    <div style={pageStyle}>
      <div style={rightPaneStyle}>
        {page === 'monitor' ? (
          <>
            <DataFlowMonitorPage
              search={search}
              onSearchChange={setSearch}
              onCreate={() => setConfigureModalOpen(true)}
              onEdit={handleEditFlow}
            />
            <ConfigureDataFlowModal
              open={configureModalOpen}
              onClose={() => setConfigureModalOpen(false)}
              onApply={handleCreateApply}
            />
          </>
        ) : page === 'flow' ? (
          <>
            <DataFlowBar showSearch={false} showCreate={false} onBack={() => setPage('monitor')} />
            <div style={canvasStyle}>
              <WrappedDnDFlow
                onOpenControllerServices={() => setPage('controller-services')}
                initialCreateDataFlow={createDataFlow}
                initialFlowDefinition={initialFlowDefinition}
              />
            </div>
            <ConfigureDataFlowModal
              open={configureModalOpen}
              onClose={() => setConfigureModalOpen(false)}
              onApply={handleCreateApply}
            />
          </>
        ) : (
          <ControllerServicesPage onBack={() => setPage('flow')} />
        )}
      </div>
    </div>
  );
};

export default DashboardLayout;

const pageStyle = {
  width: '100vw',
  height: '100vh',
  display: 'flex',
  flexDirection: 'column',
  backgroundColor: '#262626',
  overflow: 'hidden',
};

const rightPaneStyle = {
  flex: 1,
  display: 'flex',
  flexDirection: 'column',
  minHeight: 0,
};

const canvasStyle = {
  flex: 1,
  background: '#1f1f1f',
  minHeight: 0,
};
