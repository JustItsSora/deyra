import { getBundleConfig, getChannels } from '@/lib/loadConfig';
import AccessNotice from '@/components/AccessNotice';
import GeneralForm from './GeneralForm';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'General' };

export default async function GeneralPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [bundle, channels] = await Promise.all([getBundleConfig(id), getChannels(id)]);
  if (!bundle) return <AccessNotice kind="bot-offline" />;

  return (
    <main className="content">
      <div className="page-head">
        <h1>General</h1>
        <p>Comportamiento básico de Deyra en este servidor. Los cambios se aplican al instante.</p>
      </div>
      <GeneralForm guildId={id} initial={bundle.guild} channels={channels} />
    </main>
  );
}
