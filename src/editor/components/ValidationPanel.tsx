import type { ValidationResult } from '../schemas/levelDefaults';

interface ValidationPanelProps {
  results: ValidationResult[];
  onFocusResult: (result: ValidationResult) => void;
}

export function ValidationPanel({ results, onFocusResult }: ValidationPanelProps) {
  return (
    <section className="validation-panel" role="region" aria-label="Validation panel">
      <h2>Validation</h2>
      <div className="validation-list">
        {results.length === 0 ? (
          <p>No validation run yet.</p>
        ) : (
          results.map((result) => (
            <button
              key={result.id}
              type="button"
              className={`validation-item validation-item--${result.severity}`}
              onClick={() => onFocusResult(result)}
            >
              <span>{labelFor(result.severity)}</span>
              <strong>{result.message}</strong>
            </button>
          ))
        )}
      </div>
    </section>
  );
}

function labelFor(severity: ValidationResult['severity']): string {
  if (severity === 'error') return 'Error';
  if (severity === 'warning') return 'Warning';
  return 'Info';
}
