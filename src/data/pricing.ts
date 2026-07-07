export interface PricingPlan {
  id: string;
  name: string;
  info: string;
  /** One-time, project-based price — free-form: "$8k", "from $24k", "Custom". */
  price: string;
  timeline: string;
  features: string[];
  cta: string;
  highlighted?: boolean;
}

export interface PricingService {
  slug: string;
  label: string;
  hue: string;
  plans: PricingPlan[];
}

/** Default rate cards for the /pricing page — editable in Admin → Site content → Pricing. */
export const PRICING: PricingService[] = [
  {
    slug: 'web',
    label: 'Web Development',
    hue: '#ff813a',
    plans: [
      {
        id: 'web-1',
        name: 'Starter site',
        info: 'A clean, fast site for new businesses and small teams.',
        price: '$8k',
        timeline: '4 – 6 weeks',
        features: ['Up to 6 pages', 'Mobile-friendly design', 'Basic CMS', '30-day support'],
        cta: 'Start this project',
      },
      {
        id: 'web-2',
        name: 'Growth site',
        info: 'A full rebuild for companies replacing an outdated site.',
        price: 'from $24k',
        timeline: '6 – 10 weeks',
        features: ['Up to 12 pages', 'Full CMS + admin', 'Custom animations', 'Built-in analytics', '90-day support'],
        cta: 'Start this project',
        highlighted: true,
      },
      {
        id: 'web-3',
        name: 'Custom build',
        info: 'Complex products, portals, and web apps — scoped to fit.',
        price: 'Custom',
        timeline: 'Scoped per project',
        features: ['Custom features', 'Third-party integrations', 'Team training', 'Ongoing support'],
        cta: 'Scope it with us',
      },
    ],
  },
  {
    slug: 'marketing',
    label: 'Marketing',
    hue: '#ff6b1a',
    plans: [
      {
        id: 'mkt-1',
        name: 'Growth audit',
        info: 'A deep look at your funnel with quick wins you can ship now.',
        price: '$5k',
        timeline: '3 weeks',
        features: ['Channel + funnel audit', 'Tracking setup', 'Quick-win fixes', '90-day roadmap'],
        cta: 'Start this project',
      },
      {
        id: 'mkt-2',
        name: '90-day sprint',
        info: 'A focused push across two channels to find what converts.',
        price: 'from $18k',
        timeline: '12 weeks',
        features: ['2 ad channels', 'Weekly experiments', 'Ad creative included', 'SEO foundations', 'Live dashboard'],
        cta: 'Start this project',
        highlighted: true,
      },
      {
        id: 'mkt-3',
        name: 'Full launch',
        info: 'Multi-channel go-to-market for a product or rebrand.',
        price: 'Custom',
        timeline: 'Scoped per project',
        features: ['All channels', 'Senior strategy', 'Content + creative', 'Team handoff'],
        cta: 'Scope it with us',
      },
    ],
  },
  {
    slug: 'startup',
    label: 'Startup Support',
    hue: '#cc6622',
    plans: [
      {
        id: 'stp-1',
        name: 'Pitch sprint',
        info: 'Everything a founder needs to raise a first round.',
        price: '$8k',
        timeline: '2 weeks',
        features: ['Pitch deck', 'One-pager', 'Brand direction', 'Landing page'],
        cta: 'Start this project',
      },
      {
        id: 'stp-2',
        name: 'Full launch',
        info: 'Idea to live product, with your first customers mapped.',
        price: 'from $35k',
        timeline: '8 weeks',
        features: ['Brand identity', 'MVP build', 'Landing page', '90-day launch plan'],
        cta: 'Start this project',
        highlighted: true,
      },
      {
        id: 'stp-3',
        name: 'Product partner',
        info: 'A dedicated design + build team for your next milestone.',
        price: 'Custom',
        timeline: 'Scoped per milestone',
        features: ['Dedicated team', 'Design + dev', 'Weekly sprints', 'Strategy calls'],
        cta: 'Scope it with us',
      },
    ],
  },
  {
    slug: 'ops',
    label: 'Operations',
    hue: '#ffa870',
    plans: [
      {
        id: 'ops-1',
        name: 'Ops audit',
        info: 'Find where time and money leak before you fix anything.',
        price: '$4k',
        timeline: '3 weeks',
        features: ['Team interviews', 'Tool + cost review', 'Priority memo', 'Fix-it roadmap'],
        cta: 'Start this project',
      },
      {
        id: 'ops-2',
        name: 'Systems overhaul',
        info: 'We rebuild your tool stack and routines end to end.',
        price: 'from $16k',
        timeline: '8 weeks',
        features: ['CRM + pipeline setup', 'Tool consolidation', 'Team playbooks', 'Weekly reporting'],
        cta: 'Start this project',
        highlighted: true,
      },
      {
        id: 'ops-3',
        name: 'Scale-ready ops',
        info: 'Deep operational rebuilds for larger, complex teams.',
        price: 'Custom',
        timeline: 'Scoped per project',
        features: ['Senior operator', 'Vendor management', 'Hiring systems', 'Board reporting'],
        cta: 'Scope it with us',
      },
    ],
  },
  {
    slug: 'content',
    label: 'Content',
    hue: '#ff9a5c',
    plans: [
      {
        id: 'cnt-1',
        name: 'Voice + pilot',
        info: 'Nail your voice and test it with three real pieces.',
        price: '$5k',
        timeline: '4 weeks',
        features: ['Brand voice guide', 'Three articles', 'Topic plan', 'Brief template'],
        cta: 'Start this project',
      },
      {
        id: 'cnt-2',
        name: 'Content engine',
        info: 'A 12-week library sprint that fuels SEO for a year.',
        price: 'from $14k',
        timeline: '12 weeks',
        features: ['12 long-form articles', 'SEO optimization', 'Landing copy', 'Content calendar'],
        cta: 'Start this project',
        highlighted: true,
      },
      {
        id: 'cnt-3',
        name: 'Full library',
        info: 'Site-wide copy, docs, and campaigns — scoped to fit.',
        price: 'Custom',
        timeline: 'Scoped per project',
        features: ['Site copy', 'Email sequences', 'Sales collateral', 'Editor handoff'],
        cta: 'Scope it with us',
      },
    ],
  },
  {
    slug: 'app',
    label: 'App Development',
    hue: '#ea580c',
    plans: [
      {
        id: 'app-1',
        name: 'MVP',
        info: 'Test your idea with real users on one platform.',
        price: 'from $20k',
        timeline: '8 weeks',
        features: ['Core features', '1 platform', 'App store launch', '30-day support'],
        cta: 'Start this project',
      },
      {
        id: 'app-2',
        name: 'Full app',
        info: 'A polished launch on both platforms.',
        price: 'from $45k',
        timeline: '12 weeks',
        features: ['All features', 'iOS + Android', 'Full design system', 'Backend + APIs', '90-day support'],
        cta: 'Start this project',
        highlighted: true,
      },
      {
        id: 'app-3',
        name: 'Product suite',
        info: 'Complex apps with integrations and compliance needs.',
        price: 'Custom',
        timeline: 'Scoped per project',
        features: ['Custom architecture', 'Integrations', 'Security review', 'Team training'],
        cta: 'Scope it with us',
      },
    ],
  },
  {
    slug: 'chatbot',
    label: 'Chatbot',
    hue: '#c2410c',
    plans: [
      {
        id: 'bot-1',
        name: 'Quick bot',
        info: 'Test AI support on a single channel.',
        price: '$6k',
        timeline: '3 weeks',
        features: ['Basic flows', '1 channel', 'Training data prep', '2-week monitoring'],
        cta: 'Start this project',
      },
      {
        id: 'bot-2',
        name: 'Full assistant',
        info: 'A trained agent across your support channels.',
        price: 'from $15k',
        timeline: '6 weeks',
        features: ['Custom training', 'Multi-channel', 'CRM integration', 'Analytics', '30-day tuning'],
        cta: 'Start this project',
        highlighted: true,
      },
      {
        id: 'bot-3',
        name: 'Enterprise',
        info: 'Fine-tuned models with compliance and on-premise options.',
        price: 'Custom',
        timeline: 'Scoped per project',
        features: ['Fine-tuned LLM', 'On-premise deploy', 'Compliance review', 'Dedicated support'],
        cta: 'Scope it with us',
      },
    ],
  },
  {
    slug: 'automation',
    label: 'Automation',
    hue: '#d97706',
    plans: [
      {
        id: 'aut-1',
        name: 'Quick wins',
        info: 'Kill your top three manual tasks in two weeks.',
        price: '$5k',
        timeline: '2 weeks',
        features: ['3 workflows', 'Basic integrations', 'Documentation', '30-day support'],
        cta: 'Start this project',
      },
      {
        id: 'aut-2',
        name: 'Full stack',
        info: 'Your whole tool stack, connected and automated.',
        price: 'from $12k',
        timeline: '6 weeks',
        features: ['10+ workflows', 'Custom integrations', 'Error handling', 'Live dashboard', '90-day support'],
        cta: 'Start this project',
        highlighted: true,
      },
      {
        id: 'aut-3',
        name: 'Company-wide',
        info: 'Automation across departments, with custom code.',
        price: 'Custom',
        timeline: 'Scoped per project',
        features: ['Custom scripts + APIs', 'Cross-team rollout', 'Monitoring', 'Team training'],
        cta: 'Scope it with us',
      },
    ],
  },
];
