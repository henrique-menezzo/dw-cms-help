import { useEffect, type ReactNode } from 'react';
import { faXmark } from '@fortawesome/free-solid-svg-icons';
import { faCircleQuestion } from '@fortawesome/free-regular-svg-icons';
import { Fa } from './Icon';
import { useStore } from '../store';

/** CMS dialog, as in the real Create Movie / Upload Primary Video windows. `help` adds the same How to entry point. */
export function CmsModal({
  title,
  sub,
  onClose,
  children,
  foot,
  help,
  width = 860,
}: {
  title: string;
  sub?: string;
  onClose: () => void;
  children: ReactNode;
  foot: ReactNode;
  help?: { guide: string; section: string };
  width?: number;
}) {
  const openHelp = useStore((s) => s.openHelp);
  const helpOpen = useStore((s) => s.help.open);
  useEffect(() => {
    const on = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !useStore.getState().help.open && !useStore.getState().lightbox) onClose();
    };
    addEventListener('keydown', on);
    return () => removeEventListener('keydown', on);
  }, [onClose]);
  return (
    <div className="cm-scrim">
      <div className="cm" role="dialog" aria-modal="true" aria-label={title} style={{ width }}>
        <header className="cm-head">
          <div>
            <h2>{title}</h2>
            {sub && <p>{sub}</p>}
          </div>
          <div className="cm-head-acts">
            {help && (
              <button
                className={'cm-help' + (helpOpen ? ' is-on' : '')}
                onClick={() => openHelp(help.guide, help.section)}
                aria-label="Help for this step"
                title="Help for this step"
              >
                <Fa icon={faCircleQuestion} size={19} />
              </button>
            )}
            <button className="cm-x" onClick={onClose} aria-label="Close">
              <Fa icon={faXmark} size={22} />
            </button>
          </div>
        </header>
        <div className="cm-body">{children}</div>
        <footer className="cm-foot">{foot}</footer>
      </div>
    </div>
  );
}

export function Hint({ children }: { children: ReactNode }) {
  return <p className="f-hint">{children}</p>;
}
