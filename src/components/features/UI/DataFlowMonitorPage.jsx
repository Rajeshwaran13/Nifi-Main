import { DeleteOutlined, EditOutlined, PlusOutlined, SearchOutlined } from '@ant-design/icons';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { getAllFlow } from '../../../services/DataMonitor/getAllFlow';
import { deleteFlow } from '../../../services/DataMonitor/deleteFlow';

export default function DataFlowMonitorPage({
  search = '',
  onSearchChange,
  onCreate,
  onEdit,
}) {
  const [rows, setRows] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [deletingKey, setDeletingKey] = useState(null);
  const normalizedQuery = String(search || '').trim().toLowerCase();

  const loadFlows = useCallback(async () => {
    setIsLoading(true);
    setError('');

    try {
      const response = await getAllFlow();
      setRows(response);
    } catch (loadError) {
      setRows([]);
      setError(loadError?.response?.data?.message || loadError?.message || 'Unable to load flows.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadFlows();
  }, [loadFlows]);

  const handleDelete = useCallback(
    async (row) => {
      const key = row?.processGroupName || row?.id;
      if (!key || deletingKey) return;

      setDeletingKey(key);
      try {
        await deleteFlow({ processGroupName: row?.processGroupName, id: row?.id });
        await loadFlows();
      } catch (deleteError) {
        setError(
          deleteError?.response?.data?.message || deleteError?.message || 'Failed to delete flow'
        );
      } finally {
        setDeletingKey(null);
      }
    },
    [deletingKey, loadFlows]
  );

  const filteredRows = useMemo(
    () =>
      rows.filter((row) => {
        if (!normalizedQuery) return true;
        return [row.processGroupName, row.domainName, row.currentFlowStatus, row.version]
          .some((value) => String(value || '').toLowerCase().includes(normalizedQuery));
      }),
    [normalizedQuery, rows]
  );

  return (
    <div className="monitor-page">
      <div className="monitor-page__header">
        <div className="monitor-page__title">Data Flow Monitor</div>

        <div className="monitor-page__actions">
          <div className="monitor-page__search-wrap">
            <SearchOutlined className="monitor-page__search-icon" />
            <input
              type="text"
              className="monitor-page__search"
              placeholder="Search"
              value={search}
              onChange={(event) => onSearchChange?.(event.target.value)}
            />
          </div>
          <button className="monitor-page__create-btn" onClick={onCreate}>
            <PlusOutlined />
            Create
          </button>
        </div>
      </div>
      <div className="monitor-page__table-wrap">
        <table className="monitor-page__table">
          <thead>
            <tr>
              <th>Sl.No</th>
              <th className="monitor-page__name-col">Name</th>
              <th>Status</th>
              <th>Domain Name</th>
              <th>Version No.</th>
              <th>Lag Count</th>
              <th>Current Received</th>
              <th>Current Sent</th>
              <th>Data Throughout</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan="10" className="monitor-page__empty">
                  Loading data flows...
                </td>
              </tr>
            ) : error ? (
              <tr>
                <td colSpan="10" className="monitor-page__empty">
                  {error}
                </td>
              </tr>
            ) : filteredRows.length > 0 ? (
              filteredRows.map((row, index) => (
                <tr key={row.id || `${row.processGroupName}-${index}`}>
                  <td>{index + 1}</td>
                  <td className="monitor-page__name-cell">{row.processGroupName ?? ''}</td>
                  <td>
                    <span className="monitor-page__status">{row.currentFlowStatus ?? ''}</span>
                  </td>
                  <td>{row.domainName ?? ''}</td>
                  <td>{row.version ?? ''}</td>
                  <td>{row.lagCount ?? ''}</td>
                  <td>{row.currentReceived ?? ''}</td>
                  <td>{row.currentSent ?? ''}</td>
                  <td>{row.dataThroughput ?? ''}</td>
                  <td className="monitor-page__actions-cell">
                    <button
                      type="button"
                      className="monitor-page__icon-btn"
                      aria-label={`Edit ${row.processGroupName || 'flow'}`}
                      onClick={() => onEdit?.(row)}
                    >
                      <EditOutlined />
                    </button>
                    <button
                      type="button"
                      className="monitor-page__icon-btn"
                      aria-label={`Delete ${row.processGroupName || 'flow'}`}
                      onClick={() => handleDelete(row)}
                      disabled={deletingKey === (row.processGroupName || row.id)}
                    >
                      <DeleteOutlined />
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="10" className="monitor-page__empty">
                  {rows.length > 0 ? 'No matching data flows found.' : 'No data flows available.'}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
