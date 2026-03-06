import { useEffect, useMemo, useState } from 'react';
import {Button,Drawer,Form,
  Input,
  InputNumber,
  message,
  Modal,
  Select,
  Space,
  Switch,
  Radio
} from 'antd';

const normalizeEnumOption = (option) => {
  if (option && typeof option === 'object' && !Array.isArray(option)) {
    const value = option.value ?? option.label ?? '';
    const label = option.label ?? option.value ?? '';
    return { label, value };
  }

  return { label: option, value: option };
};

const toEnumValueFromLabel = (field, rawValue) => {
  const matched = (field?.options || [])
    .map(normalizeEnumOption)
    .find((opt) => String(opt.label || '').toLowerCase() === String(rawValue || '').toLowerCase());

  if (matched?.value !== undefined && matched?.value !== null && matched?.value !== '') {
    return matched.value;
  }

  return rawValue;
};

const normalizeKey = (value) =>
  String(value || '')
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '');

const isEvaluateJsonPathNode = (node) => {
  const processorName = normalizeKey(node?.data?.processorName);
  const label = normalizeKey(node?.data?.label);
  return processorName.includes('evaluatejsonpath') || label.includes('evaluatejsonpath');
};

const toDynamicField = (name) => ({
  name,
  label: name,
  type: 'text',
  placeholder: '',
  editable: true,
  required: false,
  visible: true,
  __dynamic: true,
});

const buildInitialValues = (node, controllerServiceOptions = []) => {
  if (!node) return {};
  const initialValues = {
    label: node.data?.label ?? '',
    ...(node.data?.config || {}),
  };

  const schema = node.data?.schema || [];
  schema.forEach((field) => {
    if (field?.type === 'enum') {
      const rawValue = initialValues[field.name];
      if (!rawValue) return;
      initialValues[field.name] = toEnumValueFromLabel(field, rawValue);
      return;
    }

    if (field?.type !== 'controllerService') return;

    const rawValue = initialValues[field.name];
    if (!rawValue) return;

    const matchedByName = controllerServiceOptions.find(
      (opt) => String(opt.label || '').toLowerCase() === String(rawValue).toLowerCase()
    );

    if (matchedByName?.value) {
      initialValues[field.name] = matchedByName.value;
    }
  });

  return initialValues;
};

const buildRules = (field) => {
  const rules = [];

  if (field?.required === true) {
    rules.push({
      required: true,
      message: `${field.label} is required`,
    });
  }

  if (!field?.validation || field.validation.type !== 'regex') return rules;
  try {
    rules.push({
      pattern: new RegExp(field.validation.regex),
      message: `Invalid ${field.label}`,
    });
  } catch {
    // ignore invalid regex from schema
  }

  return rules;
};

const renderField = (field, controllerServiceOptions = []) => {
  const commonProps = {
    placeholder: field.__dynamic ? '' : field.placeholder || field.label,
    disabled: !field.editable,
  };

  if (field.type === 'number') {
    return <InputNumber {...commonProps} style={{ width: '100%' }} />;
  }

  if (field.type === 'enum') {
    const selectLabel = field.placeholder || `Select ${field.label}`;
    const options = [
      { label: selectLabel, value: '', disabled: true },
      ...(field.options || []).map(normalizeEnumOption),
    ];
    return <Select {...commonProps} placeholder={selectLabel} options={options} />;
  }

  if (field.type === 'controllerService') {
    const selectLabel = field.placeholder || `Select ${field.label}`;
    const options = [
      { label: selectLabel, value: '', disabled: true },
      ...controllerServiceOptions.map((item) => ({
        label: item.label,
        value: item.value,
      })),
    ];
    return <Select {...commonProps} placeholder={selectLabel} options={options} />;
  }

  if (field.type === 'boolean') {
    return <Switch disabled={!field.editable} />;
  }

  if (field.type === 'radio') {
  return (
    <Radio.Group disabled={!field.editable}>
      <Space>
        {(field.options || []).map((opt) => (
          <Radio key={opt} value={opt}>
            {opt}
          </Radio>
        ))}
      </Space>
    </Radio.Group>
  );
}


  return <Input {...commonProps} />;
};

const NodeConfigModal = ({
  open,
  onClose,
  node,
  onSubmit,
  mode = 'drawer',
  controllerServiceOptions = [],
}) => {
  const [form] = Form.useForm();
  const [dynamicPropertyNames, setDynamicPropertyNames] = useState([]);
  const [isAddPropertyOpen, setIsAddPropertyOpen] = useState(false);
  const [newPropertyName, setNewPropertyName] = useState('');
  const baseSchema = node?.data?.schema || [];
  const shouldShowDynamicProperties = isEvaluateJsonPathNode(node);

  const schema = useMemo(() => {
    if (!shouldShowDynamicProperties) return baseSchema;
    return [...baseSchema, ...dynamicPropertyNames.map(toDynamicField)];
  }, [baseSchema, dynamicPropertyNames, shouldShowDynamicProperties]);

  useEffect(() => {
    if (!open) return;
    form.setFieldsValue(buildInitialValues(node, controllerServiceOptions));
  }, [controllerServiceOptions, form, node, open]);

  useEffect(() => {
    if (!open) return;
    if (!shouldShowDynamicProperties) {
      setDynamicPropertyNames([]);
      return;
    }

    const schemaNames = new Set((baseSchema || []).map((field) => field?.name).filter(Boolean));
    const configKeys = Object.keys(node?.data?.config || {});
    const dynamicFromConfig = configKeys.filter((key) => !schemaNames.has(key));
    setDynamicPropertyNames(dynamicFromConfig);
  }, [baseSchema, node, open, shouldShowDynamicProperties]);

  const handleFinish = (values) => onSubmit(values);

  const handleOpenAddProperty = () => {
    setNewPropertyName('');
    setIsAddPropertyOpen(true);
  };

  const handleAddProperty = () => {
    const propertyName = String(newPropertyName || '').trim();
    if (!propertyName) {
      message.error('Property Name is required');
      return;
    }

    if (schema.some((field) => String(field?.name || '').toLowerCase() === propertyName.toLowerCase())) {
      message.error('Property already exists');
      return;
    }

    setDynamicPropertyNames((items) => items.concat(propertyName));
    form.setFieldsValue({ [propertyName]: '' });
    setIsAddPropertyOpen(false);
    setNewPropertyName('');
  };
  const canAddProperty = String(newPropertyName || '').trim().length > 0;

  const title = node ? `Configure ${node.data?.processorName || node.data?.label}` : 'Configure node';
  const footer = (
    <Space>
      <Button onClick={onClose}>Cancel</Button>
      <Button type="primary" onClick={() => form.submit()}>
        Apply
      </Button>
    </Space>
  );
  const content = (
    <Form form={form} className="node-config-form" onFinish={handleFinish}>
      {schema.map((field) => (
        <div key={field.name} className="node-config-row">
          <div className="node-config-row-label">
            {field.label}
            {field.required === true && <span className="node-required">*</span>}
          </div>
          <Form.Item
            className="node-config-row-field"
            name={field.name}
            rules={buildRules(field)}
            valuePropName={field.type === 'boolean' ? 'checked' : 'value'}
          >
            {renderField(field, controllerServiceOptions)}
          </Form.Item>
        </div>
      ))}
      {shouldShowDynamicProperties && (
        <div className="node-config-row">
          <div className="node-config-row-label" />
          <div className="node-config-row-field">
            <Button onClick={handleOpenAddProperty}>+ Add Property</Button>
          </div>
        </div>
      )}
    </Form>
  );

  if (mode === 'modal') {
    return (
      <Modal
        className="node-config-modal"
        title={title}
        open={open}
        onCancel={onClose}
        width={620}
        destroyOnHidden
        footer={footer}
      >
        {content}
        {shouldShowDynamicProperties && (
          <Modal
            className="add-property-modal"
            title="Add Property"
            open={isAddPropertyOpen}
            onCancel={() => setIsAddPropertyOpen(false)}
            onOk={handleAddProperty}
            okText="Add"
            okButtonProps={{
              disabled: !canAddProperty,
            }}
            destroyOnHidden
          >
            <Form layout="vertical">
              <Form.Item label="Property Name*" required>
                <Input
                  value={newPropertyName}
                  onChange={(event) => setNewPropertyName(event.target.value)}
                  onPressEnter={handleAddProperty}
                />
              </Form.Item>
            </Form>
          </Modal>
        )}
      </Modal>
    );
  }

  return (
    <Drawer
      className="node-config-drawer"
      title={title}
      open={open}
      onClose={onClose}
      getContainer={false}
      rootStyle={{ position: 'absolute' }}
      maskClosable={false}
      placement="right"
      size={560}
      destroyOnClose
      footer={footer}
    >
      {content}
      {shouldShowDynamicProperties && (
        <Modal
          className="add-property-modal"
          title="Add Property"
          open={isAddPropertyOpen}
          onCancel={() => setIsAddPropertyOpen(false)}
          onOk={handleAddProperty}
          okText="Add"
          okButtonProps={{
            disabled: !canAddProperty,
          }}
          destroyOnHidden
        >
          <Form layout="vertical">
            <Form.Item label="Property Name*" required>
              <Input
                value={newPropertyName}
                onChange={(event) => setNewPropertyName(event.target.value)}
                onPressEnter={handleAddProperty}
              />
            </Form.Item>
          </Form>
        </Modal>
      )}
    </Drawer>
  );
};

export default NodeConfigModal;
