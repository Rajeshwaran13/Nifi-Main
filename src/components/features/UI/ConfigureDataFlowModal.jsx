import { useEffect, useMemo, useState } from 'react';
import { CloseOutlined } from '@ant-design/icons';
import { Button, Form, Input, Modal, Radio, Select, message } from 'antd';
import {
  buildProcessGroupName,
  fetchConfigureDataFlowOptions,
  fetchVendors,
} from '../../../services/configureDataFlow';
import config from '../../../constants/config';

const TENANT_CODE = config.tenantCode;
const buildEmptySelectOption = (label) => [{ label, value: '' }];
const buildRequiredSelectRule = (message) => ({
  validator: async (_, value) => {
    if (value === undefined || value ===  null || value ==='') {
      throw new Error(message);
    }
  },
});

export default function ConfigureDataFlowModal({ open, onClose, onApply }) {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [domainOptions, setDomainOptions] = useState([]);
  const [sensorOptions, setSensorOptions] = useState([]);
  const [vendorOptions, setVendorOptions] = useState([]);

  const sensorValue = Form.useWatch('sensor', form);
  const domainValue = Form.useWatch('domain', form);
  const vendorValue = Form.useWatch('vendor', form);

  const sourceTypeOptions = useMemo(
    () => [
      { label: 'Device', value: 'device' },
      { label: 'API', value: 'api' },
    ],
    []
  );

  useEffect(() => {
    if (!open) return;

    const load = async () => {
      setLoading(true);
      try {
        const { domains, sensors, vendors } = await fetchConfigureDataFlowOptions({
          tenantCode: TENANT_CODE,
        });

        setDomainOptions(domains);
        setSensorOptions(sensors);
        setVendorOptions(vendors);
        form.setFieldsValue({
          vendor: '',
          domain: '',
          sensor: '',
          sourceType: undefined,
          processGroup: '',
        });
      } catch (error) {
        message.error('Failed to load Create Data Flow options');
        setDomainOptions([]);
        setSensorOptions([]);
        setVendorOptions([]);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [open, form]);

  useEffect(() => {
    if (!open) return;
    if (!sensorValue) return;

    const loadVendorsBySensor = async () => {
      try {
        const vendors = await fetchVendors({
          tenantCode: TENANT_CODE,
          deviceTypeId: sensorValue,
        });
        setVendorOptions(vendors);

        const currentVendor = form.getFieldValue('vendor');
        const exists = vendors.some((v) => v.code === currentVendor);
        if (!exists) {
          form.setFieldsValue({ vendor: '' });
        }
      } catch {
        setVendorOptions([]);
        form.setFieldsValue({ vendor: '' });
      }
    };

    loadVendorsBySensor();
  }, [sensorValue, open, form]);

  const selectedVendorName =
    vendorOptions.find((v) => v.code === vendorValue)?.name || '';
  const selectedDomainName = domainValue || '';
  const selectedSensorName =
    sensorOptions.find((s) => s.id === sensorValue)?.name || '';

  const processGroup = useMemo(
    () => {
      if (!selectedVendorName || !selectedDomainName || !selectedSensorName) return '';
      return buildProcessGroupName({
        tenantCode: TENANT_CODE,
        vendorName: selectedVendorName,
        domainName: selectedDomainName,
        sensorName: selectedSensorName,
      });
    },
    [selectedVendorName, selectedDomainName, selectedSensorName]
  );

  useEffect(() => {
    form.setFieldValue('processGroup', processGroup);
  }, [processGroup, form]);

  const handleApply = async () => {
    try {
      const values = await form.validateFields();
      const payload = {
        tenantCode: TENANT_CODE,
        vendorCode: values.vendor,
        vendorName: selectedVendorName,
        domainName: values.domain,
        sensorId: values.sensor,
        sensorName: selectedSensorName,
        sourceType: values.sourceType,
        processGroup: values.processGroup,
        version: 'V',
      };

      onApply?.(payload);
      onClose?.();
    } catch {
      // antd validation handles the UI state
    }
  };

  return (
    <Modal
      className="create-dataflow-modal"
      title="Configure Create Data Flow"
      open={open}
      onCancel={onClose}
      closeIcon={
        <span className="create-dataflow-modal__close-icon">
          <CloseOutlined />
        </span>
      }
      confirmLoading={loading}
      destroyOnHidden
      footer={[
        <Button key="cancel" className="create-dataflow-modal__cancel-btn" onClick={onClose}>
          Cancel
        </Button>,
        <Button
          key="apply"
          className="create-dataflow-modal__apply-btn"
          type="primary"
          loading={loading}
          onClick={handleApply}
        >
          Apply
        </Button>,
      ]}
    >
      <Form form={form} layout="vertical" requiredMark={false}>
        <Form.Item name="vendor" label="Vendor" rules={[buildRequiredSelectRule('Select Vendor')]}>
          <Select
              placeholder="Select Vendor"
              loading={loading}
              options={[
                ...buildEmptySelectOption('Select Vendor'),
                ...vendorOptions.map((v) => ({ label: v.name, value: v.code })),
              ]}
            />
          </Form.Item>

        <Form.Item name="domain" label="Domain" rules={[buildRequiredSelectRule('Select Domain')]}>
          <Select
            placeholder="Select Domain"
            loading={loading}
            options={[
              ...buildEmptySelectOption('Select Domain'),
              ...domainOptions.map((d) => ({ label: d.name, value: d.name })),
            ]}
          />
        </Form.Item>

        <Form.Item name="sensor" label="Sensor" rules={[buildRequiredSelectRule('Select Sensor')]}>
          <Select
            placeholder="Select Sensor"
            loading={loading}
            options={[
              ...buildEmptySelectOption('Select Sensor'),
              ...sensorOptions.map((s) => ({ label: s.name, value: s.id })),
            ]}
          />
        </Form.Item>

        <Form.Item
          name="sourceType"
          label="Source Type"
          rules={[{ required: true, message: 'Select Source Type' }]}
        >
          <Radio.Group options={sourceTypeOptions} />
        </Form.Item>

        <Form.Item name="processGroup" label="Process Group">
          <Input placeholder="Process Group" disabled />
        </Form.Item>
      </Form>
    </Modal>
  );
}
