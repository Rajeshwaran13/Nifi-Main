import { PlusOutlined, SearchOutlined } from '@ant-design/icons';

const formatVersion = (value) => (value ? `${value}.1.0` : 'V.1.0');

export default function DataFlowMonitorPage({
  search = '',
  onSearchChange,
  onCreate,
  createDataFlow,
}) {
  const rows = createDataFlow ? [createDataFlow] : [];
  const normalizedQuery = String(search || '').trim().toLowerCase();
  const filteredRows = rows.filter((row) => {
    if (!normalizedQuery) return true;
    return [row.processGroup, row.domainName, row.vendorName, row.sensorName]
      .some((value) => String(value || '').toLowerCase().includes(normalizedQuery));
  });

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
              <th>Name</th>
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
            {filteredRows.length > 0 ? (
              filteredRows.map((row, index) => (
                <tr key={`${row.processGroup}-${index}`}>
                  <td>{index + 1}</td>
                  <td>{row.processGroup}</td>
                  <td>
                    <span className="monitor-page__status">Good Health</span>
                  </td>
                  <td>{row.domainName || '-'}</td>
                  <td>{formatVersion(row.version)}</td>
                  <td>0</td>
                  <td>0 B/s</td>
                  <td>0 B/s</td>
                  <td>0 B/s</td>
                  <td>-</td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="10" className="monitor-page__empty">
                  {rows.length > 0 ? 'No matching data flows found.' : 'No data flows created yet.'}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
