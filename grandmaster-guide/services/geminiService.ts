import { GoogleGenAI, Type } from "@google/genai";
import { DifficultyLevel, TutorResponse } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const getTutorMoveAndComment = async (
  fen: string,
  pgn: string,
  difficulty: DifficultyLevel,
  validMoves: string[]
): Promise<TutorResponse> => {
  
  const modelName = 'gemini-2.5-flash';

  const prompt = `
    You are a chess engine and a tutor playing as Black. The user is playing White.
    
    Current Board (FEN): ${fen}
    Game History (PGN): ${pgn}
    Difficulty Level: ${difficulty}
    Valid Moves for Black: ${validMoves.join(', ')}

    Your Goal:
    1. Select a valid move for Black from the provided list. 
       - If Beginner: Play standard opening principles, occasionally make minor mistakes, explain basics.
       - If Intermediate: Play solid tactical chess, explain tactics (pins, forks) and plans.
       - If Expert: Play strong positional chess, explain deep strategy and long-term weaknesses.
    2. Provide a short, helpful commentary explaining WHY you made your move, or critiquing the user's last move if it was good/bad.
    
    Output strictly in JSON format.
  `;

  try {
    const response = await ai.models.generateContent({
      model: modelName,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            move: {
              type: Type.STRING,
              description: "The move for Black in Standard Algebraic Notation (SAN), e.g., 'Nf6', 'e5', 'O-O'. Must be strictly chosen from the provided valid moves list.",
            },
            commentary: {
              type: Type.STRING,
              description: "Educational commentary suitable for the selected difficulty level.",
            },
          },
          required: ["move", "commentary"],
        },
      },
    });

    const jsonText = response.text;
    if (!jsonText) {
        throw new Error("Empty response from Gemini");
    }

    const result = JSON.parse(jsonText) as TutorResponse;
    return result;

  } catch (error) {
    console.error("Error fetching tutor move:", error);
    // Fallback if AI fails - pick a random valid move and generic message
    const randomMove = validMoves[Math.floor(Math.random() * validMoves.length)];
    return {
      move: randomMove,
      commentary: "I'm having a bit of trouble analyzing right now, so I'll play this move quickly. Your turn!",
    };
  }
};
