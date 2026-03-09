import 'bootstrap/dist/css/bootstrap.min.css';
import { CaretRightOutlined, CloudUploadOutlined, LeftOutlined, SaveOutlined } from '@ant-design/icons';
import { requestCreateDataFlow } from '../Context/createDataFlowEvents';

const DataFlowBar = ({ search, setSearch, showSearch = true, showCreate = true, onBack }) => {
  const handleExportFlow = () => {
    window.dispatchEvent(new CustomEvent('dataflow:export:request'));
  };

  const handleDeployFlow = () => {
    window.dispatchEvent(new CustomEvent('dataflow:deploy:request'));
  };

  return (
    <div className="dataflow-bar d-flex align-items-center justify-content-between border-bottom bg-dark text-white">
      <div className="d-flex align-items-center gap-2">
        {onBack ? (
          <button className="dataflow-back-icon" onClick={onBack} aria-label="Back to monitor">
            <LeftOutlined />
          </button>
        ) : null}
        <h4 className="mb-0">Data Flow</h4>
      </div>

      <div className="d-flex align-items-center gap-2">
        {showSearch ? (
          <div className="input-group">
            <input
              type="text"
              className="form-control dataflow-search-input"
              placeholder="Search"
              value={search || ''}
              onChange={(e) => setSearch?.(e.target.value)}
            />
          </div>
        ) : null}

        <button className="btn btn-secondary dataflow-btn">
          <CaretRightOutlined className="dataflow-btn__icon" />
          <span>Run</span>
        </button>
        <button className="btn btn-secondary dataflow-btn">
          <SaveOutlined className="dataflow-btn__icon" />
          <span>Save</span>
        </button>
        {showCreate ? (
          <button className="btn btn-success dataflow-btn" onClick={() => requestCreateDataFlow()}>
            Create
          </button>
        ) : null}
        {/* <button className="btn btn-secondary dataflow-btn" onClick={handleExportFlow}>
          Export Flow
        </button> */}
        <button className="btn btn-success dataflow-btn" onClick={handleDeployFlow}>
          <CloudUploadOutlined className="dataflow-btn__icon" />
          <span>Deploy</span>
        </button>
      </div>
    </div>
  );
};

export default DataFlowBar;
