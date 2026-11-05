import { getBundleConfig, getChannels } from '@/lib/loadConfig';
import AccessNotice from '@/components/AccessNotice';
import HoneypotForm from './HoneypotForm';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Honeypot' };

export default async function HoneypotPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [bundle, channels] = await Promise.all([getBundleConfig(id), getChannels(id)]);
  if (!bundle) return <AccessNotice kind="bot-offline" />;

  return (
    <main className="content">
      <div className="page-head">
        <h1>Honeypot</h1>
        <p>Un canal señuelo para bots de raid y spammers automáticos. Quien escribe ahí, no vuelve.</p>
      </div>
      <HoneypotForm guildId={id} initial={bundle.honeypot} channels={channels} />
    </main>
  );
}
