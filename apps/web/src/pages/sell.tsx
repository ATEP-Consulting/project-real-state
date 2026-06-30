import type { GetStaticProps } from "next";
import { getQualificationQuestions, type QualificationQuestionConfig } from "@herrera/db";
import { LeadLanding } from "@/components/lead/LeadLanding";

type Props = { questions: QualificationQuestionConfig[] };

export const getStaticProps: GetStaticProps<Props> = async () => {
  let questions: QualificationQuestionConfig[] = [];
  try {
    questions = await getQualificationQuestions("sell");
  } catch (err) {
    console.warn("[sell] questions unavailable:", (err as Error).message);
  }
  return { props: { questions }, revalidate: 300 };
};

export default function SellPage({ questions }: Props) {
  return <LeadLanding intent="sell" questions={questions} />;
}
