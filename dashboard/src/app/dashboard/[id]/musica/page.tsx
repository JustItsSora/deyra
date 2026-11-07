import { getSection, getChannels, getRoles } from '@/lib/loadConfig';
import AccessNotice from '@/components/AccessNotice';
import MusicaForm from './MusicaForm';
import type { MusicSection } from '@/lib/types';
import PageHead from '@/components/PageHead';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Música' };

export default async function MusicaPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [music, channels, roles] = await Promise.all([
    getSection<MusicSection>(id, 'music'),
    getChannels(id),
    getRoles(id),
  ]);
  if (!music) return <AccessNotice kind="bot-offline" />;

  return (
    <main className="content">
      <PageHead title="Música" description="Volumen, autoplay, fairplay, modo 24/7 y límites del reproductor." />
      <MusicaForm guildId={id} initial={music} channels={channels} roles={roles} />
    </main>
  );
}
