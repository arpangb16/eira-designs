import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';
import LogosClient from './_components/logos-client';

export const dynamic = 'force-dynamic';

export default async function LogosPage() {
  const session = await getServerSession(authOptions);
  if (!session) {
    redirect('/login');
  }

  // Fetch logos
  const logos = await prisma.logo.findMany({
    include: {
      school: { select: { id: true, name: true } },
      team: { select: { id: true, name: true, schoolId: true } },
      project: { select: { id: true, name: true } },
      item: { select: { id: true, name: true } },
    },
    orderBy: { createdAt: 'desc' },
  });

  // Fetch schools, teams, projects, items for dropdowns
  const schools = await prisma.school.findMany({
    orderBy: { name: 'asc' },
  });

  const teams = await prisma.team.findMany({
    include: {
      school: { select: { id: true, name: true } },
    },
    orderBy: { name: 'asc' },
  });

  const projects = await prisma.project.findMany({
    orderBy: { name: 'asc' },
  });

  const items = await prisma.item.findMany({
    orderBy: { name: 'asc' },
  });

  return (
    <LogosClient
      initialLogos={logos}
      schools={schools}
      teams={teams}
      projects={projects}
      items={items}
    />
  );
}
