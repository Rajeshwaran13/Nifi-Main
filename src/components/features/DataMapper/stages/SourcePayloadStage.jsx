import { Input } from 'antd';

const { TextArea } = Input;

export default function SourcePayloadStage({ value, onChange, error, sourcePayload, setSourcePayload }) {
  const resolvedValue = sourcePayload ?? value ?? '';
  const resolvedOnChange = setSourcePayload ?? onChange ?? (() => {});

  return (
    <div className="data-mapper-modal__stage">
      <div className="data-mapper-modal__grid">
        <div className="data-mapper-modal__panel">
          <div className="data-mapper-modal__label">
            Vendor Source Payload <span className="data-mapper-modal__required">*</span>
          </div>
          <TextArea
            value={resolvedValue}
            onChange={(e) => resolvedOnChange(e.target.value)}
            rows={18}
            placeholder="{\n  ...\n}"
            className="data-mapper-modal__textarea"
          />
          {error ? <div className="data-mapper-modal__hint">{error}</div> : null}
        </div>
      </div>
    </div>
  );
}
