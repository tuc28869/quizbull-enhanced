require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const JSON5 = require('json5');

const app = express();
const PORT = process.env.PORT || 5000;

// Configure Helmet with custom CSP (CSP ERROR FIX)
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'"],
      fontSrc: ["'self'"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: ["'none'"],
    },
  },
}));

app.use(cors());
app.use(express.json());

// Function to call Perplexity API using fetch (CSP-SAFE)
async function callPerplexityAPI(prompt) {
  const API_KEY = process.env.PERPLEXITY_API_KEY;
  
  if (!API_KEY) {
    throw new Error('PERPLEXITY_API_KEY not found in environment variables');
  }

  const response = await fetch('https://api.perplexity.ai/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${API_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model: 'llama-3.1-sonar-small-128k-online',
      messages: [
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.2,
      max_tokens: 4000
    })
  });

  if (!response.ok) {
    throw new Error(`Perplexity API error: ${response.status}`);
  }

  return response.json();
}

// CSP-SAFE JSON parsing function (MAIN FIX FOR CSP ERROR)
function parseJSONSafely(text) {
  // First try standard JSON.parse
  try {
    return JSON.parse(text);
  } catch (initialError) {
    try {
      // If that fails, try JSON5 for relaxed JSON
      return JSON5.parse(text);
    } catch (json5Error) {
      // If both fail, try basic cleanup then parse
      const cleaned = text
        .replace(/'/g, '"')  // Replace single quotes with double quotes
        .replace(/(\w+):/g, '"$1":')  // Add quotes around unquoted keys
        .replace(/,\s*}/g, '}')  // Remove trailing commas in objects
        .replace(/,\s*]/g, ']');  // Remove trailing commas in arrays
      
      try {
        return JSON.parse(cleaned);
      } catch (finalError) {
        console.error('All JSON parsing attempts failed:', finalError);
        throw new Error('Unable to parse JSON response');
      }
    }
  }
}

// Quiz generation endpoint
app.post('/generate-quiz', async (req, res) => {
  try {
    const { certification } = req.body;
    
    if (!certification) {
      return res.status(400).json({ 
        error: 'Certification type is required' 
      });
    }

    console.log(`Generating quiz for: ${certification}`);

    const prompt = `Generate a quiz for ${certification} certification with exactly 10 multiple choice questions. 

IMPORTANT: Respond ONLY with valid JSON in this exact format:
{
  "questions": [
    {
      "question": "What is the question text?",
      "options": ["Option A", "Option B", "Option C", "Option D"],
      "correctAnswer": 0
    }
  ]
}

Requirements:
- Exactly 10 questions
- Each question must have exactly 4 options
- correctAnswer must be the index (0, 1, 2, or 3) of the correct option
- Questions should be practical and certification-relevant
- No markdown formatting, just pure JSON`;

    let quizData = null;
    const maxAttempts = 3;

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      console.log(`Attempt ${attempt}/${maxAttempts}`);
      
      try {
        const result = await callPerplexityAPI(prompt);
        
        if (!result?.choices?.[0]?.message?.content) {
          console.log(`Attempt ${attempt}: No response content received`);
          continue;
        }

        let responseText = result.choices[0].message.content.trim();
        
      /* ---------------------------- CLEAN OUTPUT --------------------------- */
      let clean = result.text.trim()
        .replace(/```json\s*\n?/g, '')
        .replace(/```/g, ''); // Added closing slash and global flag

        // Find JSON object in the response
        const jsonMatch = responseText.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          responseText = jsonMatch;
        }

        // Parse JSON safely (CSP-SAFE PARSING - THIS FIXES THE ERROR)
        const parsedData = parseJSONSafely(responseText);

        if (!parsedData || !Array.isArray(parsedData?.questions)) {
          console.log(`Attempt ${attempt}: Invalid response structure`);
          continue;
        }

        // Validate questions
        const validQuestions = parsedData.questions.filter(q => 
          q.question && 
          Array.isArray(q.options) && 
          q.options.length === 4 &&
          typeof q.correctAnswer === 'number' &&
          q.correctAnswer >= 0 &&
          q.correctAnswer <= 3
        );

        if (validQuestions.length >= 8) { // Accept if we have at least 8 valid questions
          quizData = {
            questions: validQuestions.slice(0, 10) // Take first 10
          };
          console.log(`Success! Generated ${quizData.questions.length} questions`);
          break;
        } else {
          console.log(`Attempt ${attempt}: Only ${validQuestions.length} valid questions found`);
        }

      } catch (error) {
        console.error(`Attempt ${attempt} failed:`, error.message);
        if (attempt === maxAttempts) {
          throw error;
        }
      }
    }

    if (!quizData) {
      return res.status(500).json({ 
        error: 'Failed to generate valid quiz after multiple attempts' 
      });
    }

    res.json(quizData);

  } catch (error) {
    console.error('Quiz generation error:', error);
    res.status(500).json({ 
      error: 'Failed to generate quiz', 
      details: process.env.NODE_ENV === 'development' ? error.message : undefined 
    });
  }
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

app.listen(PORT, () => {
  console.log(`AI Quiz Server running on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
});