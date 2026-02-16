import React from 'react';
import { Box } from '@mui/material';
import ApiOutlinedIcon from '@mui/icons-material/ApiOutlined';
import AccountTreeOutlinedIcon from '@mui/icons-material/AccountTreeOutlined';
import DataObjectOutlinedIcon from '@mui/icons-material/DataObjectOutlined';
import type { IconType } from 'react-icons';
import {
  SiAngular,
  SiAirtable,
  SiAmazons3,
  SiAnthropic,
  SiBitbucket,
  SiCloudflare,
  SiDjango,
  SiDiscord,
  SiDotnet,
  SiDrupal,
  SiExpress,
  SiFastapi,
  SiFacebook,
  SiFlask,
  SiFigma,
  SiFlutter,
  SiGo,
  SiGraphql,
  SiGithub,
  SiGitlab,
  SiGmail,
  SiGooglecalendar,
  SiGoogledrive,
  SiGooglesheets,
  SiHubspot,
  SiIntercom,
  SiJira,
  SiJoomla,
  SiJavascript,
  SiKotlin,
  SiLaravel,
  SiMailchimp,
  SiMongodb,
  SiMysql,
  SiNestjs,
  SiNextdotjs,
  SiNodedotjs,
  SiNotion,
  SiNuxtdotjs,
  SiOpenjdk,
  SiOpenai,
  SiPaypal,
  SiPhp,
  SiPostgresql,
  SiPython,
  SiReact,
  SiRedis,
  SiRemix,
  SiRubyonrails,
  SiRust,
  SiSalesforce,
  SiSendgrid,
  SiShopify,
  SiSlack,
  SiSpringboot,
  SiStrapi,
  SiStripe,
  SiSupabase,
  SiSvelte,
  SiSwift,
  SiSymfony,
  SiTailwindcss,
  SiTrello,
  SiTwilio,
  SiTypescript,
  SiVuedotjs,
  SiWoocommerce,
  SiWordpress,
  SiZapier,
  SiZoho,
  SiDocker,
  SiAmazonwebservices,
} from 'react-icons/si';
import type { PresetOption } from './presets';

const integrationIconByValue: Record<string, IconType> = {
  discord: SiDiscord,
  slack: SiSlack,
  facebook: SiFacebook,
  wordpress: SiWordpress,
  supabase: SiSupabase,
  zoho: SiZoho,
  stripe: SiStripe,
  paypal: SiPaypal,
  github: SiGithub,
  gitlab: SiGitlab,
  bitbucket: SiBitbucket,
  jira: SiJira,
  trello: SiTrello,
  notion: SiNotion,
  airtable: SiAirtable,
  figma: SiFigma,
  'google-drive': SiGoogledrive,
  'google-sheets': SiGooglesheets,
  'google-calendar': SiGooglecalendar,
  gmail: SiGmail,
  twilio: SiTwilio,
  mailchimp: SiMailchimp,
  sendgrid: SiSendgrid,
  shopify: SiShopify,
  woocommerce: SiWoocommerce,
  hubspot: SiHubspot,
  salesforce: SiSalesforce,
  intercom: SiIntercom,
  zapier: SiZapier,
  openai: SiOpenai,
  anthropic: SiAnthropic,
  'aws-s3': SiAmazons3,
  cloudflare: SiCloudflare,
  'mongodb-atlas': SiMongodb,
};

const frameworkIconByValue: Record<string, IconType> = {
  wordpress: SiWordpress,
  joomla: SiJoomla,
  drupal: SiDrupal,
  strapi: SiStrapi,
  nextjs: SiNextdotjs,
  nuxt: SiNuxtdotjs,
  remix: SiRemix,
  react: SiReact,
  angular: SiAngular,
  vue: SiVuedotjs,
  svelte: SiSvelte,
  laravel: SiLaravel,
  django: SiDjango,
  rails: SiRubyonrails,
  springboot: SiSpringboot,
  nestjs: SiNestjs,
  express: SiExpress,
  fastapi: SiFastapi,
  flask: SiFlask,
  symfony: SiSymfony,
  aspnet: SiDotnet,
};

const stackIconByValue: Record<string, IconType> = {
  typescript: SiTypescript,
  javascript: SiJavascript,
  react: SiReact,
  'react-native': SiReact,
  nodejs: SiNodedotjs,
  php: SiPhp,
  python: SiPython,
  go: SiGo,
  rust: SiRust,
  java: SiOpenjdk,
  kotlin: SiKotlin,
  swift: SiSwift,
  flutter: SiFlutter,
  vue: SiVuedotjs,
  angular: SiAngular,
  svelte: SiSvelte,
  nextjs: SiNextdotjs,
  nuxt: SiNuxtdotjs,
  tailwindcss: SiTailwindcss,
  docker: SiDocker,
  aws: SiAmazonwebservices,
  postgresql: SiPostgresql,
  mysql: SiMysql,
  mongodb: SiMongodb,
  redis: SiRedis,
  graphql: SiGraphql,
};

interface IntegrationPresetIconProps {
  preset?: PresetOption;
  size?: number;
  plain?: boolean;
}

export function IntegrationPresetIcon({ preset, size = 20 }: IntegrationPresetIconProps) {
  const Icon = preset ? integrationIconByValue[preset.value] : undefined;
  const bg = preset?.bg ?? '#eef2f7';
  const color = preset?.color ?? '#64748b';

  return (
    <Box
      sx={{
        width: size,
        height: size,
        borderRadius: '50%',
        border: '1px solid #dbe3ec',
        bgcolor: bg,
        color,
        display: 'grid',
        placeItems: 'center',
        flexShrink: 0,
      }}
    >
      {Icon ? <Icon size={size * 0.62} /> : <ApiOutlinedIcon sx={{ fontSize: size * 0.62 }} />}
    </Box>
  );
}

export function FrameworkPresetIcon({ preset, size = 20 }: IntegrationPresetIconProps) {
  const Icon = preset ? frameworkIconByValue[preset.value] : undefined;
  const bg = preset?.bg ?? '#eef2f7';
  const color = preset?.color ?? '#64748b';

  return (
    <Box
      sx={{
        width: size,
        height: size,
        borderRadius: '50%',
        border: '1px solid #dbe3ec',
        bgcolor: bg,
        color,
        display: 'grid',
        placeItems: 'center',
        flexShrink: 0,
      }}
    >
      {Icon ? <Icon size={size * 0.62} /> : <AccountTreeOutlinedIcon sx={{ fontSize: size * 0.62 }} />}
    </Box>
  );
}

export function TechStackPresetIcon({ preset, size = 20, plain = false }: IntegrationPresetIconProps) {
  const Icon = preset
    ? (stackIconByValue[preset.value] ?? frameworkIconByValue[preset.value])
    : undefined;
  const bg = preset?.bg ?? '#eef2f7';
  const color = preset?.color ?? '#64748b';

  if (plain) {
    return (
      <Box
        sx={{
          width: size,
          height: size,
          color,
          display: 'grid',
          placeItems: 'center',
          flexShrink: 0,
        }}
      >
        {Icon ? <Icon size={size * 0.88} /> : <DataObjectOutlinedIcon sx={{ fontSize: size * 0.88 }} />}
      </Box>
    );
  }

  return (
    <Box
      sx={{
        width: size,
        height: size,
        borderRadius: '50%',
        border: '1px solid #dbe3ec',
        bgcolor: bg,
        color,
        display: 'grid',
        placeItems: 'center',
        flexShrink: 0,
      }}
    >
      {Icon ? <Icon size={size * 0.62} /> : <DataObjectOutlinedIcon sx={{ fontSize: size * 0.62 }} />}
    </Box>
  );
}
