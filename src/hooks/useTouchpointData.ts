import useSWR from 'swr';
import { TouchpointContentData } from '@/types/touchpoint';

const fetcher = async (url: string): Promise<TouchpointContentData> => {
  const response = await fetch(url);
  
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.details || errorData.error || 'Failed to fetch touchpoint content');
  }
  
  return response.json();
};

export function useTouchpointData(challengeName: string, channelName: string, workspaceId?: string) {
  const key = challengeName && channelName 
    ? `/api/campaigns/${encodeURIComponent(challengeName)}/${encodeURIComponent(channelName)}/touchpoints${
        workspaceId ? `?workspaceId=${encodeURIComponent(workspaceId)}` : ''
      }`
    : null;

  const { data, error, isLoading, mutate } = useSWR<TouchpointContentData>(
    key,
    fetcher,
    {
      revalidateOnFocus: false, // Don't revalidate when user focuses the window
      revalidateOnReconnect: true, // Revalidate when network reconnects
      refreshInterval: 0, // No automatic polling
      dedupingInterval: 2000, // Dedupe requests within 2 seconds
      errorRetryCount: 3, // Retry failed requests up to 3 times
      errorRetryInterval: 1000, // Wait 1 second between retries
    }
  );

  return {
    data,
    error,
    isLoading,
    mutate, // For manual revalidation if needed
  };
}
