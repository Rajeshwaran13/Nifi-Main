import { Button, Modal, Radio, Space } from 'antd';
import { useEffect, useState } from 'react';

const getNodeTitle = (node) =>
  node?.data?.label || node?.data?.processorName || node?.id || '-';

const getNodeSubTitle = (node) => node?.data?.processorName || '';

export default function ConnectionConfigModal({
  open,
  fromNode,
  toNode,
  onCancel,
  onApply,
}) {
  const [relationship, setRelationship] = useState(null);

  useEffect(() => {
    if (open) setRelationship(null);
  }, [open]);

  return (
    <Modal
      className="connection-config-modal"
      title="Create Connection"
      open={open}
      onCancel={onCancel}
      width={460}
      footer={
        <Space>
          <Button onClick={onCancel}>Cancel</Button>
          <Button
            type={relationship ? 'primary' : 'default'}
            disabled={!relationship}
            onClick={() => onApply(relationship)}
          >
            Apply
          </Button>
        </Space>
      }
    >
      <div className="connection-section-label">From Processor</div>
      <div className="connection-node-card">
        <div>{getNodeTitle(fromNode)}</div>
        {getNodeSubTitle(fromNode) && (
          <div className="connection-node-subtitle">{getNodeSubTitle(fromNode)}</div>
        )}
      </div>

      <div className="connection-section-label" style={{ marginTop: 14 }}>
        To Processor
      </div>
      <div className="connection-node-card">
        <div>{getNodeTitle(toNode)}</div>
        {getNodeSubTitle(toNode) && (
          <div className="connection-node-subtitle">{getNodeSubTitle(toNode)}</div>
        )}
      </div>

      <div className="connection-section-label" style={{ marginTop: 14 }}>
        RelationShip
      </div>
      <div className="connection-relationship-options">
        <Radio.Group
          value={relationship}
          onChange={(e) => setRelationship(e.target.value)}
        >
          <Space size={24}>
            <Radio value="success">Success</Radio>
            <Radio value="failure">Failure</Radio>
          </Space>
        </Radio.Group>
      </div>
    </Modal>
  );
}
