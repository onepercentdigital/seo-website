import { createFileRoute } from '@tanstack/react-router';
import { SolutionPageTemplate } from '@/components/SolutionPageTemplate';
import { getSolutionBySlug } from '@/data/solutions';
import { generateMetaTags } from '@/lib/seo';

export const Route = createFileRoute('/solutions/agriculture')({
  component: AgriculturePage,
  head: () =>
    generateMetaTags({
      title: 'Agriculture Marketing - Rank in AI & Generate Equipment Leads',
      description:
        'Get recommended when farmers search for equipment and services. Reach agricultural buyers through GEO, SEO, and targeted lead generation.',
      url: 'https://op.digital/solutions/agriculture',
    }),
});

function AgriculturePage() {
  const solution = getSolutionBySlug('agriculture');

  if (!solution) {
    return <div>Solution not found</div>;
  }

  return <SolutionPageTemplate solution={solution} />;
}
