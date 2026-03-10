import axios from 'axios';

const BASE_PATH = '/DataFlowService/api/wso2';

const CATEGORIES_API = `${BASE_PATH}/getCategories`;
const DEVICE_TYPES_API = `${BASE_PATH}/getDeviceTypes`;
const VENDORS_API = `${BASE_PATH}/getVendors`;
const TARGET_ENTITY_API = `${BASE_PATH}/getEntityDetails`;

const postJson = async (url, payload) => {
  const response = await axios.post(url, payload, {
    headers: { 'Content-Type': 'application/json' },
  });
  return response?.data;
};

const normalizeKey = (key) => String(key || '').replace(/[^a-z0-9]/gi, '').toLowerCase();

const readField = (item, candidateKeys = []) => {
  if (!item || typeof item !== 'object') return undefined;

  const map = {};
  Object.keys(item).forEach((k) => {
    map[normalizeKey(k)] = item[k];
  });

  for (const key of candidateKeys) {
    const value = map[normalizeKey(key)];
    if (value !== undefined && value !== null) return value;
  }

  return undefined;
};

const findArrayDeep = (payload, preferredKeys = []) => {
  if (Array.isArray(payload)) return payload;
  if (!payload || typeof payload !== 'object') return [];

  const preferredNormalized = preferredKeys.map((k) => normalizeKey(k));
  const queue = [payload];

  while (queue.length > 0) {
    const node = queue.shift();
    if (!node || typeof node !== 'object') continue;

    const entries = Object.entries(node);

    for (const [key, value] of entries) {
      if (!Array.isArray(value)) continue;
      const normalized = normalizeKey(key);
      if (preferredNormalized.includes(normalized)) {
        return value;
      }
    }

    for (const [, value] of entries) {
      if (Array.isArray(value)) {
        if (value.length === 0) continue;
        if (value.some((x) => x && typeof x === 'object' && !Array.isArray(x))) {
          return value;
        }
        continue;
      }

      if (value && typeof value === 'object') {
        queue.push(value);
      }
    }
  }

  return [];
};

const toDomainOption = (item, index) => ({
  id: readField(item, ['categoryId', 'id']) ?? index + 1,
  name: String(readField(item, ['categoryName', 'name', 'label']) ?? '').trim(),
});

const toSensorOption = (item, index) => ({
  id: readField(item, ['deviceTypeId', 'id']) ?? index + 1,
  name: String(readField(item, ['deviceTypeName', 'name', 'label']) ?? '').trim(),
});

const toVendorOption = (item, index) => ({
  id: readField(item, ['vendorId', 'id']) ?? index + 1,
  code: String(readField(item, ['vendorCode', 'code']) ?? '').trim(),
  name: String(readField(item, ['vendorName', 'name', 'label']) ?? '').trim(),
});

const toTargetEntityOption = (item, index) => {
  if (typeof item === 'string' || typeof item === 'number') {
    const code = String(item).trim();
    return { key: `target-${index}`, name: code, code };
  }

  if (!item || typeof item !== 'object') {
    return { key: `target-${index}`, name: '', code: '' };
  }

  const name = String(readField(item, ['name', 'entityName', 'label']) ?? '').trim();
  const code = String(readField(item, ['code', 'entityCode', 'value']) ?? '').trim();

  return { key: `target-${index}`, name, code };
};

export const fetchDomains = async (tenantCode) => {
  const payload = await postJson(CATEGORIES_API, { tenantCode });
  return findArrayDeep(payload, ['categories', 'categoryList', 'data'])
    .map(toDomainOption)
    .filter((x) => x.name);
};

export const fetchSensors = async (tenantCode) => {
  const payload = await postJson(DEVICE_TYPES_API, { tenantCode });
  return findArrayDeep(payload, ['deviceTypes', 'deviceTypeList', 'data'])
    .map(toSensorOption)
    .filter((x) => x.name);
};

export const fetchVendors = async ({ tenantCode, deviceTypeId }) => {
  const payload = await postJson(VENDORS_API, { tenantCode, deviceTypeId });
  return findArrayDeep(payload, ['vendors', 'vendorList', 'data'])
    .map(toVendorOption)
    .filter((x) => x.name);
};

export const fetchTargetEntities = async (tenantCode) => {
  const response = await axios.get(`${TARGET_ENTITY_API}/${encodeURIComponent(tenantCode)}`, {
    headers: { accept: 'application/json' },
  });

  const payload = response?.data;
  const items = findArrayDeep(payload, ['entities', 'entityDetails', 'data', 'items', 'content']);

  const normalized = items
    .map(toTargetEntityOption)
    .filter((x) => x.code && x.name);

  const seen = new Set();
  return normalized.filter((x) => {
    if (seen.has(x.code)) return false;
    seen.add(x.code);
    return true;
  });
};

export const fetchConfigureDataFlowOptions = async ({ tenantCode }) => {
  const [domains, sensors, targetEntities] = await Promise.all([
    fetchDomains(tenantCode),
    fetchSensors(tenantCode),
    fetchTargetEntities(tenantCode),
  ]);

  const selectedSensorId = sensors[0]?.id ?? 1;
  const vendors = await fetchVendors({ tenantCode, deviceTypeId: selectedSensorId });

  return { domains, sensors, vendors, targetEntities };
};

const normalizeToken = (value) =>
  String(value || '')
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, '');

const vendorCode = (vendorName) => normalizeToken(vendorName).slice(0, 3);

export const buildProcessGroupName = ({ tenantCode, vendorName, domainName, sensorName }) => {
  const tenant = normalizeToken(tenantCode);
  const vendor = vendorCode(vendorName);
  const domain = normalizeToken(domainName);
  const sensor = normalizeToken(sensorName);

  return [tenant, vendor, domain, sensor, 'V'].filter(Boolean).join('_');
};
