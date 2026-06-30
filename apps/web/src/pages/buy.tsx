import type { GetStaticProps } from "next";
import { getQualificationQuestions, type QualificationQuestionConfig } from "@herrera/db";
import { LeadLanding } from "@/components/lead/LeadLanding";

type Props = { questions: QualificationQuestionConfig[] };

export const getStaticProps: GetStaticProps<Props> = async () => {
  let questions: QualificationQuestionConfig[] = [];
  try {
    questions = await getQualificationQuestions("buy");
  } catch (err) {
    console.warn("[buy] questions unavailable:", (err as Error).message);
  }
  return { props: { questions }, revalidate: 300 };
};

export default function BuyPage({ questions }: Props) {
  return <LeadLanding intent="buy" questions={questions} />;
}
