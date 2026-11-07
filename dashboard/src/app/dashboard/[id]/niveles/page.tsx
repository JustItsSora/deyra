import { getSection, getChannels, getRoles } from '@/lib/loadConfig';
import AccessNotice from '@/components/AccessNotice';
import LevelsForm from './LevelsForm';
import type { LevelsSection } from '@/lib/types';
import PageHead from '@/components/PageHead';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Niveles' };

export default async function LevelsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [levels, channels, roles] = await Promise.all([
    getSection<LevelsSection>(id, 'levels'),
    getChannels(id),
    getRoles(id),
  ]);
  if (!levels) return <AccessNotice kind="bot-offline" />;

  return (
    <main className="content">
      <PageHead title="Niveles y XP" description="Cuánto XP ganan, dónde se anuncia y qué roles se otorgan solos al subir de nivel." />
      <LevelsForm guildId={id} initial={levels} channels={channels} roles={roles} />
    </main>
  );
}
