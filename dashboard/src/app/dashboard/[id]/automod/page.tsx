import { getBundleConfig, getChannels, getRoles } from '@/lib/loadConfig';
import AccessNotice from '@/components/AccessNotice';
import AutomodForm from './AutomodForm';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Automod' };

export default async function AutomodPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [bundle, channels, roles] = await Promise.all([getBundleConfig(id), getChannels(id), getRoles(id)]);
  if (!bundle) return <AccessNotice kind="bot-offline" />;

  return (
    <main className="content">
      <div className="page-head">
        <h1>Automod</h1>
        <p>Filtro automático de mensajes y ediciones. Desactiva protecciones sueltas o el conjunto completo arriba.</p>
      </div>
      <AutomodForm guildId={id} initial={bundle.automod} channels={channels} roles={roles} />
    </main>
  );
}
