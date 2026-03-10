import { useEffect, useRef, useState } from 'react';
import { Modal } from 'antd';
import { ExclamationCircleFilled } from '@ant-design/icons';
import DataFlowBar from './DataFlowBar';
import WrappedDnDFlow from '../Context/DnDFlow';
import ControllerServicesPage from './../Nodes/ControllerServicesPage';
import ConfigureDataFlowModal from './ConfigureDataFlowModal';
import DataFlowMonitorPage from './DataFlowMonitorPage';
import config from '../../../constants/config';
import {
  applyCreateDataFlow,
  CREATE_DATA_FLOW_REQUEST_EVENT,
} from '../Context/createDataFlowEvents';
import { editFlow } from '../../../services/DataMonitor/editFlow';
import { restoreFlow } from '../../../services/DataMonitor/restoreFlow';
// import TopToolBar from './TopToolBar';

const pickFirst = (...values) => values.find((value) => value !== undefined && value !== null && value !== '');

const DashboardLayout = () => {
  const [page, setPage] = useState('monitor');
  const [configureModalOpen, setConfigureModalOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [createDataFlow, setCreateDataFlow] = useState(null);
  const [initialFlowDefinition, setInitialFlowDefinition] = useState(null);
  const [pendingInitialSave, setPendingInitialSave] = useState(null);
  const saveErrorModalRef = useRef(null);
  const createDataFlowRef = useRef(createDataFlow);

  useEffect(() => {
    const handleCreateRequest = () => {
      setConfigureModalOpen(true);
    };

    window.addEventListener(CREATE_DATA_FLOW_REQUEST_EVENT, handleCreateRequest);
    return () => {
      window.removeEventListener(CREATE_DATA_FLOW_REQUEST_EVENT, handleCreateRequest);
    };
  }, []);

  useEffect(() => {
    createDataFlowRef.current = createDataFlow;
  }, [createDataFlow]);

  useEffect(() => {
    if (page !== 'flow' || !pendingInitialSave) return;

    const timer = setTimeout(() => {
      window.dispatchEvent(
        new CustomEvent('dataflow:save:request', {
          detail: { payloadOverride: pendingInitialSave },
        })
      );
      setPendingInitialSave(null);
    }, 0);

    return () => clearTimeout(timer);
  }, [page, pendingInitialSave]);

  useEffect(() => {
    const handleSaveError = (event) => {
      const errorMessage = event?.detail?.message || 'Save failed';
      const normalizedMessage = String(errorMessage).toLowerCase();
      const isAlreadyExists = normalizedMessage.includes('already exists');
      if (!isAlreadyExists) return;

      const title = normalizedMessage.includes('already exists')
        ? 'Flow already exists'
        : 'Unable to save flow';

      if (saveErrorModalRef.current) {
        saveErrorModalRef.current.destroy();
        saveErrorModalRef.current = null;
      }

      saveErrorModalRef.current = Modal.confirm({
        className: 'save-flow-confirm-modal',
        rootClassName: 'save-flow-confirm-modal',
        title,
        icon: <ExclamationCircleFilled className="save-flow-confirm-modal__icon" />,
        content: <div className="save-flow-confirm-modal__message">{errorMessage}</div>,
        okText: 'Yes',
        cancelText: 'No',
        okButtonProps: { className: 'save-flow-confirm-modal__btn save-flow-confirm-modal__btn--ok' },
        cancelButtonProps: {
          className: 'save-flow-confirm-modal__btn save-flow-confirm-modal__btn--cancel',
        },
        centered: true,
        width: 640,
        maskClosable: false,
        onOk: async () => {
          const currentCreateDataFlow = createDataFlowRef.current;
          const tenantCode = pickFirst(currentCreateDataFlow?.tenantCode, config?.tenantCode);
          const processGroupName = pickFirst(
            currentCreateDataFlow?.processGroup,
            currentCreateDataFlow?.processGroupName
          );

          await restoreFlow({ tenantCode, processGroupName });
          const flowDefinition = await editFlow(processGroupName);

          setCreateDataFlow(flowDefinition?.createDataFlow || currentCreateDataFlow || null);
          setInitialFlowDefinition(flowDefinition || null);
          setPage('flow');

          saveErrorModalRef.current = null;
        },
        onCancel: () => {
          saveErrorModalRef.current = null;
        },
        afterClose: () => {
          saveErrorModalRef.current = null;
        },
      });
    };

    window.addEventListener('dataflow:save:error', handleSaveError);
    return () => {
      window.removeEventListener('dataflow:save:error', handleSaveError);
      if (saveErrorModalRef.current) {
        saveErrorModalRef.current.destroy();
        saveErrorModalRef.current = null;
      }
    };
  }, []);

  const handleCreateApply = (payload) => {
    setCreateDataFlow(payload);
    setInitialFlowDefinition(null);
    applyCreateDataFlow(payload);
    setConfigureModalOpen(false);
    setPendingInitialSave({
      metadata: {
        version: 1,
        exportedAt: new Date().toISOString(),
        nodeCount: 0,
        edgeCount: 0,
      },
      createDataFlow: payload ? { ...payload } : null,
      nodes: [],
      edges: [],
    });
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
