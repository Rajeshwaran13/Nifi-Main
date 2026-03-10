import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';

const bezierPath = (from, to) => {
  const dx = Math.max(80, Math.abs(to.x - from.x) * 0.5);
  return `M ${from.x} ${from.y} C ${from.x + dx} ${from.y}, ${to.x - dx} ${to.y}, ${to.x} ${to.y}`;
};

const getTargetPortFromPoint = (x, y) => {
  let el = document.elementFromPoint(x, y);
  while (el) {
    if (el?.dataset?.dmTargetPort) return el.dataset.dmTargetPort;
    el = el.parentElement;
  }
  return '';
};

export default function TargetMappingStage({
  sourceFields,
  targetFields = [],
  isTargetLoading = false,
  fieldMappings = [],
  onCreateMapping,
}) {
  const containerRef = useRef(null);
  const sourcePortRefs = useRef(new Map());
  const targetPortRefs = useRef(new Map());
  const rafRef = useRef(0);

  const [ports, setPorts] = useState({ sources: {}, targets: {} });
  const [drag, setDrag] = useState(null);

  const edges = useMemo(
    () =>
      (fieldMappings || [])
        .map((m) => ({
          key: `${m.sourcePath}__${m.targetName}`,
          sourcePath: m.sourcePath,
          targetName: m.targetName,
        }))
        .filter(Boolean),
    [fieldMappings]
  );

  const measure = () => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    rafRef.current = requestAnimationFrame(() => {
      const container = containerRef.current;
      if (!container) return;
      const rect = container.getBoundingClientRect();

      const nextSources = {};
      sourcePortRefs.current.forEach((el, key) => {
        if (!el) return;
        const r = el.getBoundingClientRect();
        nextSources[key] = { x: r.left + r.width / 2 - rect.left, y: r.top + r.height / 2 - rect.top };
      });

      const nextTargets = {};
      targetPortRefs.current.forEach((el, key) => {
        if (!el) return;
        const r = el.getBoundingClientRect();
        nextTargets[key] = { x: r.left + r.width / 2 - rect.left, y: r.top + r.height / 2 - rect.top };
      });

      setPorts({ sources: nextSources, targets: nextTargets });
    });
  };

  useLayoutEffect(() => {
    measure();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sourceFields, targetFields, fieldMappings]);

  useEffect(() => {
    window.addEventListener('resize', measure);
    return () => window.removeEventListener('resize', measure);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!drag) return undefined;

    const handleMove = (e) => {
      const container = containerRef.current;
      if (!container) return;
      const rect = container.getBoundingClientRect();
      setDrag((prev) => (prev ? { ...prev, to: { x: e.clientX - rect.left, y: e.clientY - rect.top } } : prev));
    };

    const handleUp = (e) => {
      const targetName = getTargetPortFromPoint(e.clientX, e.clientY);
      if (targetName && drag?.sourcePath) {
        onCreateMapping?.({ sourcePath: drag.sourcePath, targetName });
      }
      setDrag(null);
    };

    window.addEventListener('mousemove', handleMove);
    window.addEventListener('mouseup', handleUp);

    return () => {
      window.removeEventListener('mousemove', handleMove);
      window.removeEventListener('mouseup', handleUp);
    };
  }, [drag, onCreateMapping]);

  const startDragFromSource = (sourcePath) => (event) => {
    event.preventDefault();
    event.stopPropagation();

    const from = ports.sources[sourcePath];
    if (!from) {
      setDrag({ sourcePath, to: null });
      return;
    }

    setDrag({ sourcePath, to: { ...from } });
  };

  return (
    <div className="data-mapper-modal__stage">
      <div className="data-mapper-modal__map" ref={containerRef}>
        <svg className="data-mapper-modal__edges" width="100%" height="100%">
          {edges.map((edge) => {
            const from = ports.sources[edge.sourcePath];
            const to = ports.targets[edge.targetName];
            if (!from || !to) return null;
            return <path key={edge.key} d={bezierPath(from, to)} className="data-mapper-modal__edge-path" />;
          })}

          {drag?.sourcePath && drag?.to && ports.sources[drag.sourcePath] ? (
            <path
              d={bezierPath(ports.sources[drag.sourcePath], drag.to)}
              className="data-mapper-modal__edge-path data-mapper-modal__edge-path--draft"
            />
          ) : null}
        </svg>

        <div className="data-mapper-modal__mapping-grid">
          <div className="data-mapper-modal__mapping-col">
            <div className="data-mapper-modal__section-title">Source</div>
            <div className="data-mapper-modal__list" onScroll={measure}>
              {sourceFields.length ? (
                sourceFields.map((field) => (
                  <div key={field.path} className="data-mapper-modal__row">
                    <div className="data-mapper-modal__row-text">{field.label || field.path}</div>
                    <span
                      className="data-mapper-modal__port data-mapper-modal__port--source"
                      ref={(el) => {
                        if (el) sourcePortRefs.current.set(field.path, el);
                        else sourcePortRefs.current.delete(field.path);
                      }}
                      onMouseDown={startDragFromSource(field.path)}
                      role="button"
                      tabIndex={0}
                      aria-label={`Connect source ${field.path}`}
                    />
                  </div>
                ))
              ) : (
                <div className="data-mapper-modal__empty">Enter JSON in Source Payload.</div>
              )}
            </div>
          </div>

          <div className="data-mapper-modal__mapping-col">
            <div className="data-mapper-modal__section-title">Target</div>
            <div className="data-mapper-modal__target-table">
              <div className="data-mapper-modal__target-head">
                <div>Name</div>
                <div>Type</div>
              </div>
              <div className="data-mapper-modal__target-body" onScroll={measure}>
                {targetFields.length ? (
                  targetFields.map((field) => (
                    <div key={field.name} className="data-mapper-modal__target-row">
                      <span
                        className="data-mapper-modal__port data-mapper-modal__port--target"
                        data-dm-target-port={field.name}
                        ref={(el) => {
                          if (el) targetPortRefs.current.set(field.name, el);
                          else targetPortRefs.current.delete(field.name);
                        }}
                        role="button"
                        tabIndex={0}
                        aria-label={`Target port ${field.name}`}
                      />
                      <div className="data-mapper-modal__target-name">{field.name}</div>
                      <div className="data-mapper-modal__target-type">{field.type}</div>
                    </div>
                  ))
                ) : isTargetLoading ? (
                  <div className="data-mapper-modal__empty">Loading target fields...</div>
                ) : (
                  <div className="data-mapper-modal__empty">No target fields.</div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
