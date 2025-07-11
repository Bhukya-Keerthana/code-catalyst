import { generateText } from "ai";
import { groq } from "@ai-sdk/groq"; 

import { db } from "@/firebase/admin";
import { getRandomInterviewCover } from "@/lib/utils";

export async function POST(request: Request) {
  const { type, role, level, techstack, amount, userid } = await request.json();

  try {
    const { text: questionsText } = await generateText({
      model: groq("llama3-70b-8192"), 
      prompt: `Prepare questions for a job interview.
        The job role is ${role}.
        The job experience level is ${level}.
        The tech stack used in the job is: ${techstack}.
        The focus between behavioural and technical questions should lean towards: ${type}.
        The amount of questions required is: ${amount}.
        Respond ONLY with a JSON array of strings, no explanation or extra text.
        Please return only the questions, without any additional text.
        The questions are going to be read by a voice assistant so do not use "/" or "*" or any other special characters which might break the voice assistant.
        Return the questions formatted like this:
        ["Question 1", "Question 2", "Question 3"]
        
        Thank you! <3
    `,
      
    });

    let questions: string[] = [];
    try {
      questions = JSON.parse(questionsText);
      if (!Array.isArray(questions)) throw new Error("Questions is not an array.");
    } catch (error) {
      console.error("Failed to parse questions JSON:", error);
      return Response.json({ success: false, error: "Invalid questions format" }, { status: 400 });
    }

    const interview = {
      role,
      type,
      level,
      techstack: techstack.split(",").map((tech: string) => tech.trim()),
      questions,
      userId: userid,
      finalized: true,
      coverImage: getRandomInterviewCover(),
      createdAt: new Date().toISOString(),
    };

    const interviewRef = await db.collection("interviews").add(interview);

    return Response.json({ success: true, id: interviewRef.id }, { status: 200 });
  } catch (error) {
    console.error("Error generating interview:", error);
    return Response.json({ success: false, error: error instanceof Error ? error.message : "Unknown error" }, { status: 500 });
  }
}

export async function GET() {
  return Response.json({ success: true, data: "Thank you!" }, { status: 200 });
}
