import { useMemo, useState } from 'react';
import { Link, useNavigate } from '@tanstack/react-router';
import { newId } from '../../shared/recipe';
import { BASE_NAME, emptyTopping, TOPPING_LIMITS, type Base, type Topping, type ToppingData } from '../../shared/topping';
import { CLASSICS } from '../lib/classics';
import { matches, summary, type Classic } from '../lib/toppings';
import { primeTopping, useSaveTopping, useToppings } from '../lib/query';
import { Page } from '../components/Page';
import { Icon } from '../components/Icon';

export function useCreateTopping() {
  const save = useSaveTopping();
  const navigate = useNavigate();
  return (from?: { name: string; data: ToppingData }) => {
    const now = Date.now();
    const t: Topping = {
      id: newId(),
      name: from ? from.name.slice(0, TOPPING_LIMITS.name) : 'My pizza',
      data: from ? structuredClone(from.data) : emptyTopping(),
      createdAt: now,
      updatedAt: now,
    };
    primeTopping(t); // synchronously, so the page never renders "not found" for a frame
    save.mutate(t);
    navigate({ to: '/toppings/$id', params: { id: t.id }, search: { edit: true }, viewTransition: { types: ['push'] } });
  };
}

type Filter = 'all' | 'red' | 'white' | 'other';
const FILTERS: { id: Filter; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'red', label: 'Red' },
  { id: 'white', label: 'White' },
  { id: 'other', label: 'Other' },
];
const inFilter = (f: Filter, base: Base) => f === 'all' || f === base || (f === 'other' && (base === 'green' || base === 'other'));

export function ToppingsPage() {
  const { data: mine, isPending } = useToppings();
  const [filter, setFilter] = useState<Filter>('all');
  const [q, setQ] = useState('');
  const create = useCreateTopping();

  const own = useMemo(
    () => (mine ?? []).filter((t) => inFilter(filter, t.data.base) && matches(q, { name: t.name, items: t.data.items })),
    [mine, filter, q],
  );
  const shown = useMemo(() => CLASSICS.filter((c) => inFilter(filter, c.base) && matches(q, c)), [filter, q]);
  const classics = shown.filter((c) => c.era === 'classic');
  const modern = shown.filter((c) => c.era === 'contemporary');
  const nothing = !own.length && !shown.length;

  return (
    <Page
      title="Toppings"
      large={<h1>Toppings</h1>}
      left={
        <Link to="/settings" className="nav-btn" aria-label="Settings" viewTransition={{ types: ['push'] }}>
          <Icon name="gear" />
        </Link>
      }
      right={
        <button type="button" className="nav-btn" aria-label="New topping" onClick={() => create()}>
          <Icon name="plus" size={26} />
        </button>
      }
    >
      <div className="find">
        <Icon name="search" size={18} />
        <input
          type="search"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search pizzas or ingredients"
          aria-label="Search toppings"
          enterKeyHint="search"
          autoComplete="off"
          autoCorrect="off"
          spellCheck={false}
        />
      </div>
      <div className="segmented" role="tablist" aria-label="Filter by base">
        {FILTERS.map((f) => (
          <button key={f.id} type="button" role="tab" aria-selected={filter === f.id} onClick={() => setFilter(f.id)}>
            {f.label}
          </button>
        ))}
      </div>

      {own.length ? (
        <List label="Yours">
          {own.map((t) => (
            <Row key={t.id} id={t.id} name={t.name || 'Untitled'} sub={summary(t.data.items) || 'No ingredients yet'} base={t.data.base} />
          ))}
        </List>
      ) : !q && filter === 'all' && !isPending ? (
        <button type="button" className="make" onClick={() => create()}>
          <span className="make-i" aria-hidden="true">
            <Icon name="plus" />
          </span>
          <span>
            <b>Create your own</b>
            <small>Write down your house pizza, or open any classic below and make it yours.</small>
          </span>
        </button>
      ) : null}

      {classics.length ? <ClassicList label="Italian classics" list={classics} /> : null}
      {modern.length ? <ClassicList label="Contemporary" list={modern} /> : null}

      {nothing ? (
        <div className="empty">
          <h2>No matches</h2>
          <p>Nothing has “{q}” in it{filter !== 'all' ? ` with a ${filter} base` : ''}.</p>
          <button
            type="button"
            className="btn"
            onClick={() => {
              setQ('');
              setFilter('all');
            }}
          >
            Show everything
          </button>
        </div>
      ) : null}
    </Page>
  );
}

function List({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <section className="tlist">
      <h2 className="group-label">{label}</h2>
      <ul className="list">{children}</ul>
    </section>
  );
}

function ClassicList({ label, list }: { label: string; list: Classic[] }) {
  return (
    <List label={label}>
      {list.map((c) => (
        <Row key={c.id} id={c.id} name={c.name} sub={summary(c.items)} base={c.base} />
      ))}
    </List>
  );
}

function Row({ id, name, sub, base }: { id: string; name: string; sub: string; base: Base }) {
  return (
    <li>
      <Link to="/toppings/$id" params={{ id }} className="row" viewTransition={{ types: ['push'] }}>
        <span className={`dot ${base}`} aria-hidden="true" />
        <span className="row-main">
          <span className="row-title">{name}</span>
          <span className="row-sub wrap">{sub}</span>
        </span>
        <span className="sr-only">{BASE_NAME[base]} base</span>
        <Icon name="chevron" size={18} className="row-chev" />
      </Link>
    </li>
  );
}
