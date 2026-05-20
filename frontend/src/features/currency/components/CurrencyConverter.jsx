import { Spinner } from '@/components/ui';
import { SUPPORTED_CURRENCIES } from '@/constants';
import { useCurrencyConverter } from '../hooks/useCurrencyConverter';
import styles from './CurrencyConverter.module.css';

const CURRENCY_FLAGS = {
  BRL: '🇧🇷', USD: '🇺🇸', EUR: '🇪🇺',
  GBP: '🇬🇧', JPY: '🇯🇵', ARS: '🇦🇷',
};

export function CurrencyConverter({ initialFrom }) {
  const { from, setFrom, to, setTo, amount, setAmount, result, loading, error, convert, swap } =
    useCurrencyConverter(initialFrom);

  function handleKey(e) {
    if (e.key === 'Enter') convert();
  }

  const canConvert = amount && parseFloat(amount) > 0 && !loading;

  return (
    <div className={styles.card}>
      <div className={styles.header}>
        <span className={styles.title}>💱 Conversor de moeda</span>
      </div>

      <div className={styles.body}>
        <div className={styles.row}>
          <select
            className={styles.select}
            value={from}
            onChange={(e) => { setFrom(e.target.value); }}
          >
            {SUPPORTED_CURRENCIES.map((c) => (
              <option key={c} value={c}>{CURRENCY_FLAGS[c]} {c}</option>
            ))}
          </select>

          <button className={styles.swapBtn} onClick={swap} title="Inverter moedas">
            ⇄
          </button>

          <select
            className={styles.select}
            value={to}
            onChange={(e) => { setTo(e.target.value); }}
          >
            {SUPPORTED_CURRENCIES.map((c) => (
              <option key={c} value={c}>{CURRENCY_FLAGS[c]} {c}</option>
            ))}
          </select>
        </div>

        <div className={styles.amountRow}>
          <input
            className={styles.input}
            type="number"
            min="0"
            step="any"
            placeholder="Valor"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            onKeyDown={handleKey}
          />
          <button
            className={styles.convertBtn}
            onClick={convert}
            disabled={!canConvert}
          >
            {loading ? <Spinner size="sm" /> : 'Converter'}
          </button>
        </div>

        {error && <p className={styles.error}>{error}</p>}

        {result && (
          <div className={styles.result}>
            <p className={styles.resultValue}>
              {CURRENCY_FLAGS[result.target]} {Number(result.converted).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} {result.target}
            </p>
            <p className={styles.resultRate}>
              1 {result.base} = {Number(result.rate).toLocaleString('pt-BR', { minimumFractionDigits: 4, maximumFractionDigits: 6 })} {result.target}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
