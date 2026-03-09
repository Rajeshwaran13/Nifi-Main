export const initialNodes = [];

const normalizeKey = (value) =>
  String(value || '')
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '');

export const findGroupIdFieldName = (schema = [], config = {}) => {
  const configKey = Object.keys(config || {}).find((key) => normalizeKey(key) === 'groupid');
  if (configKey) return configKey;

  const schemaField = (schema || []).find(
    (field) =>
      normalizeKey(field?.name) === 'groupid' || normalizeKey(field?.label) === 'groupid'
  );

  if (schemaField?.name) return schemaField.name;
  return 'Group ID';
};

export const isStreamReceiverNodeData = (data = {}) => {
  const processorName = normalizeKey(data?.processorName);
  const label = normalizeKey(data?.label);

  if (processorName.includes('consumekafka') || label.includes('streamreceiver')) {
    return true;
  }

  return (data?.schema || []).some(
    (field) =>
      normalizeKey(field?.name) === 'groupid' || normalizeKey(field?.label) === 'groupid'
  );
};

export const applyProcessGroupToNodeData = (data, processGroup, forceOverride = false) => {
  if (!data || !processGroup) return data;
  if (!isStreamReceiverNodeData(data)) return data;

  const nextConfig = { ...(data.config || {}) };
  const groupIdField = findGroupIdFieldName(data.schema, nextConfig);
  const existing = nextConfig[groupIdField];

  if (forceOverride || existing === undefined || existing === null || existing === '') {
    nextConfig[groupIdField] = processGroup;
  }

  return {
    ...data,
    config: nextConfig,
  };
};

export const buildNodeData = (processor) => ({
  label: processor.nodeName,
  processorName: processor.processorName,
  processorType: processor.processorType,
  schema: processor.schema,
  ports: processor.ports,
  nodeColor: processor.nodeColor || '#3f3f3f',
  borderColor: processor.borderColor || '#898989',
  textColor: processor.textColor || '#ffffff',
  handleColor: processor.handleColor || '#06b6b0',
  config: { ...processor.defaultValues },
});

const hasConfigValue = (value) => value !== undefined && value !== null && value !== '';

const normalizeEnumOption = (option) => {
  if (option && typeof option === 'object' && !Array.isArray(option)) {
    return {
      label: option.label ?? option.value ?? '',
      value: option.value ?? option.label ?? '',
    };
  }

  return { label: option, value: option };
};

export const toEnumValueFromLabel = (field, rawValue) => {
  const matched = (field?.options || [])
    .map(normalizeEnumOption)
    .find((opt) => String(opt.label || '').toLowerCase() === String(rawValue || '').toLowerCase());

  if (matched?.value !== undefined && matched?.value !== null && matched?.value !== '') {
    return matched.value;
  }

  return rawValue;
};

export const buildExportConfig = (schema = [], config = {}) => {
  const nextConfig = { ...(config || {}) };

  schema.forEach((field) => {
    const name = field?.name;
    if (!name) return;

    if (!hasConfigValue(nextConfig[name])) {
      nextConfig[name] = field?.defaultValue ?? '';
    }

    if (field?.type === 'enum' && hasConfigValue(nextConfig[name])) {
      nextConfig[name] = toEnumValueFromLabel(field, nextConfig[name]);
    }
  });

  return nextConfig;
};

export const hasControllerServiceField = (schema = []) =>
  (schema || []).some((field) => field?.type === 'controllerService');

export const toControllerServiceIdConfig = (
  schema = [],
  values = {},
  controllerServiceOptions = []
) => {
  const next = { ...(values || {}) };

  (schema || []).forEach((field) => {
    if (field?.type !== 'controllerService') return;
    const selected = next[field.name];
    if (!selected) return;

    const selectedAsText = String(selected).toLowerCase();
    const matchedByName = controllerServiceOptions.find(
      (item) => String(item.label || '').toLowerCase() === selectedAsText
    );

    if (matchedByName?.value) {
      next[field.name] = matchedByName.value;
    }
  });

  return next;
};

export const getConnectionColor = (relationship) => {
  const normalizedRelationship = String(relationship || '').trim().toLowerCase();

  if (normalizedRelationship === 'failure') return '#ef4444';
  if (normalizedRelationship === 'matched') return '#22c55e';
  if (normalizedRelationship === 'unmatched' || normalizedRelationship === 'retry') return '#f59e0b';
  return '#06b6b0';
};
