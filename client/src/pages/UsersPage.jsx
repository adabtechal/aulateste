import { useEffect, useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Building2, LockKeyhole, ShieldCheck, UserPlus, Users } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../contexts/AuthContext';
import * as api from '../services/api';

const roleOptions = {
  superadmin: [
    { value: 'tenant_admin', label: 'Administrador de Tenant' },
    { value: 'tenant_user', label: 'Usuário de Tenant' },
  ],
  tenant_admin: [
    { value: 'tenant_user', label: 'Usuário da Minha Tenant' },
  ],
};

const roleLabels = {
  superadmin: 'Super Admin',
  tenant_admin: 'Administrador',
  tenant_user: 'Usuário',
};

const initialForm = {
  fullName: '',
  email: '',
  password: '',
  role: 'tenant_admin',
  tenantId: '',
  tenantName: '',
  tenantSlug: '',
  tenantPlan: 'pro',
  tenantMaxUsers: '10',
};

export default function UsersPage() {
  const queryClient = useQueryClient();
  const { profile, isSuperAdmin, isTenantAdmin } = useAuth();
  const [form, setForm] = useState(initialForm);

  const canManageUsers = isSuperAdmin || isTenantAdmin;
  const availableRoles = roleOptions[profile?.role] || [];

  const { data: users = [], isLoading } = useQuery({
    queryKey: ['users'],
    queryFn: api.getUsers,
    enabled: canManageUsers,
  });

  const { data: tenants = [] } = useQuery({
    queryKey: ['user-tenants'],
    queryFn: api.getUserTenants,
    enabled: isSuperAdmin,
  });

  const selectedRole = form.role;
  const requiresTenantCreation = isSuperAdmin && selectedRole === 'tenant_admin';
  const requiresTenantSelection = selectedRole === 'tenant_user';

  const activeUsers = useMemo(
    () => users.filter((user) => user.is_active),
    [users]
  );

  useEffect(() => {
    if (availableRoles.length === 0) return;

    setForm((current) => {
      if (availableRoles.some((option) => option.value === current.role)) {
        return current;
      }

      return { ...current, role: availableRoles[0].value };
    });
  }, [availableRoles]);

  const createMut = useMutation({
    mutationFn: api.createUser,
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      queryClient.invalidateQueries({ queryKey: ['user-tenants'] });
      setForm({
        ...initialForm,
        role: isSuperAdmin ? 'tenant_admin' : 'tenant_user',
      });

      if (response.profile?.role === 'tenant_admin') {
        toast.success('Tenant e administrador criados com sucesso');
        return;
      }

      toast.success('Usuário criado com sucesso');
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Não foi possível criar o usuário');
    },
  });

  function updateField(field, value) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  function handleSubmit(event) {
    event.preventDefault();

    const payload = {
      fullName: form.fullName.trim(),
      email: form.email.trim(),
      password: form.password,
      role: form.role,
    };

    if (requiresTenantCreation) {
      payload.tenantName = form.tenantName.trim();
      payload.tenantSlug = form.tenantSlug.trim();
      payload.tenantPlan = form.tenantPlan;
      payload.tenantMaxUsers = Number(form.tenantMaxUsers);
    }

    if (requiresTenantSelection && isSuperAdmin) {
      payload.tenantId = form.tenantId;
    }

    createMut.mutate(payload);
  }

  if (!canManageUsers) {
    return (
      <div className="min-h-screen p-6">
        <div className="mx-auto max-w-3xl rounded-[28px] border border-amber-200 bg-gradient-to-br from-amber-50 via-white to-orange-50 p-8 shadow-sm">
          <div className="mb-6 inline-flex rounded-full bg-amber-100 p-3 text-amber-700">
            <LockKeyhole size={22} />
          </div>
          <h2 className="text-2xl font-semibold text-slate-900">Acesso restrito</h2>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600">
            A gestão de usuários fica disponível apenas para perfis com permissão administrativa.
            Se você precisa cadastrar pessoas na sua operação, solicite acesso ao administrador da tenant.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,_rgba(37,99,235,0.12),_transparent_28%),radial-gradient(circle_at_top_right,_rgba(14,165,233,0.14),_transparent_24%),linear-gradient(180deg,_#f8fbff_0%,_#eef4ff_100%)] p-6">
      <div className="mx-auto max-w-7xl space-y-6">
        <section className="overflow-hidden rounded-[32px] border border-sky-100 bg-slate-950 text-white shadow-[0_20px_80px_rgba(15,23,42,0.18)]">
          <div className="grid gap-6 px-8 py-8 lg:grid-cols-[1.4fr_0.8fr]">
            <div>
              <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs uppercase tracking-[0.24em] text-sky-100">
                <ShieldCheck size={14} />
                Controle de Acesso
              </div>
              <h1 className="max-w-2xl text-3xl font-semibold leading-tight">
                Crie usuários com a estrutura de tenant correta desde o primeiro acesso.
              </h1>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-300">
                O fluxo respeita as roles da base: `superadmin` cria tenant com seu administrador,
                enquanto `tenant_admin` cria usuários somente dentro da própria operação.
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-1">
              <MetricCard
                icon={Users}
                label="Usuários ativos"
                value={String(activeUsers.length)}
                accent="bg-sky-500/15 text-sky-200"
              />
              <MetricCard
                icon={Building2}
                label="Tenants visíveis"
                value={String(isSuperAdmin ? tenants.length : profile?.tenant?.name ? 1 : 0)}
                accent="bg-emerald-500/15 text-emerald-200"
              />
              <MetricCard
                icon={ShieldCheck}
                label="Seu papel"
                value={roleLabels[profile?.role] || profile?.role}
                accent="bg-white/10 text-slate-100"
              />
            </div>
          </div>
        </section>

        <div className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
          <section className="rounded-[28px] border border-white/70 bg-white/90 p-6 shadow-[0_18px_60px_rgba(148,163,184,0.18)] backdrop-blur">
            <div className="mb-6 flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-sky-700">Novo usuário</p>
                <h2 className="mt-2 text-2xl font-semibold text-slate-900">
                  {requiresTenantCreation ? 'Nova tenant com administrador' : 'Cadastro controlado por role'}
                </h2>
              </div>
              <div className="rounded-2xl bg-sky-100 p-3 text-sky-700">
                <UserPlus size={20} />
              </div>
            </div>

            <form className="space-y-5" onSubmit={handleSubmit}>
              <div className="grid gap-4 md:grid-cols-2">
                <Field
                  label="Nome completo"
                  value={form.fullName}
                  onChange={(value) => updateField('fullName', value)}
                  placeholder="Ex: Marina Costa"
                />
                <Field
                  label="E-mail"
                  type="email"
                  value={form.email}
                  onChange={(value) => updateField('email', value)}
                  placeholder="marina@empresa.com"
                />
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <Field
                  label="Senha inicial"
                  type="password"
                  value={form.password}
                  onChange={(value) => updateField('password', value)}
                  placeholder="Mínimo recomendado: 6 caracteres"
                />
                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700">Perfil</label>
                  <select
                    value={form.role}
                    onChange={(event) => updateField('role', event.target.value)}
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-sky-400 focus:bg-white"
                  >
                    {availableRoles.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {requiresTenantCreation && (
                <div className="rounded-[24px] border border-emerald-100 bg-emerald-50/70 p-5">
                  <div className="mb-4">
                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-700">Tenant vinculada</p>
                    <p className="mt-2 text-sm text-emerald-900">
                      Ao criar um `tenant_admin`, a tenant nasce no mesmo fluxo e já fica vinculada ao usuário.
                    </p>
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    <Field
                      label="Nome da tenant"
                      value={form.tenantName}
                      onChange={(value) => updateField('tenantName', value)}
                      placeholder="Ex: Clínica Aurora"
                    />
                    <Field
                      label="Slug"
                      value={form.tenantSlug}
                      onChange={(value) => updateField('tenantSlug', value)}
                      placeholder="clinica-aurora"
                    />
                    <Field
                      label="Plano"
                      value={form.tenantPlan}
                      onChange={(value) => updateField('tenantPlan', value)}
                      placeholder="pro"
                    />
                    <Field
                      label="Máximo de usuários"
                      type="number"
                      min="1"
                      value={form.tenantMaxUsers}
                      onChange={(value) => updateField('tenantMaxUsers', value)}
                      placeholder="10"
                    />
                  </div>
                </div>
              )}

              {requiresTenantSelection && isSuperAdmin && (
                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700">Tenant de destino</label>
                  <select
                    value={form.tenantId}
                    onChange={(event) => updateField('tenantId', event.target.value)}
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-sky-400 focus:bg-white"
                    required
                  >
                    <option value="">Selecione uma tenant</option>
                    {tenants.map((tenant) => (
                      <option key={tenant.id} value={tenant.id}>
                        {tenant.name} ({tenant.slug})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {isTenantAdmin && (
                <div className="rounded-2xl border border-sky-100 bg-sky-50 px-4 py-3 text-sm text-sky-900">
                  Novos usuários serão vinculados automaticamente à tenant <strong>{profile?.tenant?.name}</strong>.
                </div>
              )}

              <button
                type="submit"
                disabled={createMut.isPending}
                className="inline-flex items-center gap-2 rounded-2xl bg-slate-950 px-5 py-3 text-sm font-medium text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <UserPlus size={16} />
                {createMut.isPending ? 'Criando...' : requiresTenantCreation ? 'Criar tenant e administrador' : 'Criar usuário'}
              </button>
            </form>
          </section>

          <section className="rounded-[28px] border border-white/70 bg-white/90 p-6 shadow-[0_18px_60px_rgba(148,163,184,0.18)] backdrop-blur">
            <div className="mb-6 flex items-end justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">Usuários cadastrados</p>
                <h2 className="mt-2 text-2xl font-semibold text-slate-900">Visão operacional por tenant</h2>
              </div>
            </div>

            <div className="overflow-hidden rounded-[24px] border border-slate-100">
              <table className="min-w-full divide-y divide-slate-100">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Usuário</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Role</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Tenant</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white">
                  {users.map((user) => (
                    <tr key={user.id} className="transition hover:bg-slate-50/80">
                      <td className="px-4 py-4">
                        <div>
                          <p className="text-sm font-medium text-slate-900">{user.full_name}</p>
                          <p className="text-sm text-slate-500">{user.email}</p>
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <span className="inline-flex rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-700">
                          {roleLabels[user.role] || user.role}
                        </span>
                      </td>
                      <td className="px-4 py-4 text-sm text-slate-600">
                        {user.tenant?.name || 'Sem tenant'}
                      </td>
                      <td className="px-4 py-4">
                        <span
                          className={`inline-flex rounded-full px-3 py-1 text-xs font-medium ${
                            user.is_active
                              ? 'bg-emerald-100 text-emerald-700'
                              : 'bg-rose-100 text-rose-700'
                          }`}
                        >
                          {user.is_active ? 'Ativo' : 'Inativo'}
                        </span>
                      </td>
                    </tr>
                  ))}

                  {!isLoading && users.length === 0 && (
                    <tr>
                      <td colSpan={4} className="px-4 py-10 text-center text-sm text-slate-400">
                        Nenhum usuário encontrado para este escopo.
                      </td>
                    </tr>
                  )}

                  {isLoading && (
                    <tr>
                      <td colSpan={4} className="px-4 py-10 text-center text-sm text-slate-400">
                        Carregando usuários...
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}

function MetricCard({ icon: Icon, label, value, accent }) {
  return (
    <div className="rounded-3xl border border-white/10 bg-white/5 p-4">
      <div className={`mb-3 inline-flex rounded-2xl p-2 ${accent}`}>
        <Icon size={16} />
      </div>
      <p className="text-xs uppercase tracking-[0.18em] text-slate-400">{label}</p>
      <p className="mt-2 text-xl font-semibold text-white">{value}</p>
    </div>
  );
}

function Field({ label, onChange, ...props }) {
  return (
    <div>
      <label className="mb-2 block text-sm font-medium text-slate-700">{label}</label>
      <input
        {...props}
        onChange={(event) => onChange(event.target.value)}
        className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-sky-400 focus:bg-white"
      />
    </div>
  );
}
