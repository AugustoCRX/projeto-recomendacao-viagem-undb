import { useState, useCallback } from 'react';
import { convertCurrency } from '@/services/api/currency';
import { DEFAULT_CURRENCY, SUPPORTED_CURRENCIES } from '@/constants';

export function useCurrencyConverter(initialFrom = DEFAULT_CURRENCY) {
  const [from, setFrom] = useState(initialFrom);
  const [to, setTo] = useState(SUPPORTED_CURRENCIES.find((c) => c !== initialFrom) ?? 'USD');
  const [amount, setAmount] = useState('');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const convert = useCallback(async () => {
    const parsed = parseFloat(amount);
    if (!parsed || isNaN(parsed) || parsed <= 0) return;
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const data = await convertCurrency(from, to, parsed);
      setResult(data);
    } catch (e) {
      setError(e.message ?? 'Erro ao converter moeda');
    } finally {
      setLoading(false);
    }
  }, [from, to, amount]);

  function swap() {
    setFrom(to);
    setTo(from);
    setResult(null);
  }

  return { from, setFrom, to, setTo, amount, setAmount, result, loading, error, convert, swap };
}
