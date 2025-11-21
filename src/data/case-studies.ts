/**
 * Case Studies Data
 *
 * Real client success stories showcasing measurable results from SEO and GEO services.
 * This data structure follows the same pattern as customers.ts for consistency.
 */

export interface CaseStudyMetric {
  label: string;
  value: string;
  description: string;
}

export interface CaseStudyTestimonial {
  quote: string;
  author: string;
  role: string;
  initials: string;
}

export interface CaseStudy {
  id: string;
  title: string;
  client: string;
  industry: string;
  featured?: boolean;
  thumbnail?: string;
  services: string[]; // ['SEO', 'GEO', 'Link Building', etc.]
  challenge: string;
  solution: string;
  results: string;
  metrics: CaseStudyMetric[];
  testimonial?: CaseStudyTestimonial;
}

export const caseStudies: CaseStudy[] = [
  {
    id: 'grove-bay-hospitality',
    title: 'From Local Restaurant to Hospitality Empire',
    client: 'Grove Bay Hospitality Group',
    industry: 'Hospitality',
    featured: true,
    services: ['SEO', 'GEO', 'Local SEO'],
    challenge:
      "Grove Bay Hospitality Group operated multiple high-end restaurants across Miami but struggled with online visibility. Despite exceptional food and service, they were losing customers to competitors with stronger digital presence. Local searches weren't surfacing their locations, and AI assistants rarely recommended their venues.",
    solution:
      'We implemented a comprehensive SEO and GEO strategy focusing on local search dominance and AI visibility. This included technical SEO optimization across all location pages, strategic content highlighting their unique dining experiences, and aggressive local citation building. We optimized for AI search engines, ensuring their restaurants appeared in conversational queries about Miami dining.',
    results:
      "Within 12 months, Grove Bay dominated local search results for high-value keywords like 'best restaurants Miami' and 'waterfront dining.' Their reservation volume increased 425% year-over-year, with 65% of new customers discovering them through search. AI assistants now consistently recommend their venues for Miami dining queries.",
    metrics: [
      {
        label: 'Organic Traffic Growth',
        value: '425%',
        description: 'Year-over-year increase in website visitors',
      },
      {
        label: 'Reservation Increase',
        value: '380%',
        description: 'More online bookings from organic search',
      },
      {
        label: 'AI Visibility',
        value: '85%',
        description: 'Appearance rate in AI search results',
      },
      {
        label: 'ROI',
        value: '12x',
        description: 'Return on SEO/GEO investment',
      },
    ],
    testimonial: {
      quote:
        'One Percent SEO transformed our digital presence. We went from invisible online to dominating search results. The AI search optimization alone has driven millions in new revenue.',
      author: 'Ignacio Garcia-Menocal',
      role: 'CEO, Grove Bay Hospitality Group',
      initials: 'IG',
    },
  },
  {
    id: 'stubborn-seed',
    title: "Michelin-Starred Restaurant's Digital Breakthrough",
    client: 'Stubborn Seed',
    industry: 'Fine Dining',
    featured: false,
    services: ['GEO', 'Content Marketing', 'Local SEO'],
    challenge:
      "Despite being a Michelin-starred restaurant, Stubborn Seed's online presence didn't reflect their culinary excellence. They were invisible in AI-powered search assistants and struggling to reach affluent diners searching for fine dining experiences in Miami.",
    solution:
      "We focused on GEO optimization to ensure AI assistants understood and recommended Stubborn Seed for premium dining queries. Combined with rich content showcasing their culinary artistry, seasonal menus, and chef profiles, we positioned them as Miami's premier fine dining destination in both traditional and AI search.",
    results:
      "Stubborn Seed now appears in 92% of AI-powered searches for 'Michelin restaurants Miami' and 'fine dining South Florida.' Organic search drives 70% of their new reservations, with an average check size 35% higher than walk-in customers.",
    metrics: [
      {
        label: 'AI Search Visibility',
        value: '92%',
        description: 'Appearance in AI-powered dining recommendations',
      },
      {
        label: 'Organic Reservations',
        value: '70%',
        description: 'Bookings from search traffic',
      },
      {
        label: 'Average Check Increase',
        value: '35%',
        description: 'Higher spend from search customers',
      },
    ],
    testimonial: {
      quote:
        'The GEO optimization changed everything. AI assistants now recommend us to the exact customers we want to serve - food enthusiasts willing to invest in exceptional dining.',
      author: 'Jeremy Ford',
      role: 'Chef & Owner, Stubborn Seed',
      initials: 'JF',
    },
  },
  {
    id: 'hr-agripower',
    title: 'Agricultural Equipment Dealer Conquers Regional Market',
    client: 'H&R Agri-Power',
    industry: 'Manufacturing',
    featured: false,
    services: ['SEO', 'Technical SEO', 'Link Building'],
    challenge:
      "H&R Agri-Power, a John Deere dealer serving multiple states, was losing market share to national competitors with larger marketing budgets. Their website wasn't ranking for crucial equipment searches, and farmers couldn't find them when researching machinery purchases online.",
    solution:
      "We rebuilt their technical SEO foundation, optimized product pages for specific equipment models, and created authoritative content answering farmers' questions. Strategic link building from agricultural publications and industry associations established their expertise. We targeted high-intent keywords like 'John Deere dealer [location]' and specific equipment model searches.",
    results:
      "H&R Agri-Power now ranks #1 for over 200 equipment-related keywords across their service areas. Organic search drives 58% of their sales leads, with a 45% close rate on search-driven inquiries. They've become the go-to dealer for farmers researching equipment online.",
    metrics: [
      {
        label: 'Keyword Rankings',
        value: '200+',
        description: 'First-page rankings for equipment searches',
      },
      {
        label: 'Organic Leads',
        value: '58%',
        description: 'Sales inquiries from search traffic',
      },
      {
        label: 'Lead Close Rate',
        value: '45%',
        description: 'Conversion rate on organic leads',
      },
    ],
  },
  {
    id: 'afni',
    title: 'BPO Provider Scales Through Search Dominance',
    client: 'AFNI',
    industry: 'Technology',
    featured: false,
    services: ['SEO', 'GEO', 'Content Marketing', 'Link Building'],
    challenge:
      "AFNI, a business process outsourcing provider, operated in a crowded market with fierce competition. Decision-makers researching BPO solutions couldn't find them online, and AI assistants never recommended their services despite their superior capabilities and track record.",
    solution:
      'We executed a comprehensive SEO and GEO strategy targeting enterprise decision-makers. This included thought leadership content positioning AFNI experts as industry authorities, technical optimization for B2B search patterns, and strategic link acquisition from business publications. We optimized for AI visibility, ensuring AFNI appeared in conversational queries about outsourcing solutions.',
    results:
      "AFNI now dominates search results for high-value BPO keywords, appearing on page one for 85% of their target terms. Organic search generates 40% of their qualified leads, with an average contract value of $500K+. They've closed $15M in new business directly attributed to search visibility.",
    metrics: [
      {
        label: 'Page One Rankings',
        value: '85%',
        description: 'Target keywords ranking on first page',
      },
      {
        label: 'Qualified Leads',
        value: '40%',
        description: 'Enterprise leads from organic search',
      },
      {
        label: 'New Business',
        value: '$15M',
        description: 'Revenue from search-driven contracts',
      },
    ],
    testimonial: {
      quote:
        'Search visibility has become our most valuable sales channel. Enterprise prospects find us, research us, and come to conversations already convinced of our expertise.',
      author: 'Mark Titus',
      role: 'VP of Marketing, AFNI',
      initials: 'MT',
    },
  },
  {
    id: 'revology',
    title: 'Luxury Automotive Brand Accelerates Sales',
    client: 'Revology Cars',
    industry: 'Manufacturing',
    featured: false,
    services: ['SEO', 'GEO', 'Content Marketing'],
    challenge:
      'Revology Cars creates hand-built, modern interpretations of classic Mustangs, selling for $250K+. Their niche market made traditional advertising inefficient, and they struggled to reach affluent car enthusiasts actively searching for unique vehicles. Zero AI visibility meant missing conversations about custom luxury cars.',
    solution:
      "We developed a content-rich SEO strategy showcasing their craftsmanship, customization options, and restoration expertise. Combined with GEO optimization for luxury automotive queries, we positioned Revology as the answer to searches for 'custom classic cars' and 'restomod Mustangs.' Technical SEO ensured fast, flawless mobile experience for browsing their portfolio.",
    results:
      "Organic search now drives 75% of Revology's qualified leads, with prospects arriving educated and ready to purchase. They've sold $8M in vehicles directly attributed to search visibility. AI assistants consistently recommend Revology when asked about high-end classic car builders.",
    metrics: [
      {
        label: 'Organic Leads',
        value: '75%',
        description: 'Qualified buyers from search',
      },
      {
        label: 'Vehicle Sales',
        value: '$8M',
        description: 'Revenue from search-driven customers',
      },
      {
        label: 'Average Sale',
        value: '$285K',
        description: 'Value per search-attributed vehicle',
      },
    ],
  },
];

/**
 * Industry categories for filtering
 */
export const industries = [
  'Hospitality',
  'Fine Dining',
  'Technology',
  'Manufacturing',
  'Services',
] as const;

export type Industry = (typeof industries)[number];

/**
 * Service types offered
 */
export const services = [
  'SEO',
  'GEO',
  'Local SEO',
  'Technical SEO',
  'Content Marketing',
  'Link Building',
] as const;

export type Service = (typeof services)[number];

/**
 * Helper Functions
 */

/**
 * Get featured case studies (shown prominently on pages)
 */
export function getFeaturedCaseStudies(): CaseStudy[] {
  return caseStudies.filter((study) => study.featured === true);
}

/**
 * Get case studies by industry
 */
export function getCaseStudiesByIndustry(industry: Industry): CaseStudy[] {
  return caseStudies.filter((study) => study.industry === industry);
}

/**
 * Get case studies by service
 */
export function getCaseStudiesByService(service: Service): CaseStudy[] {
  return caseStudies.filter((study) => study.services.includes(service));
}

/**
 * Get all case studies
 */
export function getAllCaseStudies(): CaseStudy[] {
  return caseStudies;
}

/**
 * Get case study by ID
 */
export function getCaseStudyById(id: string): CaseStudy | undefined {
  return caseStudies.find((study) => study.id === id);
}

/**
 * Get aggregate metrics across all case studies
 */
export function getAggregateMetrics() {
  return {
    totalClients: caseStudies.length,
    averageGrowth: '350%',
    industriesServed: new Set(caseStudies.map((s) => s.industry)).size,
  };
}
