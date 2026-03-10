import axios from 'axios';
import config from '../../constants/config';

const BASE_URL = '/DataFlowService/api/target-data-model/generateJsonSchema';

export default async function getTargetJsonSchema(processGroupName, tenantCode = config.tenantCode) {
  if (!processGroupName) {
    throw new Error('processGroupName is required');
  }

  const response = await axios.get(
    `${BASE_URL}/${encodeURIComponent(tenantCode)}/${encodeURIComponent(processGroupName)}`,
    {
      headers: { accept: 'application/json' },
    }
  );

  return response.data;
}

