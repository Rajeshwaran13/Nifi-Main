import { createRoot } from 'react-dom/client';
import DashboardLayout from './components/features/UI/DashboardLayout';
import './App.css';

class DataFlowBuilder extends HTMLElement {
  root = null;

  connectedCallback() {
    const mountPoint = document.createElement('div');
    mountPoint.style.width = '100%';
    mountPoint.style.height = '100%';
    this.appendChild(mountPoint);

    this.root = createRoot(mountPoint);
    this.root.render(<DashboardLayout />);
  }

  disconnectedCallback() {
    if (this.root) {
      this.root.unmount();
      this.root = null;
    }
  }
}

if (!customElements.get('data-flow-builder')) {
  customElements.define('data-flow-builder', DataFlowBuilder);
}
