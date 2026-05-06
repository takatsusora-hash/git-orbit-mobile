type ProgressGlyphProps = {
  progress: number;
};

export function ProgressGlyph({ progress }: ProgressGlyphProps) {
  return (
    <div>
      <div className="progress-track" aria-hidden="true">
        <div className="progress-fill" style={{ width: `${progress}%` }} />
      </div>
      <div className="progress-caption">
        <span>Progress</span>
        <span>{progress}%</span>
      </div>
    </div>
  );
}
