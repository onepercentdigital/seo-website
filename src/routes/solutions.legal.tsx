import { createFileRoute } from '@tanstack/react-router';
import { SolutionPageTemplate } from '@/components/SolutionPageTemplate';
import { getSolutionBySlug } from '@/data/solutions';
import { generateMetaTags } from '@/lib/seo';

export const Route = createFileRoute('/solutions/legal')({
  component: LegalPage,
  head: () =>
    generateMetaTags({
      title: 'Law Firm Marketing - Rank in AI & Generate Case Inquiries',
      description:
        'Get recommended when people search for legal help. Dominate local search and drive qualified case inquiries through GEO, SEO, and PPL.',
      url: 'https://op.digital/solutions/legal',
    }),
});

function LegalPage() {
  const solution = getSolutionBySlug('legal');

  if (!solution) {
    return <div>Solution not found</div>;
  }

  return <SolutionPageTemplate solution={solution} />;
}
