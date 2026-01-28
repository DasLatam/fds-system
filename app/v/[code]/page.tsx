import VerifyClient from "./VerifyClient";

export default function Page({ params }: { params: { code: string } }) {
  const code = params?.code ?? "";
  return <VerifyClient code={code} />;
}
