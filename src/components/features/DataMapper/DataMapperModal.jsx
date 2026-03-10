import { useEffect, useMemo, useState } from 'react';
import { Button, Modal, Steps } from 'antd';
import { CloseOutlined } from '@ant-design/icons';
import './DataMapperModal.css';
import extractSourceFields from './extractSourceFields';
import { GroovyScriptStage, SourcePayloadStage, TargetMappingStage, ValidationStage } from './stages';
import getTargetJsonSchema from '../../../services/DataMapper/getTargetJsonSchema';

const circleIcon = (icon) => <span className="data-mapper-modal__step-circle">{icon}</span>;

export default function DataMapperModal({ open, onClose, processGroupName = '' }) {
  const [current, setCurrent] = useState(0);
  const [sourcePayload, setSourcePayload] = useState('');
  const [sourceFields, setSourceFields] = useState([]);
  const [sourcePayloadError, setSourcePayloadError] = useState('');
  const [targetFields, setTargetFields] = useState([]);
  const [isTargetLoading, setIsTargetLoading] = useState(false);
  const [fieldMappings, setFieldMappings] = useState([]);

  useEffect(() => {
    if (!open) return undefined;

    const prevBodyOverflow = document.body.style.overflow;
    const prevHtmlOverflow = document.documentElement.style.overflow;
    document.body.style.overflow = 'hidden';
    document.documentElement.style.overflow = 'hidden';

    return () => {
      document.body.style.overflow = prevBodyOverflow;
      document.documentElement.style.overflow = prevHtmlOverflow;
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    if (!processGroupName) return;

    let cancelled = false;

    (async () => {
      try {
        setIsTargetLoading(true);
        const schema = await getTargetJsonSchema(processGroupName);
        const props = schema?.properties || {};
        const rows = Object.entries(props).map(([name, def]) => ({
          name,
          type: def?.type || (Array.isArray(def?.enum) ? 'enum' : ''),
        }));
        if (!cancelled) setTargetFields(rows);
      } catch {
        if (!cancelled) setTargetFields([]);
      } finally {
        if (!cancelled) setIsTargetLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [open, processGroupName]);

  const stageConfig = useMemo(
    () => [
      {
        key: 'source',
        title: 'Source Payload',
        render: () => (
          <SourcePayloadStage
            sourcePayload={sourcePayload}
            setSourcePayload={(next) => {
              setSourcePayload(next);
              if (sourcePayloadError) setSourcePayloadError('');
            }}
            error={sourcePayloadError}
          />
        ),
      },
      {
        key: 'mapping',
        title: 'Target Mapping',
        render: () => (
          <TargetMappingStage
            sourceFields={sourceFields}
            targetFields={targetFields}
            isTargetLoading={isTargetLoading}
            fieldMappings={fieldMappings}
            onCreateMapping={({ sourcePath, targetName }) => {
              const source = sourceFields.find((f) => f.path === sourcePath);
              const target = targetFields.find((t) => t.name === targetName);
              if (!source || !target) return;

              setFieldMappings((prev) => {
                const next = (prev || []).filter(
                  (m) => m.sourcePath !== source.path && m.targetName !== target.name
                );
                next.push({
                  sourcePath: source.path,
                  sourceLabel: source.label || source.path,
                  targetName: target.name,
                  targetType: target.type,
                });
                return next;
              });
            }}
          />
        ),
      },
      { key: 'script', title: 'Groovy Script', render: () => <GroovyScriptStage /> },
      { key: 'validation', title: 'Validation', render: () => <ValidationStage /> },
    ],
    [
      sourceFields,
      sourcePayload,
      sourcePayloadError,
      targetFields,
      isTargetLoading,
      fieldMappings,
    ]
  );

  const stepItems = useMemo(
    () =>
      stageConfig.map((step, index) => {
        const isDone = index < current;
        const isActive = index === current;
        const status = isDone ? 'finish' : isActive ? 'process' : 'wait';
        return {
          key: step.key,
          title: step.title,
          status,
          icon: circleIcon(<span className="data-mapper-modal__step-num">{index + 1}</span>),
        };
      }),
    [current, stageConfig]
  );

  const handleClose = () => {
    setCurrent(0);
    setSourcePayload('');
    setSourceFields([]);
    setSourcePayloadError('');
    setTargetFields([]);
    setIsTargetLoading(false);
    setFieldMappings([]);
    onClose?.();
  };

  const handleNext = () => {
    if (current === 0) {
      const { fields, error } = extractSourceFields(sourcePayload);
      if (error) {
        setSourcePayloadError('Please enter valid JSON.');
        return;
      }
      if (!fields.length) {
        setSourcePayloadError('Source payload is required.');
        return;
      }
      setSourcePayloadError('');
      setSourceFields(fields);
      setFieldMappings([]);
    }

    if (current === 1) {
      // eslint-disable-next-line no-console
      console.log('Data Mapper mappings:', fieldMappings);
    }

    if (current >= stageConfig.length - 1) {
      handleClose();
      return;
    }
    setCurrent((c) => c + 1);
  };

  const handleBack = () => setCurrent((c) => Math.max(0, c - 1));

  const body = stageConfig[current]?.render?.() || null;

  const footer = (
    <div className="data-mapper-modal__footer">
      <div />
      <div className="data-mapper-modal__footer-right">
        {current > 0 ? (
          <Button className="data-mapper-modal__btn data-mapper-modal__btn--secondary" onClick={handleBack}>
            Back
          </Button>
        ) : null}
        <Button className="data-mapper-modal__btn data-mapper-modal__btn--primary" type="primary" onClick={handleNext}>
          Next
        </Button>
      </div>
    </div>
  );

  return (
    <Modal
      className="data-mapper-modal"
      title="Data Mapper"
      open={open}
      onCancel={handleClose}
      closeIcon={<CloseOutlined style={{ color: '#ffffff' }} />}
      footer={footer}
      width={1020}
      centered
      wrapClassName="data-mapper-modal-wrap"
      destroyOnClose
    >
      <div className="data-mapper-modal__steps">
        <Steps current={current} items={stepItems} labelPlacement="vertical" />
      </div>
      <div className="data-mapper-modal__content">{body}</div>
    </Modal>
  );
}
