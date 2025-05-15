export const generatePromptText = (details: any, transcript: string) => `
  Act as a YouTube content optimization expert. Based on the following details, generate:
  - 5 optimized SEO titles
  - A detailed description
  - 10 relevant hashtags
  - Key timestamps

  📌 **Video Details**:
  - Title: ${details.title}
  - Description: ${details.description}
  - Tags: ${details.tags.join(", ")}
  - Channel: ${details.channelTitle}

  📌 **Transcript**:
  ${transcript}
  
  - 1. 5 SEO-optimized and engaging titles that accurately reflect the actual content of the video.
  - 2. A detailed and optimized description that includes:
      • A complete summary of the content
      • Key points covered
  - 3. 10 relevant and specific hashtags.
  - 4. Timestamps for the most important moments in the video.

  For timestamps, please use exactly this format:
  00:00 Key moment title  
  05:30 Another important moment  
  10:45 Another key section  
  ...and so on
  
  Only include the time in MM:SS or HH:MM:SS format (for longer videos), followed directly by the title of the moment, without dashes or other characters. Each timestamp should be on a new line.
  
  **IMPORTANT:**  
  - Respond **only** with a valid JSON object.  
  - Do **not** include any text, explanations, or formatting (like triple backticks).  
  - The response must strictly follow this structure:
    
    {
        "titles": [
        "Title 1",
        "Title 2",
        "Title 3",
        "Title 4",
        "Title 5"
        ],
        "description": "Your detailed and optimized description here.",
        "hashtags": [
        "#hashtag1",
        "#hashtag2",
        "#hashtag3",
        "#hashtag4",
        "#hashtag5",
        "#hashtag6",
        "#hashtag7",
        "#hashtag8",
        "#hashtag9",
        "#hashtag10"
        ],
        "timestamps": "00:00 Key moment title\\n05:30 Another important moment\\n10:45 Another key section"
    }
`;
