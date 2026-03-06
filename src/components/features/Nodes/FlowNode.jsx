import { Handle, Position } from '@xyflow/react';

const toOffsets = (count) => {
  if (!count || count < 1) return [];
  if (count === 1) return [50];
  const step = 100 / (count + 1);
  return Array.from({ length: count }, (_, i) => Math.round((i + 1) * step));
};

export const FlowNode = ({ id, data }) => {
  const nodeData = data || {};
  const sourceOffsets = toOffsets(nodeData?.ports?.sources || 0);
  const targetOffsets = toOffsets(nodeData?.ports?.targets || 0);
  const handleColor = nodeData?.handleColor || '#06b6b0 ';

  return (
    <div className="flow-node">
      {targetOffsets.map((top, idx) => (
        <Handle
          key={`target-${id}-${idx}`}
          type="target"
          position={Position.Left}
          id={`target-${id}-${idx}`}
          style={{ top: `${top}%`, background: handleColor }}
          className="flow-node__handle"
        />
      ))}

      <div className="flow-node__label">{nodeData.label}</div>

      {sourceOffsets.map((top, idx) => (
        <Handle
          key={`source-${id}-${idx}`}
          type="source"
          position={Position.Right}
          id={`source-${id}-${idx}`}
          style={{ top: `${top}%`, background: handleColor }}
          className="flow-node__handle"
        />
      ))}
    </div>
  );
};
