interface Props {
  title: string;
  subtitle: string;
  badge?: string;
  badgeHint?: string;
}

export function PanelHeader({ title, subtitle, badge, badgeHint }: Props) {
  return (
    <div className="panel-header">
      <div className="panel-header-text">
        <h2>{title}</h2>
        <p className="panel-subtitle">{subtitle}</p>
        {badgeHint && <p className="panel-subtitle">{badgeHint}</p>}
      </div>
      {badge && (
        <span className="sim-badge" title={badgeHint}>
          {badge}
        </span>
      )}
    </div>
  );
}
