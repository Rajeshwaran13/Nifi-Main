import { useEffect, useMemo, useState } from 'react';
import {
  DownOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  RightOutlined,
  SearchOutlined,
} from '@ant-design/icons';
import { useDnD } from '../Context/DnDContext';
import { CREATE_DATA_FLOW_DRAG_ITEM } from '../Context/createDataFlowEvents';

const groupProcessors = (processors, searchText) => {
  const query = searchText.trim().toLowerCase();


  const filtered = processors.filter((p) => {
    const matches = p.nodeName.toLowerCase().includes(query);
    const isDataFlow = (p.processorType || '').toLowerCase() === 'dataflow';
    return matches && !isDataFlow;
  });

  return filtered.reduce((acc, item) => {
    const section = item.processorType || 'Others';
    if (!acc[section]) acc[section] = [];
    acc[section].push(item);
    return acc;
  }, {});
};


export default function Sidebar({ processors, loading, error, onOpenControllerServices }) {
  const [, setSelectedProcessor] = useDnD();
  const [collapsed, setCollapsed] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [openSections, setOpenSections] = useState({});

  const grouped = useMemo(
    () => groupProcessors(processors, searchText),
    [processors, searchText]
  );

  useEffect(() => {
    setOpenSections((prev) => {
      const next = {};
      Object.keys(grouped).forEach((k) => {
        next[k] = prev[k] ?? false;
      });
      return next;
    });
  }, [grouped]);

  const toggleSection = (section) => {
    setOpenSections((prev) => ({ ...prev, [section]: !prev[section] }));
  };

  const onDragStart = (event, processor) => {
    setSelectedProcessor(processor);
    event.dataTransfer.setData('application/reactflow', processor.id);
    event.dataTransfer.effectAllowed = 'move';
  };

  const showCreateDataFlowItem =
    CREATE_DATA_FLOW_DRAG_ITEM.nodeName.toLowerCase().includes(searchText.trim().toLowerCase());

  return (
    <aside className="sidebar-panel" style={{ ...panelBase, width: collapsed ? 52 : 300 }}>
      <div className="sidebar-header-row" style={headerRow}>
        {!collapsed && <span>Nodes</span>}
        <button className="sidebar-collapse-btn" style={collapseBtn} onClick={() => setCollapsed((p) => !p)}>
          {collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
        </button>
      </div>

      {!collapsed && (
        <div style={bodyStyle} className="sidebar-scroll sidebar-body">
          <div style={searchWrap} className="sidebar-search-wrap">
            <SearchOutlined className="sidebar-search-icon" />
            <input
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              type="text"
              placeholder="Search"
              style={searchInput}
              className="sidebar-search-input"
            />
          </div>

          {loading && <div style={infoStyle} className="sidebar-info-text">Loading processors...</div>}
          {error && <div style={errorStyle} className="sidebar-error-text">{error}</div>}

          {showCreateDataFlowItem && (
            <div
              key={CREATE_DATA_FLOW_DRAG_ITEM.id}
              draggable
              onDragStart={(e) => onDragStart(e, CREATE_DATA_FLOW_DRAG_ITEM)}
              style={nodeItem}
              className="sidebar-node-item sidebar-node-item--action"
            >
              <span className="sidebar-node-label">{CREATE_DATA_FLOW_DRAG_ITEM.nodeName}</span>
            </div>
          )}

          {Object.keys(grouped).map((section) => (
            <div key={section} className={`sidebar-section ${openSections[section] ? 'is-open' : ''}`}>
              <div
                style={sectionHeader}
                className="sidebar-section-header"
                onClick={() => toggleSection(section)}
              >
                <span>{section}</span>
                {openSections[section] ? <DownOutlined /> : <RightOutlined />}
              </div>

              {openSections[section] &&
                grouped[section].map((processor) => (
                  <div
                    key={processor.id}
                    draggable
                    onDragStart={(e) => onDragStart(e, processor)}
                    style={nodeItem}
                    className="sidebar-node-item sidebar-node-item--processor"
                  >
                    {Number(processor?.ports?.targets || 0) > 0 && <span className="sidebar-port sidebar-port--in" />}
                    <span className="sidebar-node-label">{processor.nodeName}</span>
                    {Number(processor?.ports?.sources || 0) > 0 && <span className="sidebar-port sidebar-port--out" />}
                  </div>
                ))}
            </div>
          ))}

          <div style={{ marginTop: 16, borderTop: '1px solid #4a4a4a', paddingTop: 12}}>
            <button
              type="button"
              onClick={() => onOpenControllerServices?.()}
              className="sidebar-node-item sidebar-node-item--processor"
              style={{ ...nodeItem, width: '100%' }}
            >
              Controller Services
            </button>
          </div>
        </div>
      )}
    </aside>
  );
}

const panelBase = {
  height: '100%',
  overflow: 'hidden',
  display: 'flex',
  flexDirection: 'column',
};

const headerRow = {
  display: 'flex',
  alignItems: 'center',
  padding: '10px 12px',
  fontWeight: 700,
  fontSize: 22,
};

const collapseBtn = {
  background: 'transparent',
  border: 'none',
  cursor: 'pointer',
  fontSize: 18,
  marginLeft: 'auto',
};

const bodyStyle = {
  padding: 12,
  flex: 1,
  minHeight: 0,
  overflowY: 'auto',
  overflowX: 'hidden',
};

const searchWrap = {
  display: 'flex',
  gap: 8,
  padding: '6px 8px',
  marginBottom: 12,
};

const searchInput = {
  width: '100%',
  background: 'transparent',
  border: 'none',
  outline: 'none',
};

const sectionHeader = {
  padding: '10px',
  marginBottom: 6,
  display: 'flex',
  justifyContent: 'space-between',
  cursor: 'pointer',
};

const nodeItem = {
  padding: '10px 12px',
  minHeight: 44,
  marginBottom: 8,
  borderRadius: 0,
  cursor: 'grab',
  fontWeight: 500,
  display: 'flex',
  alignItems: 'center',
};

const infoStyle = { marginBottom: 10, fontSize: 12 };
const errorStyle = { marginBottom: 10, fontSize: 12 };
