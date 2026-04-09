import { useState } from 'react';

export function useMutationFeedback() {
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const reset = () => {
    setMessage(null);
    setError(null);
  };

  return { message, error, setMessage, setError, reset } as const;
}
