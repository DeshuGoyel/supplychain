import useSWR, { SWRConfiguration } from 'swr';
import apiClient from '@/utils/api';

const fetcher = (url: string) => apiClient.get(url).then((res) => res.data);

export const useApi = <T>(url: string | null, config?: SWRConfiguration) => {
  const { data, error, mutate, isValidating } = useSWR<T>(url, fetcher, config);

  return {
    data,
    isLoading: !error && !data,
    isError: error,
    mutate,
    isValidating,
  };
};
