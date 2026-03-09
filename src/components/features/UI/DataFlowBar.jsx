import 'bootstrap/dist/css/bootstrap.min.css';
import { requestCreateDataFlow } from '../Context/createDataFlowEvents';

const DataFlowBar = ({ search, setSearch }) => {
  const handleExportFlow = () => {
    window.dispatchEvent(new CustomEvent('dataflow:export:request'));
  };

  const handleDeployFlow = () => {
    window.dispatchEvent(new CustomEvent('dataflow:deploy:request'));
  };

  return (
    <div className="dataflow-bar d-flex align-items-center justify-content-between p-2 border-bottom bg-dark text-white">
      <h5 className="mb-0">Data Flow</h5>

      <div className="d-flex align-items-center gap-2">
        <div className="input-group">
          <input
            type="text"
            className="form-control dataflow-search-input"
            placeholder="Search"
            value={search || ''}
            onChange={(e) => setSearch?.(e.target.value)}
          />
        </div>

        <button className="btn btn-secondary dataflow-btn">Run</button>
        <button className="btn btn-secondary dataflow-btn">Save</button>
        <button className="btn btn-success dataflow-btn" onClick={() => requestCreateDataFlow()}>
          Create
        </button>
        {/* <button className="btn btn-secondary dataflow-btn" onClick={handleExportFlow}>
          Export Flow
        </button> */}
        <button className="btn btn-success dataflow-btn" onClick={handleDeployFlow}>
          Deploy
        </button>
      </div>
    </div>
  );
};

export default DataFlowBar;
