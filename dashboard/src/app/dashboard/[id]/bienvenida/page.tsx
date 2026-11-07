import { getBundleConfig, getChannels } from '@/lib/loadConfig';
import AccessNotice from '@/components/AccessNotice';
import WelcomeForm from './WelcomeForm';
import PageHead from '@/components/PageHead';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Bienvenidas' };

export default async function WelcomePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [bundle, channels] = await Promise.all([getBundleConfig(id), getChannels(id)]);
  if (!bundle) return <AccessNotice kind="bot-offline" />;

  return (
    <main className="content">
      <PageHead title="Bienvenidas y despedidas" description="Mensaje, canal y tarjeta cuando alguien entra o sale. Los cambios se aplican al instante." />
      <WelcomeForm guildId={id} initial={bundle.welcome} channels={channels} />
    </main>
  );
}
