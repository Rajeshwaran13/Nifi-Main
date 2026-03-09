import { useEffect, useMemo, useState } from 'react';
import { CloseOutlined } from '@ant-design/icons';
import { Button, Modal, Radio, Space } from 'antd';

const normalizeRelationship = (value) => String(value || '').trim().toLowerCase();

const getRelationshipOptions = (fromNode) => {
  const rawOptions = fromNode?.data?.relationships || fromNode?.data?.ports?.relationships || [];
  const normalizedOptions = Array.isArray(rawOptions)
    ? rawOptions
        .map((item) => {
          if (typeof item === 'string') return item;
          return item?.name || item?.label || item?.value || '';
        })
        .map((item) => String(item || '').trim())
        .filter(Boolean)
    : [];

  return normalizedOptions;
};

const getNodePrimaryText = (node) =>
  node?.data?.label || node?.data?.nodeName || node?.data?.processorName || 'Processor';

const getNodeSecondaryText = (node) =>
  node?.data?.processorName || node?.data?.label || '';

export default function ConnectionConfigModal({
  open,
  fromNode,
  toNode,
  onCancel,
  onApply,
}) {
  const relationshipOptions = useMemo(
    () => getRelationshipOptions(fromNode),
    [fromNode]
  );
  const [selectedRelationship, setSelectedRelationship] = useState(null);

  useEffect(() => {
    if (!open) return;
    setSelectedRelationship(null);
  }, [open, relationshipOptions]);

  return (
    <Modal
      className="connection-config-modal"
      title="Configure Connection"
      open={open}
      onCancel={onCancel}
      width={650}
      closeIcon={
        <span className="connection-config-modal__close-icon">
          <CloseOutlined />
        </span>
      }
      destroyOnHidden
      footer={[
        <Button key="cancel" className="connection-config-modal__cancel-btn" onClick={onCancel}>
          Cancel
        </Button>,
        <Button
          key="apply"
          type="primary"
          className={`connection-config-modal__apply-btn${
            selectedRelationship ? ' is-active' : ''
          }`}
          disabled={!selectedRelationship}
          onClick={() => onApply?.(selectedRelationship)}
        >
          Apply
        </Button>,
      ]}
    >
      <div className="connection-section-label">From</div>
      <div className="connection-node-card">
        <div className="connection-node-title">
          {getNodePrimaryText(fromNode)}
        </div>
        <div className="connection-node-subtitle">{getNodeSecondaryText(fromNode)}</div>
      </div>

      <div className="connection-section-label connection-section-label--spaced">To</div>
      <div className="connection-node-card">
        <div className="connection-node-title">
          {getNodePrimaryText(toNode)}
        </div>
        <div className="connection-node-subtitle">{getNodeSecondaryText(toNode)}</div>
      </div>

      <div className="connection-relationship-options">
        <div className="connection-section-label connection-section-label--spaced">Relationship</div>
        <Radio.Group
          value={selectedRelationship}
          onChange={(event) => setSelectedRelationship(event.target.value)}
        >
          <Space direction="vertical">
            {relationshipOptions.map((option) => {
              const value = normalizeRelationship(option);
              return (
                <Radio key={value} value={value}>
                  {option}
                </Radio>
              );
            })}
          </Space>
        </Radio.Group>
      </div>
    </Modal>
  );
}
