import { getBundleConfig, getChannels } from '@/lib/loadConfig';
import AccessNotice from '@/components/AccessNotice';
import HoneypotForm from './HoneypotForm';
import PageHead from '@/components/PageHead';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Honeypot' };

export default async function HoneypotPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [bundle, channels] = await Promise.all([getBundleConfig(id), getChannels(id)]);
  if (!bundle) return <AccessNotice kind="bot-offline" />;

  return (
    <main className="content">
      <PageHead title="Honeypot" description="Un canal señuelo para bots de raid y spammers automáticos. Quien escribe ahí, no vuelve." />
      <HoneypotForm guildId={id} initial={bundle.honeypot} channels={channels} language={bundle.guild?.language ?? null} />
    </main>
  );
}
