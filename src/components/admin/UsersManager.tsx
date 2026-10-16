"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Plus } from "lucide-react";
import { deleteUser, saveUser } from "@/app/admin/actions";
import { Badge, Button, Input, Label, Modal, Select, useAction } from "./ui";

type U = { id: string; name: string; email: string; role: string; createdAt: string };

export function UsersManager({ users, me }: { users: U[]; me: string }) {
  const router = useRouter();
  const { run, pending } = useAction();
  const [edit, setEdit] = useState<(Omit<U, "createdAt"> & { password: string }) | null>(null);

  return (
    <>
      <div className="mb-4 flex justify-end">
        <Button onClick={() => setEdit({ id: "", name: "", email: "", role: "editor", password: "" })}>
          <Plus size={15} /> Invite user
        </Button>
      </div>
      <div className="divide-y divide-zinc-100 rounded-2xl border border-zinc-200 bg-white">
        {users.map((u) => (
          <div key={u.id} className="flex items-center gap-4 px-5 py-3">
            <span className="grid h-9 w-9 place-items-center rounded-full bg-zinc-100 text-sm font-medium">{u.name[0]?.toUpperCase()}</span>
            <div className="flex-1">
              <p className="font-medium">
                {u.name} {u.id === me && <span className="text-xs font-normal text-zinc-400">(you)</span>}
              </p>
              <p className="text-sm text-zinc-500">{u.email}</p>
            </div>
            <Badge tone={u.role === "admin" ? "violet" : "zinc"}>{u.role}</Badge>
            <Button size="sm" variant="secondary" onClick={() => setEdit({ ...u, password: "" })}>
              Edit
            </Button>
          </div>
        ))}
      </div>
      <Modal open={!!edit} onClose={() => setEdit(null)} title={edit?.id ? "Edit user" : "New user"}>
        {edit && (
          <form
            className="space-y-4"
            onSubmit={async (e) => {
              e.preventDefault();
              const r = await run(() => saveUser(edit.id || null, edit), "User saved");
              if (r) {
                setEdit(null);
                router.refresh();
              }
            }}
          >
            <div>
              <Label>Name</Label>
              <Input required value={edit.name} onChange={(e) => setEdit({ ...edit, name: e.target.value })} />
            </div>
            <div>
              <Label>Email</Label>
              <Input required type="email" value={edit.email} onChange={(e) => setEdit({ ...edit, email: e.target.value })} />
            </div>
            <div>
              <Label>Role</Label>
              <Select value={edit.role} onChange={(e) => setEdit({ ...edit, role: e.target.value })}>
                <option value="editor">Editor</option>
                <option value="admin">Administrator</option>
              </Select>
            </div>
            <div>
              <Label help={edit.id ? "Leave blank to keep the current password." : "At least 8 characters."}>Password</Label>
              <Input type="password" value={edit.password} onChange={(e) => setEdit({ ...edit, password: e.target.value })} />
            </div>
            <div className="flex justify-between pt-2">
              {edit.id && edit.id !== me ? (
                <Button
                  type="button"
                  variant="danger"
                  onClick={async () => {
                    if (!confirm("Remove this user?")) return;
                    const r = await run(() => deleteUser(edit.id), "User removed");
                    if (r) {
                      setEdit(null);
                      router.refresh();
                    }
                  }}
                >
                  Remove
                </Button>
              ) : (
                <span />
              )}
              <Button loading={pending}>Save</Button>
            </div>
          </form>
        )}
      </Modal>
    </>
  );
}
