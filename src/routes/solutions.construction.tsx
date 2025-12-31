import { createFileRoute } from '@tanstack/react-router';
import { SolutionPageTemplate } from '@/components/SolutionPageTemplate';
import { getSolutionBySlug } from '@/data/solutions';
import { generateMetaTags } from '@/lib/seo';

export const Route = createFileRoute('/solutions/construction')({
  component: ConstructionPage,
  head: () =>
    generateMetaTags({
      title: 'Construction Marketing - Rank in AI & Generate Project Leads',
      description:
        'Get recommended when property owners search for contractors. Win local searches and drive qualified project leads through GEO, SEO, and PPL.',
      url: 'https://op.digital/solutions/construction',
    }),
});

function ConstructionPage() {
  const solution = getSolutionBySlug('construction');

  if (!solution) {
    return <div>Solution not found</div>;
  }

  return <SolutionPageTemplate solution={solution} />;
}
