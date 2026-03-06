// import { data } from 'autoprefixer';
import axios from 'axios';

const DEFAULT_CONTROLLER_SERVICE_TYPES_API = '/DataFlowService/nifi/controller-services';
const DEFAULT_CONTROLLER_SERVICE_UPDATE_STATE_API = '/DataFlowService/Normalizer/controller/updateState';

const CONTROLLER_SERVICE_TYPES_API =
  import.meta.env.VITE_CONTROLLER_SERVICE_TYPES_API_URL || DEFAULT_CONTROLLER_SERVICE_TYPES_API;
const CONTROLLER_SERVICE_UPDATE_STATE_API =
  import.meta.env.VITE_CONTROLLER_SERVICE_UPDATE_STATE_API_URL || DEFAULT_CONTROLLER_SERVICE_UPDATE_STATE_API;
const DEFAULT_DELETE_CONTROLLER_SERVICE_API = '/DataFlowService/Normalizer/controller';
const DELETE_CONTROLLER_SERVICE_API =
  import.meta.env.VITE_DELETE_CONTROLLER_SERVICE_API_URL || DEFAULT_DELETE_CONTROLLER_SERVICE_API;

const toBooleanEnabled = (item) =>
  item?.enabled === true ||
  item?.state === 'ENABLED' ||
  item?.component?.state === 'ENABLED';

export const normalizeControllerServiceRows = (responseData) => {
  const serviceTypes = Array.isArray(responseData)
    ? responseData
    : responseData?.controllerServiceTypes || responseData?.data || [];

  return serviceTypes.map((item, index) => ({
    key: item.controllerServiceId || item.id || item?.component?.id || `${item.type || 'type'}-${index}`,
    controllerServiceId: item.controllerServiceId || item.id || item?.component?.id || '',
    name: item.name || item?.component?.name || '-',
    type: item.type || item?.component?.type || '-',
    enabled: toBooleanEnabled(item),
  }));
};

export const toControllerServiceOptions = (rows = []) =>
  rows
    .filter((row) => row?.controllerServiceId && row?.name && row.name !== '-')
    .map((row) => ({
      label: row.name,
      value: row.controllerServiceId,
      type: row.type,
      enabled: !!row.enabled,
    }));

export const fetchControllerServiceTypes = async () => {
  try {
    const response = await axios.get(CONTROLLER_SERVICE_TYPES_API, {
      withCredentials: true,
      
    });
  //  console.log(response.data);
    return response.data;
  } catch (error) {
    const status = error?.response?.status;
    const payload = error?.response?.data;

    console.error(
      '[controllerServiceTypesService] Request failed',
      {
        url: CONTROLLER_SERVICE_TYPES_API,
        status,
        payload,
      },
    );

    throw error;
  }
};

export const fetchControllerServiceOptions = async () => {
  const responseData = await fetchControllerServiceTypes();
  return toControllerServiceOptions(normalizeControllerServiceRows(responseData));
};

export const updateControllerServiceState = async ({ controllerServiceId, action }) => {
  try {
    const response = await axios.post(
      CONTROLLER_SERVICE_UPDATE_STATE_API,
      {
        controllerServiceId,
        action,
      },
      {
        withCredentials: true,
      },
    );
    return response.data;
  } catch (error) {
    const status = error?.response?.status;
    const payload = error?.response?.data;

    console.error(
      '[controllerServiceTypesService] Update state request failed',
      {
        url: CONTROLLER_SERVICE_UPDATE_STATE_API,
        status,
        payload,
        request: { controllerServiceId, action },
      },
    );

    throw error;
  }
};


export const deleteControllerService = async (controllerServiceId) => {
  try {
    const response = await axios.delete(
      `${DELETE_CONTROLLER_SERVICE_API}/${controllerServiceId}`,
      {
        withCredentials: true,
      },
    );
    return response.data;
  } catch (error) {
    const status = error?.response?.status;
    const payload = error?.response?.data;

    console.error(
      '[controllerServiceTypesService] Delete request failed',
      {
        url: `${DELETE_CONTROLLER_SERVICE_API}/${controllerServiceId}`,
        status,
        payload,
      },
    );

    throw error;
  }
};


export const fetchControllerServiceById = async (controllerServiceId) => {
  try {
    const response = await axios.get(
      `${DELETE_CONTROLLER_SERVICE_API}/${controllerServiceId}`,
      {
        withCredentials: true,
        validateStatus: () => true,
      },
    );
    if (response?.data) {
      return response.data;
    }

    throw new Error(`Empty response body for controllerServiceId=${controllerServiceId}`);
  } catch (error) {
    const status = error?.response?.status;
    const payload = error?.response?.data;

    console.error(
      '[controllerServiceTypesService] Fetch by id request failed',
      {
        url: `${DELETE_CONTROLLER_SERVICE_API}/${controllerServiceId}`,
        status,
        payload,
      },
    );

    throw error;
  }
};
