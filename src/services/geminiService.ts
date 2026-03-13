import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || '' });

export async function generatePremiumImage(prompt: string, aspectRatio: "1:1" | "16:9" | "9:16" | "4:3" | "3:4" = "16:9") {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3.1-flash-image-preview',
      contents: [{ parts: [{ text: prompt }] }],
      config: {
        imageConfig: {
          aspectRatio,
          imageSize: "1K"
        }
      }
    });

    for (const part of response.candidates?.[0]?.content?.parts || []) {
      if (part.inlineData) {
        return `data:image/png;base64,${part.inlineData.data}`;
      }
    }
  } catch (error) {
    console.error("Error generating image:", error);
  }
  return null;
}

export async function analyzeImageAesthetic(base64Image: string) {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3.1-flash-preview',
      contents: [
        {
          parts: [
            { text: "Analyze the aesthetic of this image. Is it premium, minimalist, and elegant? Suggest improvements to make it look like a luxury wellness brand campaign." },
            {
              inlineData: {
                mimeType: "image/png",
                data: base64Image.split(',')[1]
              }
            }
          ]
        }
      ]
    });
    return response.text;
  } catch (error) {
    console.error("Error analyzing image:", error);
    return null;
  }
}
