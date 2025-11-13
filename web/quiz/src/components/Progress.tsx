interface ProgressProps {
  currentStep: number;
  totalSteps: number;
}

export default function Progress({ currentStep, totalSteps }: ProgressProps) {
  const width = Math.max(0, Math.min(100, Math.round((currentStep / totalSteps) * 100)));
  return (
    <div className="progress" role="progressbar" aria-valuenow={currentStep} aria-valuemin={1} aria-valuemax={totalSteps}>
      <div className="progress__bar" style={{ width: `${width}%` }} />
      <span className="progress__label">
        Step {currentStep} of {totalSteps}
      </span>
    </div>
  );
}
