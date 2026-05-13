export const DEFAULT_OFFLINE_MESSAGE = 'No se pueden cargar los datos. Sin conexión.';
export const DEFAULT_ERROR_MESSAGE = 'Ha ocurrido un error';

type SafeRequestOptions = {
  isOffline?: boolean;
  offlineMessage?: string;
  errorMessage?: string;
};

type SafeRequestSuccess<T> = {
  ok: true;
  data: T;
};

type SafeRequestFailure = {
  ok: false;
  kind: 'offline' | 'error';
  message: string;
  error: unknown;
};

export type SafeRequestResult<T> = SafeRequestSuccess<T> | SafeRequestFailure;

function isNetworkError(error: unknown) {
  if (error instanceof TypeError) {
    const message = error.message.toLowerCase();
    return message.includes('network request failed') || message.includes('failed to fetch');
  }

  if (error instanceof Error) {
    const message = error.message.toLowerCase();
    return message.includes('network request failed') || message.includes('failed to fetch');
  }

  return false;
}

export async function safeRequest<T>(
  request: () => Promise<T>,
  options: SafeRequestOptions = {}
): Promise<SafeRequestResult<T>> {
  const offlineMessage = options.offlineMessage ?? DEFAULT_OFFLINE_MESSAGE;
  const errorMessage = options.errorMessage ?? DEFAULT_ERROR_MESSAGE;

  if (options.isOffline) {
    return { ok: false, kind: 'offline', message: offlineMessage, error: new Error('offline') };
  }

  try {
    const data = await request();
    return { ok: true, data };
  } catch (error) {
    if (isNetworkError(error)) {
      return { ok: false, kind: 'offline', message: offlineMessage, error };
    }

    return { ok: false, kind: 'error', message: errorMessage, error };
  }
}
