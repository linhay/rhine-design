import { useRef, useState, type InputHTMLAttributes, type ReactElement, type ReactNode } from 'react';
import { Button, Notice, Surface, TextField } from './components';
import { Drawer } from './Overlays';
import './list-filter-bar.css';

export interface ListFilterField {
  id: string;
  label: string;
  control: ReactNode;
  activeLabel?: string;
  onClear?: () => void;
}

export interface ListFilterBarProps {
  label: string;
  search?: InputHTMLAttributes<HTMLInputElement> & { label: string };
  primary?: readonly ListFilterField[];
  filters?: readonly ListFilterField[];
  onReset?: () => void;
  refresh?: { onClick: () => void; busy?: boolean; disabled?: boolean };
  action?: ReactElement;
  result?: ReactNode;
  drawerDescription?: ReactNode;
  drawerResult?: ReactNode;
  pending?: boolean;
  error?: string;
  className?: string;
}

function Feedback({ result, pending, error, announce = true }: Pick<ListFilterBarProps, 'result' | 'pending' | 'error'> & { announce?: boolean }) {
  return <>
    {(result != null || pending) && <div className="rhine-list-filter-bar__feedback" role="status" aria-live={announce ? 'polite' : 'off'}>
      {pending && <span>正在更新结果…</span>}
      {result != null && <div>{result}</div>}
    </div>}
    {error && <Notice tone="error" title="未能更新结果">{error}</Notice>}
  </>;
}

const focusable = 'input:not(:disabled):not([type="hidden"]), select:not(:disabled), textarea:not(:disabled), button:not(:disabled), a[href]';

export function ListFilterBar({ label, search, primary = [], filters = [], onReset, refresh, action, result, drawerDescription = '更改后立即更新结果。', drawerResult, pending = false, error, className = '' }: ListFilterBarProps) {
  const [open, setOpen] = useState(false);
  const root = useRef<HTMLDivElement>(null);
  const drawerBody = useRef<HTMLDivElement>(null);
  const visibleFields = primary.slice(0, 2);
  const drawerFields = [...primary.slice(2), ...filters];
  const activeFields = [...primary, ...filters].filter(field => field.activeLabel?.trim());
  const activeDrawerCount = activeFields.filter(field => drawerFields.some(item => item.id === field.id)).length;
  const hasQuery = search?.value != null && String(search.value).trim() !== '';
  const canReset = Boolean(onReset && (activeFields.length > 0 || hasQuery));

  function stableFocus() {
    const scope = open ? drawerBody.current : root.current?.querySelector('.rhine-list-filter-bar__main');
    const target = scope?.querySelector<HTMLElement>(focusable);
    (target ?? root.current)?.focus();
  }

  function reset() {
    stableFocus();
    onReset?.();
  }

  function clear(field: ListFilterField) {
    // A removed chip must not leave keyboard focus on the document body.
    const control = Array.from(root.current?.querySelectorAll<HTMLElement>('[data-filter-id]') ?? [])
      .find(node => node.dataset.filterId === field.id)?.querySelector<HTMLElement>(focusable);
    if (control) control.focus(); else stableFocus();
    field.onClear?.();
  }

  return <div ref={root} tabIndex={-1} className={`rhine-list-filter-bar ${className}`}>
    <Surface role="group" aria-label={label} className="rhine-list-filter-bar__surface">
      <div className="rhine-list-filter-bar__main">
        {search && <div className="rhine-list-filter-bar__search"><TextField type="search" {...search} /></div>}
        {visibleFields.length > 0 && <div className="rhine-list-filter-bar__primary">
          {visibleFields.map(field => <div key={field.id} data-filter-id={field.id} className="rhine-list-filter-bar__field" role="group" aria-label={field.label}>{field.control}</div>)}
        </div>}
        {(drawerFields.length > 0 || refresh || action) && <div className="rhine-list-filter-bar__actions">
          {drawerFields.length > 0 && <Drawer
            title={label}
            description={drawerDescription}
            open={open}
            onOpenChange={setOpen}
            trigger={<Button variant="secondary" aria-label={activeDrawerCount > 0 ? `更多筛选，已选 ${activeDrawerCount} 项` : undefined}>更多筛选{activeDrawerCount > 0 && <span className="rhine-list-filter-bar__count" aria-hidden="true">{activeDrawerCount}</span>}</Button>}
          >
            <div ref={drawerBody} className="rhine-list-filter-bar__drawer">
              <Feedback result={drawerResult === undefined ? result : drawerResult} pending={pending} error={error} />
              {drawerFields.map(field => <div key={field.id} data-filter-id={field.id} className="rhine-list-filter-bar__field" role="group" aria-label={field.label}>{field.control}</div>)}
              {canReset && <div className="rhine-list-filter-bar__drawer-actions"><Button variant="quiet" onClick={reset}>重置筛选</Button></div>}
            </div>
          </Drawer>}
          {refresh && <Button variant="secondary" onClick={refresh.onClick} busy={refresh.busy} disabled={refresh.disabled} busyLabel="正在刷新">刷新</Button>}
          {action && <div className="rhine-list-filter-bar__action">{action}</div>}
        </div>}
      </div>
      {(activeFields.length > 0 || canReset) && <div className="rhine-list-filter-bar__active" role="group" aria-label="已选条件">
        {activeFields.map(field => field.onClear
          ? <Button key={field.id} variant="quiet" className="rhine-list-filter-bar__chip" onClick={() => clear(field)} aria-label={`清除${field.label}：${field.activeLabel}`}><span>{field.label}：{field.activeLabel}</span><span aria-hidden="true">×</span></Button>
          : <span key={field.id} className="rhine-list-filter-bar__summary">{field.label}：{field.activeLabel}</span>)}
        {canReset && <Button variant="quiet" onClick={reset}>重置筛选</Button>}
      </div>}
      <Feedback result={result} pending={pending} error={error} announce={!open} />
    </Surface>
  </div>;
}
