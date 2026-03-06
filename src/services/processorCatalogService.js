import axios from 'axios';
import mockProcessorData from '../assets/NodeDetails.json';

const PROCESSOR_API_URL = import.meta.env.VITE_PROCESSOR_API_URL;

export const fetchProcessorCatalog = async () => {
  if (!PROCESSOR_API_URL) {
    return mockProcessorData;
  }

  const response = await axios.get(PROCESSOR_API_URL);
  return response.data;
};
