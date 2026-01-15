import SignaturePage from '@/components/SignaturePage';

export default function FirmaPage({ params }: { params: { token: string } }) {
  return <SignaturePage token={params.token} />;
}
