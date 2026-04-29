export function logInfo(message: string, data?: any) {
  if (data !== undefined) {
    console.log('[INFO]', message, data);
    return;
  }

  console.log('[INFO]', message);
}

export function logError(error: unknown, context?: string) {
  if (context) {
    console.error('[ERROR]', context, error);
    return;
  }

  console.error('[ERROR]', error);
}