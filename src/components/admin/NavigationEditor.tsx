"use client";

import { useState } from "react";
import { ArrowDown, ArrowUp, Plus, Trash2 } from "lucide-react";
import { saveNavigation } from "@/app/admin/actions";
import type { NavLink, Navigation } from "@/lib/settings-types";
import { Button, Card, Input, useAction } from "./ui";

function LinksEditor({ links, onChange, suggestions }: { links: NavLink[]; onChange: (l: NavLink[]) => void; suggestions: NavLink[] }) {
  const move = (i: number, d: number) => {
    const n = [...links];
    const [x] = n.splice(i, 1);
    n.splice(i + d, 0, x);
    onChange(n);
  };
  return (
    <div className="space-y-2">
      {links.map((l, i) => (
        <div key={i} className="flex gap-2">
          <Input value={l.label} placeholder="Label" onChange={(e) => onChange(links.map((x, k) => (k === i ? { ...x, label: e.target.value } : x)))} className="w-2/5" />
          <Input value={l.href} placeholder="/link" list="nav-suggestions" onChange={(e) => onChange(links.map((x, k) => (k === i ? { ...x, href: e.target.value } : x)))} />
          <Button type="button" variant="ghost" size="sm" disabled={i === 0} onClick={() => move(i, -1)}>
            <ArrowUp size={13} />
          </Button>
          <Button type="button" variant="ghost" size="sm" disabled={i === links.length - 1} onClick={() => move(i, 1)}>
            <ArrowDown size={13} />
          </Button>
          <Button type="button" variant="ghost" size="sm" onClick={() => onChange(links.filter((_, k) => k !== i))}>
            <Trash2 size={13} />
          </Button>
        </div>
      ))}
      <Button type="button" size="sm" variant="secondary" onClick={() => onChange([...links, { label: "", href: "" }])}>
        <Plus size={13} /> Add link
      </Button>
      <datalist id="nav-suggestions">
        {suggestions.map((s) => (
          <option key={s.href} value={s.href}>
            {s.label}
          </option>
        ))}
      </datalist>
    </div>
  );
}

export function NavigationEditor({ initial, suggestions }: { initial: Navigation; suggestions: NavLink[] }) {
  const [nav, setNav] = useState(initial);
  const { run, pending } = useAction();
  return (
    <div className="space-y-6">
      <Card title="Header menu" description="Links are split evenly on either side of your logo on desktop.">
        <LinksEditor links={nav.header} onChange={(header) => setNav({ ...nav, header })} suggestions={suggestions} />
      </Card>
      <Card title="Footer columns" actions={<Button size="sm" variant="secondary" onClick={() => setNav({ ...nav, footer: [...nav.footer, { title: "New column", links: [] }] })}>+ Column</Button>}>
        <div className="grid gap-6 md:grid-cols-2">
          {nav.footer.map((col, i) => (
            <div key={i} className="rounded-xl border border-zinc-200 p-4">
              <div className="mb-3 flex gap-2">
                <Input value={col.title} onChange={(e) => setNav({ ...nav, footer: nav.footer.map((c, k) => (k === i ? { ...c, title: e.target.value } : c)) })} className="font-medium" />
                <Button variant="ghost" onClick={() => setNav({ ...nav, footer: nav.footer.filter((_, k) => k !== i) })}>
                  <Trash2 size={14} />
                </Button>
              </div>
              <LinksEditor links={col.links} suggestions={suggestions} onChange={(links) => setNav({ ...nav, footer: nav.footer.map((c, k) => (k === i ? { ...c, links } : c)) })} />
            </div>
          ))}
        </div>
      </Card>
      <div className="flex justify-end">
        <Button loading={pending} onClick={() => run(() => saveNavigation(nav), "Navigation saved")}>
          Save navigation
        </Button>
      </div>
    </div>
  );
}
