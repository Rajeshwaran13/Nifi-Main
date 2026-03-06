import { useMemo, useState } from 'react';
import { DeleteOutlined, EyeOutlined, LeftOutlined, SearchOutlined, SyncOutlined } from '@ant-design/icons';
import { Button, Modal, Switch, message } from 'antd';
import {
  deleteControllerService,
  fetchControllerServiceById,
  fetchControllerServiceTypes,
  normalizeControllerServiceRows,
  updateControllerServiceState,
} from '../../../services/Contoller_services/controllerServiceTypesService';

export default function ControllerServicesPage({ onBack }) {
  const [searchText, setSearchText] = useState('');
  const [rows, setRows] = useState([]);
  const [isSyncing, setIsSyncing] = useState(false);
  const [hasSynced, setHasSynced] = useState(false);
  const [syncError, setSyncError] = useState('');
  const [togglingKey, setTogglingKey] = useState('');
  const [deletingKey, setDeletingKey] = useState('');
  const [viewingKey, setViewingKey] = useState('');
  const [isViewOpen, setIsViewOpen] = useState(false);
  const [selectedServiceName, setSelectedServiceName] = useState('');
  const [propertyRows, setPropertyRows] = useState([]);

  const syncControllerServices = async () => {
    setIsSyncing(true);
    setHasSynced(true);
    setSyncError('');
    try {
      const responseData = await fetchControllerServiceTypes();
      setRows(normalizeControllerServiceRows(responseData));
    } catch (error) {
      setRows([]);
      setSyncError('Unable to load controller services from API. Please try Sync again.');
      console.error('Failed to fetch controller service types.', {
        status: error?.response?.status,
        payload: error?.response?.data,
      });
    } finally {
      setIsSyncing(false);
    }
  };

  const filteredRows = useMemo(() => {
    if (!searchText.trim()) {
      return rows;
    }
    const query = searchText.toLowerCase();
    return rows.filter((row) =>
      row.name.toLowerCase().includes(query) || row.type.toLowerCase().includes(query),
    );
  }, [rows, searchText]);

  const onToggleRow = async (key, checked) => {
    const selectedRow = rows.find((row) => row.key === key);
    if (!selectedRow?.controllerServiceId) {
      
      return;
    }

    const action = checked ? 'ENABLED' : 'DISABLED';
    setTogglingKey(key);

    setRows((prevRows) =>
      prevRows.map((row) => (row.key === key ? { ...row, enabled: checked } : row)),
    );

    try {
      await updateControllerServiceState({
        controllerServiceId: selectedRow.controllerServiceId,
        action,
      });
    } catch (error) {
      setRows((prevRows) =>
        prevRows.map((row) => (row.key === key ? { ...row, enabled: !checked } : row)),
      );
      
      console.error('Toggle update failed:', {
        controllerServiceId: selectedRow.controllerServiceId,
        action,
        status: error?.response?.status,
        payload: error?.response?.data,
      });
    } finally {
      setTogglingKey('');
    }
  };

  const onDeleteRow = async (row) => {
    if (row.enabled || !row.controllerServiceId) {
      return;
    }

    setDeletingKey(row.key);
    try {
      await deleteControllerService(row.controllerServiceId);
      setRows((prevRows) => prevRows.filter((item) => item.key !== row.key));
    } catch (error) {
      
      console.error('Delete controller service failed:', {
        controllerServiceId: row.controllerServiceId,
        status: error?.response?.status,
        payload: error?.response?.data,
      });
    } finally {
      setDeletingKey('');
    }
  };

  const toPropertyRows = (responseData) => {
    try {
      const propertiesSource =responseData?.properties ||responseData?.component?.properties ||responseData?.controllerService?.properties ||responseData?.data?.properties || {};

      if (Array.isArray(propertiesSource)) {
        return propertiesSource.map((item, index) => ({
          key: item?.key || `property-${index}`,
          value: item?.value ?? '',
        }));
      }

      if (propertiesSource && typeof propertiesSource === 'object') {
        return Object.entries(propertiesSource).map(([key, value]) => ({
          key,
          value:value === null || value === undefined ? '' : typeof value === 'object' ? JSON.stringify(value)  : String(value),
        }));
      }

      return [];
    } catch (error) {
      console.error('Failed to normalize controller service properties.', error);
      return [];
    }
  };

  const onViewRow = async (row) => {
    if (!row.controllerServiceId) {
      return;
    }

    setViewingKey(row.key);
    try {
      const responseData = await fetchControllerServiceById(row.controllerServiceId);
      const normalizedRows = toPropertyRows(responseData);
      setSelectedServiceName(row.name);
      setPropertyRows(normalizedRows);
      setIsViewOpen(true);
    } catch (error) {
      message.error('Failed to load controller service properties.');
      console.error('Fetch controller service properties failed:', {
        controllerServiceId: row.controllerServiceId,
        status: error?.response?.status,
        payload: error?.response?.data,
      });
    } finally {
      setViewingKey('');
    }
  };

  return (
    <div style={{ height: '100%', background: '#262626', color: '#fff' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 16px', borderBottom: '1px solid #4a4a4a' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 25, fontWeight: 700 }}>
          <LeftOutlined onClick={onBack} style={{ cursor: 'pointer', fontSize: 24 }} />
          <span>Controller Services</span>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <div style={{ display: 'flex', alignItems: 'center', background: '#404040', padding: '6px 10px', minWidth: 230 }}>
            <SearchOutlined style={{ color: '#cfcfcf', marginRight: 8 }} />
            <input
              value={searchText}
              onChange={(event) => setSearchText(event.target.value)}
              placeholder="Search Name/Type"
              style={{ background: 'transparent', border: 0, outline: 0, color: '#fff', width: '100%' }}
            />
          </div>
          <Button
            onClick={syncControllerServices}
            loading={isSyncing}
            type="primary"
            style={{ background: '#06b6b0', borderColor: '#06b6b0', minWidth: 90 }}
          >
            Sync
          </Button>
        </div>
      </div>

      <div style={{ padding: '14px 16px' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: '#1f1f1f', color: '#fff' }}>
              <th style={{ textAlign: 'left', padding: '10px 12px', width: 80 }}>Sl.No</th>
              <th style={{ textAlign: 'left', padding: '10px 12px' }}>Name</th>
              <th style={{ textAlign: 'left', padding: '10px 12px' }}>Type</th>
              <th style={{ textAlign: 'center', padding: '10px 12px', width: 170 }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredRows.length > 0 ? (
              filteredRows.map((row, index) => (
                <tr key={row.key} style={{ background: '#4a4a4a', borderTop: '1px solid #3b3b3b' }}>
                  <td style={{ padding: '10px 12px' }}>{index + 1}</td>
                  <td style={{ padding: '10px 12px' }}>{row.name}</td>
                  <td style={{ padding: '10px 12px' }}>{row.type}</td>
                  <td style={{ padding: '10px 12px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12 }}>
                      <Switch
                        size="small"
                        checked={row.enabled}
                        disabled={togglingKey === row.key}
                        onChange={(checked) => onToggleRow(row.key, checked)}
                        style={row.enabled ? { backgroundColor: '#06b6b0' } : undefined}
                      />
                      <Button
                        type="text"
                        size="small"
                        loading={viewingKey === row.key}
                        onClick={() => onViewRow(row)}
                        style={{ color: '#fff' }}
                        icon={<EyeOutlined />}
                      />
                      <Button
                        type="text"
                        size="small"
                        disabled={row.enabled || deletingKey === row.key}
                        loading={deletingKey === row.key}
                        onClick={() => onDeleteRow(row)}
                        style={{
                          color: row.enabled ? '#ffffff' : '#ffffff',
                          backgroundColor: row.enabled ? 'transparent' : '#ffffff',
                          // border: '1px solid #ffffff',
                          opacity: row.enabled ? 0.2 : 1,
                          borderRadius: 4,
                        }}
                        icon={<DeleteOutlined style={{ color: row.enabled ? '#ffffff' : '#d1d5db' }} />}
                      />
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr style={{ background: 'rgba(79, 79, 79, 0.996)' }}>
                <td colSpan={4} style={{ textAlign: 'center', padding: '16px 12px', color: 'rgba(0, 0, 0, 1)' }}>
                  {isSyncing
                    ? 'Syncing controller services...'
                    : syncError || (hasSynced ? 'No controller services returned from API.' : 'Click Sync to load controller services')}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <Modal
        title={`Controller Properties${selectedServiceName ? ` - ${selectedServiceName}` : ''}`}
        open={isViewOpen}
        onCancel={() => setIsViewOpen(false)}
        footer={null}
        width={760}
        styles={{
          content: { background: '#262626', color: '#fff' },
          header: { background: '#262626', color: '#fff', borderBottom: '1px solid #4a4a4a' },
          body: { background: '#262626', color: '#fff' },
        }}
      >
        <div style={{ maxHeight: 420, overflowY: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#1f1f1f' }}>
                <th style={{ textAlign: 'left', padding: '8px 10px', borderBottom: '1px solid #4a4a4a', color: '#fff' }}>Key</th>
                <th style={{ textAlign: 'left', padding: '8px 10px', borderBottom: '1px solid #4a4a4a', color: '#fff' }}>Value</th>
              </tr>
            </thead>
            <tbody>
              {propertyRows.length > 0 ? (
                propertyRows.map((item) => (
                  <tr key={item.key} style={{ background: '#333' }}>
                    <td style={{ padding: '8px 10px', borderBottom: '1px solid #4a4a4a', color: '#fff', whiteSpace: 'nowrap' }}>{item.key}</td>
                    <td style={{ padding: '8px 10px', borderBottom: '1px solid #4a4a4a', color: '#fff', wordBreak: 'break-word' }}>{item.value}</td>
                  </tr>
                ))
              ) : (
                <tr style={{ background: '#333' }}>
                  <td colSpan={2} style={{ textAlign: 'center', padding: '14px 10px', color: '#d0d0d0' }}>
                    No properties returned for this controller service.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Modal>
    </div>
  );
}
