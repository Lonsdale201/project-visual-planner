export interface PresetOption {
  value: string;
  label: string;
  abbr: string;
  color: string;
  bg: string;
}

export const integrationPresets: PresetOption[] = [
  { value: 'discord', label: 'Discord', abbr: 'DC', color: '#5865F2', bg: '#EEF1FF' },
  { value: 'slack', label: 'Slack', abbr: 'SL', color: '#4A154B', bg: '#F7EEF7' },
  { value: 'facebook', label: 'Facebook', abbr: 'FB', color: '#1877F2', bg: '#EDF4FF' },
  { value: 'wordpress', label: 'WordPress', abbr: 'WP', color: '#21759B', bg: '#ECF7FC' },
  { value: 'supabase', label: 'Supabase', abbr: 'SB', color: '#3ECF8E', bg: '#EEFCF5' },
  { value: 'zoho', label: 'Zoho', abbr: 'ZH', color: '#E42527', bg: '#FFEFF0' },
  { value: 'stripe', label: 'Stripe', abbr: 'ST', color: '#635BFF', bg: '#F1EFFF' },
  { value: 'paypal', label: 'PayPal', abbr: 'PP', color: '#003087', bg: '#EAF2FF' },
  { value: 'github', label: 'GitHub', abbr: 'GH', color: '#24292F', bg: '#F2F4F6' },
  { value: 'gitlab', label: 'GitLab', abbr: 'GL', color: '#FC6D26', bg: '#FFF2EA' },
  { value: 'bitbucket', label: 'Bitbucket', abbr: 'BB', color: '#0052CC', bg: '#EAF0FF' },
  { value: 'jira', label: 'Jira', abbr: 'JR', color: '#0052CC', bg: '#EAF0FF' },
  { value: 'trello', label: 'Trello', abbr: 'TR', color: '#0079BF', bg: '#EAF6FF' },
  { value: 'notion', label: 'Notion', abbr: 'NT', color: '#111111', bg: '#F4F4F4' },
  { value: 'airtable', label: 'Airtable', abbr: 'AT', color: '#FCB400', bg: '#FFF7E6' },
  { value: 'figma', label: 'Figma', abbr: 'FG', color: '#A259FF', bg: '#F5EEFF' },
  { value: 'google-drive', label: 'Google Drive', abbr: 'GD', color: '#0F9D58', bg: '#EBFAF2' },
  { value: 'google-sheets', label: 'Google Sheets', abbr: 'GS', color: '#188038', bg: '#EAF7EE' },
  { value: 'google-calendar', label: 'Google Calendar', abbr: 'GC', color: '#4285F4', bg: '#ECF3FF' },
  { value: 'gmail', label: 'Gmail', abbr: 'GM', color: '#EA4335', bg: '#FFF0EE' },
  { value: 'outlook', label: 'Outlook', abbr: 'OL', color: '#0078D4', bg: '#EBF5FF' },
  { value: 'teams', label: 'Microsoft Teams', abbr: 'MT', color: '#6264A7', bg: '#F0F0FA' },
  { value: 'twilio', label: 'Twilio', abbr: 'TW', color: '#F22F46', bg: '#FFEFF2' },
  { value: 'mailchimp', label: 'Mailchimp', abbr: 'MC', color: '#FFE01B', bg: '#FFFCE8' },
  { value: 'sendgrid', label: 'SendGrid', abbr: 'SG', color: '#1A82E2', bg: '#ECF5FF' },
  { value: 'shopify', label: 'Shopify', abbr: 'SP', color: '#95BF47', bg: '#F3F8E9' },
  { value: 'woocommerce', label: 'WooCommerce', abbr: 'WC', color: '#7F54B3', bg: '#F3EFF9' },
  { value: 'hubspot', label: 'HubSpot', abbr: 'HB', color: '#FF7A59', bg: '#FFF2EE' },
  { value: 'salesforce', label: 'Salesforce', abbr: 'SF', color: '#00A1E0', bg: '#EAF8FF' },
  { value: 'intercom', label: 'Intercom', abbr: 'IC', color: '#1F8DED', bg: '#ECF5FF' },
  { value: 'zapier', label: 'Zapier', abbr: 'ZP', color: '#FF4A00', bg: '#FFF1EB' },
  { value: 'openai', label: 'OpenAI', abbr: 'AI', color: '#10A37F', bg: '#EBF9F5' },
  { value: 'anthropic', label: 'Anthropic', abbr: 'AN', color: '#D97706', bg: '#FFF5E8' },
  { value: 'aws-s3', label: 'AWS S3', abbr: 'S3', color: '#FF9900', bg: '#FFF6EA' },
  { value: 'cloudflare', label: 'Cloudflare', abbr: 'CF', color: '#F38020', bg: '#FFF3E9' },
  { value: 'mongodb-atlas', label: 'MongoDB Atlas', abbr: 'MG', color: '#00ED64', bg: '#E9FFF4' },
];

export const infraPresets: PresetOption[] = [
  { value: 'aws', label: 'AWS', abbr: 'AWS', color: '#FF9900', bg: '#FFF5E9' },
  { value: 'gcp', label: 'Google Cloud', abbr: 'GCP', color: '#4285F4', bg: '#ECF3FF' },
  { value: 'azure', label: 'Azure', abbr: 'AZ', color: '#0078D4', bg: '#EBF5FF' },
  { value: 'cloudflare', label: 'Cloudflare', abbr: 'CF', color: '#F38020', bg: '#FFF3E9' },
  { value: 'vercel', label: 'Vercel', abbr: 'VR', color: '#111827', bg: '#F3F4F6' },
  { value: 'netlify', label: 'Netlify', abbr: 'NL', color: '#00AD9F', bg: '#E9FBF9' },
  { value: 'render', label: 'Render', abbr: 'RD', color: '#5A67D8', bg: '#EEF0FF' },
  { value: 'railway', label: 'Railway', abbr: 'RW', color: '#8B5CF6', bg: '#F3EDFF' },
  { value: 'docker', label: 'Docker', abbr: 'DK', color: '#2496ED', bg: '#ECF7FF' },
  { value: 'kubernetes', label: 'Kubernetes', abbr: 'K8', color: '#326CE5', bg: '#ECF1FF' },
  { value: 'nginx', label: 'Nginx', abbr: 'NG', color: '#009639', bg: '#EBF8F0' },
  { value: 'apache', label: 'Apache', abbr: 'AP', color: '#D22128', bg: '#FFEEEE' },
  { value: 'traefik', label: 'Traefik', abbr: 'TF', color: '#24A1C1', bg: '#EAF8FC' },
  { value: 'heroku', label: 'Heroku', abbr: 'HK', color: '#6762A6', bg: '#F1F0FA' },
  { value: 'digitalocean', label: 'DigitalOcean', abbr: 'DO', color: '#0080FF', bg: '#EAF4FF' },
  { value: 'linode', label: 'Linode', abbr: 'LN', color: '#00B159', bg: '#E9FAF0' },
  { value: 'ovh', label: 'OVHcloud', abbr: 'OV', color: '#123F6D', bg: '#EDF3FA' },
  { value: 'fly-io', label: 'Fly.io', abbr: 'FL', color: '#7B61FF', bg: '#F1EEFF' },
  { value: 'firebase-hosting', label: 'Firebase Hosting', abbr: 'FB', color: '#FFCA28', bg: '#FFF8E8' },
  { value: 'on-premise', label: 'On-Premise', abbr: 'OP', color: '#607D8B', bg: '#EEF3F5' },
];

export const frameworkPresets: PresetOption[] = [
  { value: 'wordpress', label: 'WordPress', abbr: 'WP', color: '#21759B', bg: '#ECF7FC' },
  { value: 'joomla', label: 'Joomla', abbr: 'JM', color: '#F44321', bg: '#FFF1ED' },
  { value: 'drupal', label: 'Drupal', abbr: 'DR', color: '#0678BE', bg: '#EAF6FF' },
  { value: 'strapi', label: 'Strapi', abbr: 'ST', color: '#4945FF', bg: '#F0EFFF' },
  { value: 'nextjs', label: 'Next.js', abbr: 'NX', color: '#111827', bg: '#F3F4F6' },
  { value: 'nuxt', label: 'Nuxt', abbr: 'NU', color: '#00DC82', bg: '#E9FBF2' },
  { value: 'remix', label: 'Remix', abbr: 'RX', color: '#121212', bg: '#F4F4F5' },
  { value: 'react', label: 'React', abbr: 'RE', color: '#149ECA', bg: '#E9F8FE' },
  { value: 'angular', label: 'Angular', abbr: 'NG', color: '#DD0031', bg: '#FEECEF' },
  { value: 'vue', label: 'Vue', abbr: 'VU', color: '#42B883', bg: '#ECFAF4' },
  { value: 'svelte', label: 'Svelte', abbr: 'SV', color: '#FF3E00', bg: '#FFF1EC' },
  { value: 'laravel', label: 'Laravel', abbr: 'LV', color: '#FF2D20', bg: '#FFF0EE' },
  { value: 'django', label: 'Django', abbr: 'DJ', color: '#092E20', bg: '#EEF5F2' },
  { value: 'rails', label: 'Ruby on Rails', abbr: 'RB', color: '#CC0000', bg: '#FFEEEE' },
  { value: 'springboot', label: 'Spring Boot', abbr: 'SP', color: '#6DB33F', bg: '#EFF9E8' },
  { value: 'nestjs', label: 'NestJS', abbr: 'NE', color: '#E0234E', bg: '#FEEEF2' },
  { value: 'express', label: 'Express', abbr: 'EX', color: '#111827', bg: '#F3F4F6' },
  { value: 'fastapi', label: 'FastAPI', abbr: 'FA', color: '#009688', bg: '#EAF8F6' },
  { value: 'flask', label: 'Flask', abbr: 'FL', color: '#111827', bg: '#F3F4F6' },
  { value: 'symfony', label: 'Symfony', abbr: 'SY', color: '#111827', bg: '#F3F4F6' },
  { value: 'aspnet', label: 'ASP.NET Core', abbr: 'AS', color: '#512BD4', bg: '#F0EBFF' },
];

export const stackPresets: PresetOption[] = [
  { value: 'typescript', label: 'TypeScript', abbr: 'TS', color: '#3178C6', bg: '#EAF3FF' },
  { value: 'javascript', label: 'JavaScript', abbr: 'JS', color: '#D5A800', bg: '#FFF9E8' },
  { value: 'react', label: 'React', abbr: 'RE', color: '#149ECA', bg: '#E9F8FE' },
  { value: 'react-native', label: 'React Native', abbr: 'RN', color: '#149ECA', bg: '#E9F8FE' },
  { value: 'nodejs', label: 'Node.js', abbr: 'ND', color: '#43853D', bg: '#EDF8EC' },
  { value: 'php', label: 'PHP', abbr: 'PH', color: '#777BB4', bg: '#F1F2FB' },
  { value: 'python', label: 'Python', abbr: 'PY', color: '#E5B000', bg: '#FFF8E6' },
  { value: 'go', label: 'Go', abbr: 'GO', color: '#00ADD8', bg: '#E8F9FD' },
  { value: 'rust', label: 'Rust', abbr: 'RS', color: '#B7410E', bg: '#FFF1EA' },
  { value: 'java', label: 'Java', abbr: 'JV', color: '#F89820', bg: '#FFF4E8' },
  { value: 'kotlin', label: 'Kotlin', abbr: 'KT', color: '#7F52FF', bg: '#F2EEFF' },
  { value: 'swift', label: 'Swift', abbr: 'SW', color: '#FA7343', bg: '#FFF2EC' },
  { value: 'flutter', label: 'Flutter', abbr: 'FL', color: '#02569B', bg: '#EAF3FB' },
  { value: 'vue', label: 'Vue', abbr: 'VU', color: '#42B883', bg: '#ECFAF4' },
  { value: 'angular', label: 'Angular', abbr: 'NG', color: '#DD0031', bg: '#FEECEF' },
  { value: 'svelte', label: 'Svelte', abbr: 'SV', color: '#FF3E00', bg: '#FFF1EC' },
  { value: 'nextjs', label: 'Next.js', abbr: 'NX', color: '#111827', bg: '#F3F4F6' },
  { value: 'nuxt', label: 'Nuxt', abbr: 'NU', color: '#00DC82', bg: '#E9FBF2' },
  { value: 'tailwindcss', label: 'Tailwind CSS', abbr: 'TW', color: '#06B6D4', bg: '#E9FBFF' },
  { value: 'docker', label: 'Docker', abbr: 'DK', color: '#2496ED', bg: '#ECF7FF' },
  { value: 'aws', label: 'AWS', abbr: 'AWS', color: '#FF9900', bg: '#FFF5E9' },
  { value: 'postgresql', label: 'PostgreSQL', abbr: 'PG', color: '#336791', bg: '#EDF3F8' },
  { value: 'mysql', label: 'MySQL', abbr: 'MY', color: '#00758F', bg: '#EAF6F9' },
  { value: 'mongodb', label: 'MongoDB', abbr: 'MG', color: '#00ED64', bg: '#E9FFF4' },
  { value: 'redis', label: 'Redis', abbr: 'RD', color: '#DC382D', bg: '#FFEFEF' },
  { value: 'graphql', label: 'GraphQL', abbr: 'GQ', color: '#E10098', bg: '#FDECF7' },
];

export function findPresetByLabel(options: PresetOption[], label: string): PresetOption | undefined {
  const normalized = label.trim().toLowerCase();
  if (!normalized) return undefined;
  return options.find(opt => opt.label.toLowerCase() === normalized);
}
