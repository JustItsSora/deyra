import { getBundleConfig, getRoles } from '@/lib/loadConfig';
import AccessNotice from '@/components/AccessNotice';
import AntiNukeForm from './AntiNukeForm';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Anti-nuke' };

export default async function AntiNukePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [bundle, roles] = await Promise.all([getBundleConfig(id), getRoles(id)]);
  if (!bundle) return <AccessNotice kind="bot-offline" />;

  return (
    <main className="content">
      <div className="page-head">
        <h1>Anti-nuke</h1>
        <p>Corta de raíz las ráfagas de acciones destructivas: canales borrados, roles, baneos masivos, webhooks y bots.</p>
      </div>
      <AntiNukeForm guildId={id} initial={bundle.antinuke} roles={roles} />
    </main>
  );
}
