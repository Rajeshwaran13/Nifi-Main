import { useEffect, useState } from 'react';
import DataFlowBar from './DataFlowBar';
import WrappedDnDFlow from '../Context/DnDFlow';
import ControllerServicesPage from './../Nodes/ControllerServicesPage';
import ConfigureDataFlowModal from './ConfigureDataFlowModal';
import {
  applyCreateDataFlow,
  CREATE_DATA_FLOW_REQUEST_EVENT,
} from '../Context/createDataFlowEvents';
// import TopToolBar from './TopToolBar';

const DashboardLayout = () => {
  const [page, setPage] = useState('flow');
  const [configureModalOpen, setConfigureModalOpen] = useState(false);

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
    applyCreateDataFlow(payload);
    setConfigureModalOpen(false);
  };

  return (
    <div style={pageStyle}>
      <div style={rightPaneStyle}>
        {page === 'flow' ? (
          <>
            <DataFlowBar />
            <div style={canvasStyle}>
              <WrappedDnDFlow onOpenControllerServices={() => setPage('controller-services')} />
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
