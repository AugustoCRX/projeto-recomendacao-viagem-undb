import { useState } from 'react';
import { aiPlannerService } from '../services/aiPlanner';

export function useAiPlanner(tripId) {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  const generate = async (preferences = '', persist = true) => {
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const data = await aiPlannerService.generate(tripId, preferences, persist);
      setResult(data);
      return data;
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const reset = () => {
    setResult(null);
    setError(null);
  };

  return { generate, loading, result, error, reset };
}
