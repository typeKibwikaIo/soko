import { Page } from '@/components/Page';
import { Button, EmptyState } from '@/components/ui';

export default function NotFound() {
  return (
    <Page>
      <EmptyState
        title="Page not found"
        body="The page you're looking for doesn't exist."
        cta={<Button title="Go home" href="/" style={{ alignSelf: 'center' }} />}
      />
    </Page>
  );
}
