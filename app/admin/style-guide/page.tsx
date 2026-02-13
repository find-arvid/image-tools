import { runStyleGuideAudit } from '@/lib/style-guide-audit';
import { StyleGuideContent } from './style-guide-content';

export default function StyleGuidePage() {
  const audit = runStyleGuideAudit();
  return <StyleGuideContent audit={audit} />;
}
