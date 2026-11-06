import { getSection, getRoles } from '@/lib/loadConfig';
import AccessNotice from '@/components/AccessNotice';
import AutoroleForm from './AutoroleForm';
import type { AutoroleSection } from '@/lib/types';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Autorole' };

export default async function AutorolePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [autorole, roles] = await Promise.all([
    getSection<AutoroleSection>(id, 'autorole'),
    getRoles(id),
  ]);
  if (!autorole) return <AccessNotice kind="bot-offline" />;

  return (
    <main className="content">
      <div className="page-head">
        <h1>Autorole</h1>
        <p>Roles que el bot asigna solo al entrar: para miembros y para bots.</p>
      </div>
      <AutoroleForm guildId={id} initial={autorole} roles={roles} />
    </main>
  );
}
