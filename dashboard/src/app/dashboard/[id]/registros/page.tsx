import { getBundleConfig, getChannels, getRoles } from '@/lib/loadConfig';
import AccessNotice from '@/components/AccessNotice';
import RegistrosForm from './RegistrosForm';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Registros' };

export default async function RegistrosPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [bundle, channels, roles] = await Promise.all([getBundleConfig(id), getChannels(id), getRoles(id)]);
  if (!bundle) return <AccessNotice kind="bot-offline" />;

  return (
    <main className="content">
      <div className="page-head">
        <h1>Registros</h1>
        <p>Dónde publica Deyra cada tipo de evento. Elige un canal o deja «Sin canal» para desactivarlo.</p>
      </div>
      <RegistrosForm guildId={id} initial={bundle.guild} channels={channels} roles={roles} />
    </main>
  );
}
