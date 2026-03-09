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
  if (['textarea', 'multiline'].includes(normalized)) return 'textarea';

  if (['enum', 'dropdown', 'drop', 'select'].includes(normalized)) return 'enum';
  if (['int', 'integer', 'float', 'double', 'long', 'number'].includes(normalized)) return 'number';
  if (['bool', 'boolean'].includes(normalized)) return 'boolean';
  return 'text';
};

const toBooleanValue = (value) => {
  if (typeof value === 'boolean') return value;
  const normalized = String(value ?? '').trim().toLowerCase();
  if (normalized === 'true' || normalized === '1' || normalized === 'yes' || normalized === 'on') {
    return true;
  }
  if (normalized === 'false' || normalized === '0' || normalized === 'no' || normalized === 'off' || normalized === '') {
    return false;
  }
  return Boolean(value);
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

    const fieldType = isControllerServiceField(name, raw)
      ? 'controllerService'
      : toFieldType(raw.dataType, raw.defaultValue);

    return {
      name,
      label: raw.label || raw.displayName || raw.name || name,
      type: fieldType,
      options: Array.isArray(raw.values)
        ? raw.values
        : Array.isArray(raw.options)
          ? raw.options
          : [],
      placeholder: raw.placeholder || raw.placeHolder || '',
      defaultValue: fieldType === 'boolean' ? toBooleanValue(raw.defaultValue) : (raw.defaultValue ?? ''),
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
    defaultValue: toFieldType('', raw) === 'boolean' ? toBooleanValue(raw) : (raw ?? ''),
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

const normalizePortEntries = (ports) => {
  if (Array.isArray(ports)) return ports;
  if (ports && typeof ports === 'object') return [ports];
  return [];
};

const toPortConfig = (ports = {}) => {
  const entries = normalizePortEntries(ports);

  if (entries.length === 0) {
    return {
      sources: 0,
      targets: 0,
      relationships: [],
    };
  }

  const summary = entries.reduce(
    (acc, port) => {
      const portTypeId = String(port?.portTypeId ?? port?.typeId ?? '');
      const portType = String(port?.portType ?? port?.type ?? '').toLowerCase();
      const portName = String(port?.name || port?.label || '').trim();

      if (portTypeId === '3') {
        acc.hasSource = true;
        acc.hasTarget = true;
        if (portName) {
          acc.relationships.push(portName);
        }
        return acc;
      }

      if (portTypeId === '1' || portType.includes('output')) {
        acc.hasSource = true;
        if (portName) {
          acc.relationships.push(portName);
        }
      }

      if (portTypeId === '2' || portType.includes('input')) {
        acc.hasTarget = true;
      }

      return acc;
    },
    {
      hasSource: false,
      hasTarget: false,
      relationships: [],
    }
  );

  return {
    sources: summary.hasSource ? 1 : 0,
    targets: summary.hasTarget ? 1 : 0,
    relationships: summary.relationships,
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
      ports: toPortConfig(processor.ports || {}),
      nodeColor: processor.nodeColor || '#3f3f3f',
      borderColor: processor.borderColor || '#898989',
      textColor: processor.textColor || '#ffffff',
      handleColor: processor.handleColor || '#06b6b0',
      schema,
      defaultValues,
      raw: processor,
    };
  });
};
