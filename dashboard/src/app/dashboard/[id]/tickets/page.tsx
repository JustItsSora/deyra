import { getSection, getChannels, getRoles } from '@/lib/loadConfig';
import AccessNotice from '@/components/AccessNotice';
import TicketsForm from './TicketsForm';
import type { TicketsSection } from '@/lib/types';
import PageHead from '@/components/PageHead';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Tickets' };

export default async function TicketsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [tickets, channels, roles] = await Promise.all([
    getSection<TicketsSection>(id, 'tickets'),
    getChannels(id),
    getRoles(id),
  ]);
  if (!tickets) return <AccessNotice kind="bot-offline" />;

  return (
    <main className="content">
      <PageHead title="Tickets" description="Categoría, equipo de soporte, panel y mensaje de bienvenida del sistema de soporte." />
      <TicketsForm guildId={id} initial={tickets} channels={channels} roles={roles} />
    </main>
  );
}
