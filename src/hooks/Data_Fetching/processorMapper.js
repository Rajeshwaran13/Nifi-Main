const toSafeId = (value) =>
  String(value || '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');

const toFieldType = (dataType, defaultValue) => {
  if (typeof defaultValue === 'number') return 'number';
  if (typeof defaultValue === 'boolean') return 'boolean';

  const normalized = String(dataType || '').toLowerCase();
  if (normalized === 'radio') return 'radio';
  if (normalized === 'controllerservice') return 'controllerService';

  if (['enum', 'dropdown', 'drop', 'select'].includes(normalized)) return 'enum';
  if (['int', 'integer', 'float', 'double', 'long', 'number'].includes(normalized)) return 'number';
  if (['bool', 'boolean'].includes(normalized)) return 'boolean';
  return 'text';
};

const normalizeToken = (value) =>
  String(value || '')
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '');

const isControllerServiceField = (name, raw = {}) => {
  if (raw?.controllerServiceType) return true;

  const dataType = normalizeToken(raw?.dataType);
  if (dataType === 'controllerservice') return true;

  const fieldName = normalizeToken(name);
  const label = normalizeToken(raw?.label || raw?.displayName || raw?.name);

  // Fallback for catalogs that send controller-service fields as text.
  const looksLikeControllerService =
    fieldName.includes('connectionservice') ||
    label.includes('connectionservice') ||
    fieldName.includes('controllerservice') ||
    label.includes('controllerservice');

  return looksLikeControllerService;
};


const toSchemaField = ([name, raw]) => {
  if (raw && typeof raw === 'object' && !Array.isArray(raw)) {
    const isRequiredFlag = (value) => {
      if (value === true) return true;
      const normalized = String(value || '').trim().toLowerCase();
      return normalized === 'true' || normalized === '1' || normalized === 'yes';
    };

    const required =
      isRequiredFlag(raw.required) ||
      isRequiredFlag(raw.isRequired) ||
      isRequiredFlag(raw.mandatory);

    return {
      name,
      label: raw.label || raw.displayName || raw.name || name,
      type: isControllerServiceField(name, raw)
        ? 'controllerService'
        : toFieldType(raw.dataType, raw.defaultValue),
      options: Array.isArray(raw.values)
        ? raw.values
        : Array.isArray(raw.options)
          ? raw.options
          : [],
      placeholder: raw.placeHolder || '',
      defaultValue: raw.defaultValue ?? '',
      visible: raw.visible !== false,
      editable: raw.editable !== false,
      required,
      validation: raw.validation || null,
      controllerServiceType: raw.controllerServiceType || '',
    };
  }

  return {
    name,
    label: name,
    type: toFieldType('', raw),
    options: [],
    placeholder: '',
    defaultValue: raw ?? '',
    visible: true,
    editable: true,
    required: false,
    validation: null,
    controllerServiceType: '',
  };
};

const normalizeProperties = (properties) => {
  if (properties && !Array.isArray(properties) && typeof properties === 'object') {
    return Object.entries(properties);
  }

  if (Array.isArray(properties)) {
    return properties.map((p, i) => [
      p.name || p.propertyName || p.key || `property-${i}`,
      p,
    ]);
  }

  return [];
};

const toPortCounts = (ports = {}) => {
  const count = Number(ports.noOfPorts || 1);
  const safeCount = Number.isFinite(count) && count > 0 ? count : 1;

  // support both old and new key names
  const portTypeId = String(ports.portTypeId ?? ports.typeId ?? '');
  const portType = String(ports.portType ?? ports.type ?? '').toLowerCase();

  if (portTypeId === '1') return { sources: safeCount, targets: 0 }; // output only
  if (portTypeId === '2') return { sources: 0, targets: safeCount }; // input only
  if (portTypeId === '3') return { sources: safeCount, targets: safeCount }; // both

  return {
    sources: portType.includes('output') ? safeCount : 0,
    targets: portType.includes('input') ? safeCount : 0,
  };
};


export const normalizeProcessorCatalog = (payload) => {
  const list = Array.isArray(payload)
    ? payload
    : Array.isArray(payload?.Processors)
      ? payload.Processors
      : Array.isArray(payload?.processors)
        ? payload.processors
        : [];

  return list.map((processor, index) => {
    const schema = normalizeProperties(processor.properties || processor.config)
      .map(toSchemaField)
      .filter((field) => field.visible);

    const defaultValues = schema.reduce((acc, field) => {
      acc[field.name] = field.defaultValue;
      return acc;
    }, {});

    const nodeName =
  processor.aliasName || processor.nodeName || processor.name || processor.processorName || `processor-${index}`;


    return {
      id: toSafeId(`${nodeName}-${index}`),
      nodeName,
      processorName: processor.name || processor.processorName || nodeName,
      processorType: processor.processorType || processor.type || 'Others',
      ports: toPortCounts(processor.ports || {}),
      schema,
      defaultValues,
      raw: processor,
    };
  });
};
